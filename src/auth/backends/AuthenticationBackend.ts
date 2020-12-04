import {User} from "../../entity/User"

export default interface AuthenticationBackend {
    authenticate(request, credentials: {
        username: string | null,
        password: string | null,
    }): Promise<User | null>;
}
