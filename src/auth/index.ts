import * as jwt from "jsonwebtoken"
import {getRepository} from "typeorm";
import {User} from "../entity/User";
import config from "../config"
import {AccessToken} from "./jwt";

export async function authenticate(request, credentials: {
    username: string | null,
    password: string | null,
}): Promise<User | null> {
    let user: Promise<User | null> = null;
    for (let authenticationBackend of config.authenticationBackends) {
        user = authenticationBackend.authenticate(request, credentials);
        if (user) {
            break;
        }
    }

    return user;
}

export async function getUser(data: {request?, connectionParams?}): Promise<User | null> {
    let token = data.request?.headers?.authorization?.split(" ")[1];

    if (!token) {
        token = data.connectionParams?.Authorization?.split(" ")[1];
    }

    if (!token) {
        return null;
    }

    let payload = (new AccessToken(token)).verify();

    if (!payload || !(payload["userId"] ?? null)) {
        return null;
    }

    let userRepository = getRepository(User);

    return userRepository.findOne({ id: payload["userId"] });
}
