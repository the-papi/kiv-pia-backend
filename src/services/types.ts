import * as apollo from "apollo-server";
import {ChatMessage} from "../entity/ChatMessage";
import {Game} from "../entity/Game";
import {User} from "../entity/User";
import {GameSymbol, Player} from "../entity/Player";
import {RedisClient} from "redis";
import {FriendRequest} from "../entity/FriendRequest";

export interface ChatMessageService {
    create(data: {
        from: User,
        message: string,
    }): Promise<ChatMessage>;
    send(pubSub: apollo.PubSubEngine, chatMessage: ChatMessage): Promise<ChatMessage>;
    getChatMessagesForGame(game: Game): Promise<ChatMessage[]>;
}

export interface GameService {
    getActiveGame(user: User): Promise<Game>;
    gamesHistory(user: User): Promise<Game[]>;
    startGame(pubSub: apollo.PubSub, users: User[]): Promise<Game>;
    sendGameRequest(pubSub: apollo.PubSubEngine, redis: RedisClient, fromUser: User, targetUserId: number): Promise<string | null>;
    cancelGameRequest(pubSub: apollo.PubSubEngine, redis: RedisClient, requestId: string): Promise<boolean>;
    acceptGameRequest(pubSub: apollo.PubSubEngine, redis: RedisClient, requestId: string): Promise<User[]>;
    rejectGameRequest(pubSub: apollo.PubSubEngine, redis: RedisClient, requestId: string): Promise<boolean>;
    getPlayers(game: Game): Promise<Player[]>;
    placeSymbol(pubSub: apollo.PubSubEngine, redis: RedisClient, user: User, x: number, y: number): Promise<boolean>;
    getGameStates(game: Game): Promise<[{x: number, y: number, symbol: GameSymbol}]>;
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
    getById(id: number): Promise<User>;
    getAllActiveUsers(redis: RedisClient): Promise<User[]>;
    setStatus(pubSub: apollo.PubSubEngine, redis: RedisClient, user: User, status: UserStatus);
    getStatus(redis: RedisClient, user: User): Promise<UserStatus>;
    getAllUsers(): Promise<User[]>;
    resetPassword(userId: number): Promise<string | null>;
}

export interface FriendService {
    sendFriendRequest(requester: User, foreignUserId: number): Promise<boolean>;
    acceptFriendRequest(requestId: number): Promise<boolean>;
    getFriendRequests(forUser: User): Promise<FriendRequest[]>;
}
