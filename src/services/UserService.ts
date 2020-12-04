import {getRepository} from "typeorm";
import {Service} from "typedi";
import {User} from "../entity/User";

@Service()
export class UserService {
    async create(data: {
        firstName: string
        lastName: string
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
}
