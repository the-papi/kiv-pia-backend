import * as apollo from "apollo-server";
import {getRepository} from "typeorm";
import * as types from "./types"
import * as exceptions from "./exceptions"
import {User} from "../entity/User";
import {RedisClient} from "redis";
import {generate as generatePassword} from "generate-password";
import {inject, injectable} from "tsyringe";

@injectable()
export class UserService implements types.UserService {
    private readonly redis: RedisClient;

    constructor(
        @inject("redis") redis: RedisClient
    ) {
        this.redis = redis;
    }

    validatePassword(password: string): boolean {
        return password.length >= 6;
    }

    async create(data: {
        email: string
        username: string
        password: string
    }): Promise<User> {
        if (!this.validatePassword(data.password)) {
            throw new exceptions.PasswordTooWeak();
        }

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

    async getAllActiveUsers(): Promise<User[]> {
        return new Promise(resolve => {
            this.redis.smembers("userStatuses", async (err, userIds) => {
                let res = [];

                for (const userId of userIds) {
                    res.push(await this.getById(+userId));
                }

                resolve(res);
            });
        });
    }

    async getAllUsers(): Promise<User[]> {
        let userRepository = getRepository(User);
        return userRepository.find({
            order: {
                id: "ASC"
            }
        });
    }

    async setStatus(pubSub: apollo.PubSub, user: User, status: types.UserStatus) {
        if (status != types.UserStatus.Offline) {
            this.redis.sadd("userStatuses", user.id.toString());
            this.redis.set(`userStatuses.user.${user.id}.status`, status.toString());
        } else {
            this.redis.srem("userStatuses", user.id.toString());
            this.redis.del(`userStatuses.user.${user.id}.status`);
        }

        await pubSub.publish("USER_STATUS", {status, user})
    }

    async getStatus(user: User): Promise<types.UserStatus> {
        return new Promise(resolve => {
            this.redis.get(`userStatuses.user.${user.id}.status`, (err, userStatus) => {
                if (userStatus !== undefined && userStatus !== null) {
                    resolve(<types.UserStatus><unknown>(+userStatus));
                } else {
                    resolve(types.UserStatus.Offline);
                }
            });
        });
    }

    async resetPassword(userId: number): Promise<string | null> {
        let userRepository = getRepository(User);
        let user = await userRepository.findOne({id: userId});

        if (user) {
            let password = generatePassword({
                length: 16,
                numbers: true,
                symbols: true
            })
            user.password = password;
            await userRepository.save(user);
            return password;
        }

        return null;
    }

    async changeUserRole(userId: number, admin: boolean): Promise<boolean> {
        let userRepository = getRepository(User);
        let user = await userRepository.findOne({id: userId});

        if (user) {
            user.admin = admin;
            await userRepository.save(user);
            return true;
        }

        return false;
    }

    async changePassword(user: User, oldPassword: string, newPassword: string): Promise<boolean> {
        if (user.validatePassword(oldPassword)) {
            let userRepository = getRepository(User);
            user.password = newPassword;
            await userRepository.save(user);
            return true;
        }

        return false;
    }
}
