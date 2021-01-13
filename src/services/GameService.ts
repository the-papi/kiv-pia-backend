import {getConnection, getCustomRepository, getRepository} from "typeorm";
import * as types from "./types"
import {User} from "../entity/User";
import {Game} from "../entity/Game";
import * as exceptions from "./exceptions";
import {PlayerAlreadyInGame} from "./exceptions";
import {UserRepository} from "../repositories/User";
import {PlayerRepository} from "../repositories/Player";
import {GameSymbol, Player} from "../entity/Player";
import * as apollo from "apollo-server";
import {RedisClient} from "redis";
import {GameState} from "../entity/GameState";
import {GameStateRepository} from "../repositories/Game";
import {inject} from "tsyringe";

function generateRequestId(length: number = 32) {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let str = "";
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return str;
}

export class GameService implements types.GameService {

    readonly requiredSymbolsForWin = 5;
    private readonly redis: RedisClient;

    constructor(
        @inject("redis") redis: RedisClient
    ) {
        this.redis = redis;
    }

    async getActiveGame(user: User): Promise<Game> {
        let userRepository = getCustomRepository(UserRepository);
        return userRepository.findActiveGame(user);
    }

    async gamesHistory(user: User): Promise<Game[]> {
        let userRepository = getCustomRepository(UserRepository);
        return userRepository.gamesHistory(user);
    }

    async startGame(pubSub: apollo.PubSub, users: User[], boardSize: number): Promise<Game> {
        let userRepository = getCustomRepository(UserRepository);

        for (let user of users) {
            if (await userRepository.findActiveGame(user)) {
                throw new PlayerAlreadyInGame();
            }
        }

        let playerRepository = getRepository(Player);
        let gameRepository = getRepository(Game);
        let game = new Game();
        game.boardSize = boardSize;

        return getConnection().transaction(async transactionalEntityManager => {
            game = await gameRepository.save(game);

            let gameSymbols = Math.random() > 0.5 ? [GameSymbol.Circle, GameSymbol.Cross] : [GameSymbol.Cross, GameSymbol.Circle];
            let gameSymbolIterator = 0;
            for (let user of users) {
                let player = new Player();
                player.game = Promise.resolve(game);
                player.user = Promise.resolve(user);
                player.symbol = gameSymbols[gameSymbolIterator];
                await playerRepository.save(player)

                gameSymbolIterator++;
            }
        }).then(value => game);
    }

    async sendGameRequest(pubSub: apollo.PubSubEngine, fromUser: User, targetUserId: number, boardSize: number): Promise<string | null> {
        if (!fromUser || fromUser.id == targetUserId) {
            return null;
        }

        let requestId = generateRequestId()

        await pubSub.publish("GAME_REQUEST", {
            requestId: requestId,
            fromUserId: fromUser.id,
            targetUserId: targetUserId
        });

        this.redis.set(`gameRequests.${requestId}.user.from`, fromUser.id.toString(), "EX", 5 * 60)
        this.redis.set(`gameRequests.${requestId}.user.target`, targetUserId.toString(), "EX", 5 * 60)
        this.redis.set(`gameRequests.${requestId}.user.boardSize`, boardSize.toString(), "EX", 5 * 60)

        return requestId;
    }

    async cancelGameRequest(pubSub: apollo.PubSubEngine, requestId: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            this.redis.get(`gameRequests.${requestId}.user.target`, async (err, targetUserId) => {
                if (!targetUserId) {
                    reject(new exceptions.GameDoesntExist());
                    return;
                }
                this.redis.del(`gameRequests.${requestId}.user.from`);
                this.redis.del(`gameRequests.${requestId}.user.target`);
                await pubSub.publish("GAME_REQUEST", {
                    requestId: requestId,
                    targetUserId: targetUserId,
                    cancelled: true
                });

                resolve(true);
            });
        });
    }

    async acceptGameRequest(pubSub: apollo.PubSubEngine, requestId: string): Promise<{ users: User[], boardSize: number }> {
        return new Promise(async (resolve, reject) => {
            this.redis.get(`gameRequests.${requestId}.user.from`, async (err, fromUserId) => {
                if (!fromUserId) {
                    reject(new exceptions.GameDoesntExist());
                    return;
                }
                this.redis.del(`gameRequests.${requestId}.user.from`);

                this.redis.get(`gameRequests.${requestId}.user.target`, async (err, targetUserId) => {
                    if (!targetUserId) {
                        reject(new exceptions.GameDoesntExist());
                        return;
                    }
                    this.redis.del(`gameRequests.${requestId}.user.target`);

                    let userRepository = getCustomRepository(UserRepository);

                    await pubSub.publish("GAME_RESPONSE", {
                        fromUserId: fromUserId,
                        requestId: requestId,
                        accepted: true
                    });

                    this.redis.get(`gameRequests.${requestId}.user.boardSize`, async (err, boardSize) => {
                        if (err || !boardSize) {
                            throw 'Unknown board size';
                        }

                        resolve({users: await userRepository.findByIds([fromUserId, targetUserId]), boardSize: +boardSize})
                    });
                });
            });
        });
    }

    async rejectGameRequest(pubSub: apollo.PubSubEngine, requestId: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            this.redis.get(`gameRequests.${requestId}.user.from`, async (err, fromUserId) => {
                if (!fromUserId) {
                    reject(new exceptions.GameDoesntExist());
                    return;
                }
                this.redis.del(`gameRequests.${requestId}.user.from`);
                this.redis.del(`gameRequests.${requestId}.user.target`);
                await pubSub.publish("GAME_RESPONSE", {
                    fromUserId: fromUserId,
                    requestId: requestId,
                    accepted: false
                });

                resolve(true);
            });
        });
    }


    async getPlayers(game: Game): Promise<Player[]> {
        return game.players;
    }

    async isPlayerOnTurn(player: Player): Promise<boolean> {
        let gameStateRepository = getCustomRepository(GameStateRepository);
        let crossCount = await gameStateRepository.countSymbols(await player.game, GameSymbol.Cross);
        let circleCount = await gameStateRepository.countSymbols(await player.game, GameSymbol.Circle);

        return (circleCount == crossCount && player.symbol == GameSymbol.Circle)
            || (circleCount != crossCount && player.symbol == GameSymbol.Cross);
    }

    async isFieldOccupied(game: Game, x: number, y: number): Promise<boolean> {
        let gameStateRepository = getCustomRepository(GameStateRepository);
        return gameStateRepository.isFieldOccupied(game, x, y);
    }

    async placeSymbol(pubSub: apollo.PubSubEngine, user: User, x: number, y: number): Promise<boolean> {
        let playerRepository = getCustomRepository(PlayerRepository);
        let gameStateRepository = getRepository(GameState);
        let activePlayer = await playerRepository.findActivePlayer(user);
        const boardSize = (await activePlayer.game).boardSize;

        if (!(x > -Math.ceil(boardSize / 2) && x < Math.ceil(boardSize / 2) &&
            y > -Math.ceil(boardSize / 2) && y < Math.ceil(boardSize / 2))) {
            return false;
        }

        if (!(await activePlayer.game).active) {
            return false;
        }

        if (!await this.isPlayerOnTurn(activePlayer) || await this.isFieldOccupied(await activePlayer.game, x, y)) {
            return false;
        }

        let gameState = new GameState();
        gameState.game = Promise.resolve(await activePlayer.game);
        gameState.player = Promise.resolve(activePlayer);
        gameState.x = x;
        gameState.y = y;
        await gameStateRepository.save(gameState);

        await pubSub.publish("GAME_STATE", {
            x, y,
            type: 'SYMBOL_PLACEMENT',
            symbol: activePlayer.symbol,
            gameId: (await activePlayer.game).id
        });

        if (await this.checkWin(await activePlayer.game, x, y, activePlayer.symbol)) {
            await pubSub.publish("GAME_STATE", {
                type: 'WIN',
                gameId: (await activePlayer.game).id,
                player: activePlayer
            });

            await this.deactivateGame(await activePlayer.game, activePlayer);
        }

        return true;
    }

    async deactivateGame(game: Game, winner?: Player) {
        let gameRepository = getRepository(Game);
        game.active = false;
        if (winner) {
            game.winner = Promise.resolve(winner);
        }
        await gameRepository.save(game);
    }

    async getGameStates(game: Game): Promise<[{ x: number, y: number, symbol: GameSymbol }]> {
        let gameStateRepository = getRepository(GameState);
        // @ts-ignore
        return gameStateRepository.createQueryBuilder("gameState")
            .select(["x", "y"])
            .addSelect("player.symbol", "symbol")
            .innerJoin("gameState.game", "game")
            .innerJoin("gameState.player", "player")
            .where("game.id = :id", {id: game.id})
            .orderBy("gameState.id", "ASC")
            .getRawMany();
    }

    async checkWin(game: Game, lastSymbolX: number, lastSymbolY: number, lastSymbol: GameSymbol): Promise<boolean> {
        let gameStateRepository = getCustomRepository(GameStateRepository);
        let radius = this.requiredSymbolsForWin - 1;
        let fields = await gameStateRepository
            .getFieldsInSquare(game, lastSymbolX, lastSymbolY, radius);

        let symbolsInARow = 0;

        // Check X axis
        for (let x = lastSymbolX - radius; x <= lastSymbolX + radius; x++) {
            if (fields[x][lastSymbolY] == lastSymbol) {
                symbolsInARow++;
            } else {
                symbolsInARow = 0;
            }

            if (symbolsInARow == this.requiredSymbolsForWin) {
                return true;
            }
        }

        // Check Y axis
        for (let y = lastSymbolY - radius; y <= lastSymbolY + radius; y++) {
            if (fields[lastSymbolX][y] == lastSymbol) {
                symbolsInARow++;
            } else {
                symbolsInARow = 0;
            }

            if (symbolsInARow == this.requiredSymbolsForWin) {
                return true;
            }
        }

        // Check diagonal from top-left to bottom-right
        for (let x = lastSymbolX - radius, y = lastSymbolY - radius; x <= lastSymbolX + radius && y <= lastSymbolY + radius; x++, y++) {
            if (fields[x][y] == lastSymbol) {
                symbolsInARow++;
            } else {
                symbolsInARow = 0;
            }

            if (symbolsInARow == this.requiredSymbolsForWin) {
                return true;
            }
        }

        // Check diagonal from bottom-left to top-right
        for (let x = lastSymbolX - radius, y = lastSymbolY + radius; x <= lastSymbolX + radius && y >= lastSymbolY - radius; x++, y--) {
            if (fields[x][y] == lastSymbol) {
                symbolsInARow++;
            } else {
                symbolsInARow = 0;
            }

            if (symbolsInARow == this.requiredSymbolsForWin) {
                return true;
            }
        }

        return false;
    }
}
