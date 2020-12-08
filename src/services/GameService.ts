import {getConnection, getCustomRepository, getRepository, In} from "typeorm";
import * as types from "./types"
import {User} from "../entity/User";
import {Game} from "../entity/Game";
import {PlayerAlreadyInGame} from "./exceptions";
import {UserRepository} from "../repositories/User";
import {Player} from "../entity/Player";
import * as apollo from "apollo-server";
import {RedisClient} from "redis";
import * as exceptions from "./exceptions";

function generateRequestId(length: number = 32) {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let str = "";
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return str;
}


export class GameService implements types.GameService {
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

            for (let user of users) {
                let player = new Player();
                player.game = Promise.resolve(game);
                player.user = Promise.resolve(user);
                await playerRepository.save(player)
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
        })    }

    async getPlayers(game: Game): Promise<Player[]> {
        return game.players;
    }
}
