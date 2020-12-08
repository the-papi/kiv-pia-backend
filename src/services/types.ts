import * as apollo from "apollo-server";
import {ChatMessage} from "../entity/ChatMessage";
import {Game} from "../entity/Game";
import {User} from "../entity/User";
import {Player} from "../entity/Player";
import {RedisClient} from "redis";

export interface ChatMessageService {
    create(data: {
        from: User,
        message: string,
    }): Promise<ChatMessage>;

    send(pubSub: apollo.PubSubEngine, chatMessage: ChatMessage): Promise<ChatMessage>;
}

export interface GameService {
    startGame(pubSub: apollo.PubSub, users: User[]): Promise<Game>;
    sendGameRequest(pubSub: apollo.PubSubEngine, redis: RedisClient, fromUser: User, targetUserId: number): Promise<string | null>;
    acceptGameRequest(pubSub: apollo.PubSubEngine, redis: RedisClient, requestId: string): Promise<User[]>;
    getPlayers(game: Game): Promise<Player[]>;
}

export enum UserStatus {
    Online,
    Offline
}

export interface UserService {
    create(data: {
        email: string
        username: string
        password: string
    }): Promise<User>;

    save(user: User);

    setStatus(pubSub: apollo.PubSubEngine, redis: RedisClient, user: User, status: UserStatus);
}
