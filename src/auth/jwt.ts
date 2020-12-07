import * as jwt from "jsonwebtoken"
import {Algorithm as JWTAlgorithm, JsonWebTokenError} from "jsonwebtoken";
import {User} from "../entity/User";
import config from "../config";

type TokenType = "access" | "refresh";
export type JWTPayload = null | { [key: string]: any } | string;

abstract class Token {
    protected tokenType: TokenType;
    private _payload: JWTPayload;
    private readonly token: string;

    protected constructor(token?: string) {
        this.token = token;

        if (this.token) {
            this._payload = jwt.decode(this.token);
        }
    }

    set payload(payload: JWTPayload) {
        this._payload = payload;
        this._payload["tokenType"] = this.tokenType;
    }

    get payload(): JWTPayload {
        return this._payload;
    }

    toString(): string {
        return jwt.sign(this.payload, config.secretKey, {
            expiresIn: config.jwt.accessExpireIn,
            algorithm: config.jwt.algorithm as JWTAlgorithm,
        })
    }

    verify(): JWTPayload {
        let data = jwt.verify(this.token, config.secretKey);

        if (this.tokenType != data["tokenType"]) {
            throw new JsonWebTokenError("bad token type")
        }

        return data;
    }
}

export class AccessToken extends Token {
    constructor(token?: string) {
        super(token);
        this.tokenType = "access";
    }
}

export class RefreshToken extends Token {
    constructor(token?: string) {
        super(token);
        this.tokenType = "refresh";
    }
}

export async function forUser(user: User): Promise<{ accessToken: string, refreshToken: string }> {
    let accessToken = new AccessToken();
    accessToken.payload = {userId: user.id};

    let refreshToken = new RefreshToken();
    refreshToken.payload = {userId: user.id};

    return {
        accessToken: accessToken.toString(),
        refreshToken: refreshToken.toString(),
    }
}
