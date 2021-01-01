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

function generateRequestId(length: number = 32) {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let str = "";
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return str;
}

export class GameService implements types.GameService {
    async getActiveGame(user: User): Promise<Game> {
        let userRepository = getCustomRepository(UserRepository);
        return userRepository.findActiveGame(user);
    }

    async startGame(pubSub: apollo.PubSub, users: User[]): Promise<Game> {
        let userRepository = getCustomRepository(UserRepository);

        for (let user of users) {
            if (await userRepository.findActiveGame(user)) {
                throw new PlayerAlreadyInGame();
            }
        }

        let playerRepository = getRepository(Player);
        let gameRepository = getRepository(Game);
        let game = new Game();

        return getConnection().transaction(async transactionalEntityManager => {
            game = await gameRepository.save(game);

            let gameSymbols = [GameSymbol.Circle, GameSymbol.Cross];
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

    async sendGameRequest(pubSub: apollo.PubSubEngine, redis: RedisClient, fromUser: User, targetUserId: number): Promise<string | null> {
        if (!fromUser || fromUser.id == targetUserId) {
            return null;
        }

        let requestId = generateRequestId()

        await pubSub.publish("GAME_REQUEST", {
            requestId: requestId,
            fromUserId: fromUser.id,
            targetUserId: targetUserId
        });

        redis.set(`gameRequests.${requestId}.user.from`, fromUser.id.toString(), "EX", 5 * 60)
        redis.set(`gameRequests.${requestId}.user.target`, targetUserId.toString(), "EX", 5 * 60)

        return requestId;
    }

    async acceptGameRequest(pubSub: apollo.PubSubEngine, redis: RedisClient, requestId: string): Promise<User[]> {
        return new Promise(async (resolve, reject) => {
            redis.get(`gameRequests.${requestId}.user.from`, async (err, fromUserId) => {
                if (!fromUserId) {
                    reject(new exceptions.GameDoesntExist());
                    return;
                }
                redis.del(`gameRequests.${requestId}.user.from`);

                redis.get(`gameRequests.${requestId}.user.target`, async (err, targetUserId) => {
                    if (!targetUserId) {
                        reject(new exceptions.GameDoesntExist());
                        return;
                    }
                    redis.del(`gameRequests.${requestId}.user.target`);

                    let userRepository = getCustomRepository(UserRepository);

                    await pubSub.publish("GAME_RESPONSE", {
                        fromUserId: fromUserId,
                        requestId: requestId,
                        accepted: true
                    });

                    resolve(userRepository.findByIds([fromUserId, targetUserId]))
                })
            })
        })
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

    async placeSymbol(pubSub: apollo.PubSubEngine, redis: RedisClient, user: User, x: number, y: number): Promise<boolean> {
        let playerRepository = getCustomRepository(PlayerRepository);
        let gameStateRepository = getRepository(GameState);
        let activePlayer = await playerRepository.findActivePlayer(user);

        if (!await this.isPlayerOnTurn(activePlayer) || await this.isFieldOccupied(await activePlayer.game, x, y)) {
            return false;
        }

        let gameState = new GameState();
        gameState.game = Promise.resolve(activePlayer.game);
        gameState.player = Promise.resolve(activePlayer);
        gameState.x = x;
        gameState.y = y;
        await gameStateRepository.save(gameState);

        await pubSub.publish("GAME_STATE", {
            x, y,
            symbol: activePlayer.symbol,
            gameId: (await activePlayer.game).id
        });

        return true;
    }

    async getGameStates(game: Game): Promise<[{x: number, y: number, symbol: GameSymbol}]> {
        let gameStateRepository = getRepository(GameState);
        // @ts-ignore
        return gameStateRepository.createQueryBuilder("gameState")
            .select(["x", "y"])
            .addSelect("player.symbol", "symbol")
            .innerJoin("gameState.player", "player")
            .orderBy("gameState.id", "ASC")
            .getRawMany();
    }
}
