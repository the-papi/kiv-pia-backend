import * as apollo from "apollo-server";
import {getRepository} from "typeorm";
import * as types from "./types"
import {User} from "../entity/User";
import {UserStatus} from "../graphql/typedefs/UserStatusUpdate";

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

    async setStatus(pubSub: apollo.PubSub, user: User, status: UserStatus) {
        await pubSub.publish("USER_STATUS_UPDATE", {
            status, user
        })
    }
}
