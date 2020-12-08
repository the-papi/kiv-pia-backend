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

    async setStatus(pubSub: apollo.PubSub, redis: RedisClient, user: User, status: types.UserStatus) {
        if (status != types.UserStatus.Offline) {
            redis.rpush("onlineUsers", user.id.toString());
        } else {
            redis.lrem("onlineUsers", 1, user.id.toString());
        }

        await pubSub.publish("USER_STATUS", {status, user})
    }
}
