import * as apollo from "apollo-server";
import {getRepository} from "typeorm";
import * as types from "./types"
import {User} from "../entity/User";
import {RedisClient} from "redis";

export class UserService implements types.UserService {
    async create(data: {
        email: string
        username: string
        password: string
    }): Promise<User> {
        let userRepository = getRepository(User);
        let user = userRepository.create(data);
        user.password = data.password; // userRepository.create won't set it for us

        return user;
    }

    async save(user: User) {
        let userRepository = getRepository(User);
        return userRepository.save(user);
    }

    async getById(id: number): Promise<User> {
        return getRepository(User).findOne({id: id});
    }

    async getAllActiveUsers(redis: RedisClient): Promise<User[]> {
        return new Promise(resolve => {
            redis.smembers("userStatuses", async (err, userIds) => {
                let res = [];

                for (const userId of userIds) {
                    res.push(await this.getById(+userId));
                }

                resolve(res);
            });
        });
    }

    async setStatus(pubSub: apollo.PubSub, redis: RedisClient, user: User, status: types.UserStatus) {
        if (status != types.UserStatus.Offline) {
            redis.sadd("userStatuses", user.id.toString());
            redis.set(`userStatuses.user.${user.id}.status`, status.toString());
        } else {
            redis.srem("userStatuses", user.id.toString());
            redis.del(`userStatuses.user.${user.id}.status`);
        }

        await pubSub.publish("USER_STATUS", {status, user})
    }

    async getStatus(redis: RedisClient, user: User): Promise<types.UserStatus> {
        return new Promise(resolve => {
            redis.get(`userStatuses.user.${user.id}.status`, (err, userStatus) => {
                resolve(<types.UserStatus><unknown>(+userStatus));
            });
        });
    }
}
