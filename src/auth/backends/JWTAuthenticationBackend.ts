import {getCustomRepository} from "typeorm";
import AuthenticationBackend from "./AuthenticationBackend";
import {UserRepository} from "../../repositories/User";
import {User} from "../../entity/User";

export default class JWTAuthenticationBackend implements AuthenticationBackend {
    async authenticate(request, credentials: {
        username: string | null,
        password: string | null,
    }): Promise<User | null> {
        let userRepository = getCustomRepository(UserRepository);
        let user = await userRepository.findByUsername(credentials.username);

        if (user && user.validatePassword(credentials.password)) {
            return user;
        }

        return null;
    }
}
