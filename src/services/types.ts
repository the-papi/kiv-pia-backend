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
    startGame(pubSub: apollo.PubSub, users: User[], boardSize: number): Promise<Game>;
    sendGameRequest(pubSub: apollo.PubSubEngine, fromUser: User, targetUserId: number, boardSize: number): Promise<string | null>;
    cancelGameRequest(pubSub: apollo.PubSubEngine, requestId: string): Promise<boolean>;
    acceptGameRequest(pubSub: apollo.PubSubEngine, requestId: string): Promise<{ users: User[], boardSize: number }>;
    rejectGameRequest(pubSub: apollo.PubSubEngine, requestId: string): Promise<boolean>;
    getPlayers(game: Game): Promise<Player[]>;
    placeSymbol(pubSub: apollo.PubSubEngine, user: User, x: number, y: number): Promise<boolean>;
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
    getAllActiveUsers(): Promise<User[]>;
    setStatus(pubSub: apollo.PubSubEngine, user: User, status: UserStatus);
    getStatus(user: User): Promise<UserStatus>;
    getAllUsers(): Promise<User[]>;
    resetPassword(userId: number): Promise<string | null>;
    changeUserRole(userId: number, admin: boolean): Promise<boolean>;
    changePassword(user: User, oldPassword: string, newPassword: string): Promise<boolean>;
}

export enum FriendStatus {
    PendingRequest,
    Friend,
    NotFriend
}

export interface FriendService {
    sendFriendRequest(pubSub: apollo.PubSub, requester: User, foreignUserId: number): Promise<boolean>;
    acceptFriendRequest(pubSub: apollo.PubSub, userId: number): Promise<boolean>;
    rejectFriendRequest(pubSub: apollo.PubSub, userId: number): Promise<boolean>;
    removeFriend(pubSub: apollo.PubSub, user1Id: number, user2Id: number): Promise<void>;
    getFriendRequests(forUser: User): Promise<FriendRequest[]>;
    getFriendStatus(contextUser: User, foreignUser: User): Promise<FriendStatus>
}
