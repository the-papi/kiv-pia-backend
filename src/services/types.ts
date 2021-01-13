import * as apollo from "apollo-server";
import {ChatMessage} from "../entity/ChatMessage";
import {Game} from "../entity/Game";
import {User} from "../entity/User";
import {GameSymbol, Player} from "../entity/Player";
import {FriendRequest} from "../entity/FriendRequest";

export interface ChatMessageService {
    /**
     * Creates new instance of the message
     *
     * @param data
     */
    create(data: {
        from: User,
        message: string,
    }): Promise<ChatMessage>;

    /**
     * Sends message created by `create` method
     *
     * @param pubSub
     * @param chatMessage
     */
    send(pubSub: apollo.PubSubEngine, chatMessage: ChatMessage): Promise<ChatMessage>;

    /**
     * Returns all chat messages for the given game
     *
     * @param game
     */
    getChatMessagesForGame(game: Game): Promise<ChatMessage[]>;
}

export interface GameService {
    /**
     * Returns currently active game for the given user
     *
     * @param user
     */
    getActiveGame(user: User): Promise<Game>;

    /**
     * Returns games history for the given user
     *
     * @param user
     */
    gamesHistory(user: User): Promise<Game[]>;

    /**
     * Start game for the given users
     *
     * @param pubSub
     * @param users
     * @param boardSize
     */
    startGame(pubSub: apollo.PubSub, users: User[], boardSize: number): Promise<Game>;

    /**
     * Send game request to another user
     *
     * @param pubSub
     * @param fromUser
     * @param targetUserId
     * @param boardSize
     */
    sendGameRequest(pubSub: apollo.PubSubEngine, fromUser: User, targetUserId: number, boardSize: number): Promise<string | null>;

    /**
     * Cancels game request that was already sent
     *
     * @param pubSub
     * @param requestId
     */
    cancelGameRequest(pubSub: apollo.PubSubEngine, requestId: string): Promise<boolean>;

    /**
     * Accepts game request
     *
     * @param pubSub
     * @param requestId
     */
    acceptGameRequest(pubSub: apollo.PubSubEngine, requestId: string): Promise<{ users: User[], boardSize: number }>;

    /**
     * Rejects game request
     *
     * @param pubSub
     * @param requestId
     */
    rejectGameRequest(pubSub: apollo.PubSubEngine, requestId: string): Promise<boolean>;

    /**
     * Returns all players that are connected to the game
     *
     * @param game
     */
    getPlayers(game: Game): Promise<Player[]>;

    /**
     * Places assigned symbol in the currently active game (for the given user)
     *
     * @param pubSub
     * @param user
     * @param x
     * @param y
     */
    placeSymbol(pubSub: apollo.PubSubEngine, user: User, x: number, y: number): Promise<boolean>;

    /**
     * Returns all game states for the given game
     *
     * @param game
     */
    getGameStates(game: Game): Promise<[{x: number, y: number, symbol: GameSymbol}]>;
}

export enum UserStatus {
    Online,
    Offline
}

export interface UserService {
    /**
     * Creates new user instance from the given data
     *
     * @param data
     */
    create(data: {
        email: string
        username: string
        password: string
    }): Promise<User>;

    /**
     * Saves user instance created by `create` method
     *
     * @param user
     */
    save(user: User);

    /**
     * Returns user from database by given id
     *
     * @param id
     */
    getById(id: number): Promise<User>;

    /**
     * Returns all active users
     */
    getAllActiveUsers(): Promise<User[]>;

    /**
     * Sets status of the given user
     *
     * @param pubSub
     * @param user
     * @param status
     */
    setStatus(pubSub: apollo.PubSubEngine, user: User, status: UserStatus);

    /**
     * Returns status of the given user
     *
     * @param user
     */
    getStatus(user: User): Promise<UserStatus>;

    /**
     * Returns all users
     */
    getAllUsers(): Promise<User[]>;

    /**
     * Generates new random password for the given user and stores it in the database
     *
     * @param userId
     */
    resetPassword(userId: number): Promise<string | null>;

    /**
     * Changes role for the given user and stores it in the database
     *
     * @param userId
     * @param admin
     */
    changeUserRole(userId: number, admin: boolean): Promise<boolean>;

    /**
     * Changes password of the given user while requiring knowledge of the old password.
     *
     * @param user
     * @param oldPassword
     * @param newPassword
     */
    changePassword(user: User, oldPassword: string, newPassword: string): Promise<boolean>;
}

export enum FriendStatus {
    PendingRequest,
    Friend,
    NotFriend
}

export interface FriendService {
    /**
     * Sends friend request from requester to another given user
     *
     * @param pubSub
     * @param requester
     * @param foreignUserId
     */
    sendFriendRequest(pubSub: apollo.PubSub, requester: User, foreignUserId: number): Promise<boolean>;

    /**
     * Accepts friend request
     *
     * @param pubSub
     * @param userId
     */
    acceptFriendRequest(pubSub: apollo.PubSub, userId: number): Promise<boolean>;

    /**
     * Rejects friend request
     *
     * @param pubSub
     * @param userId
     */
    rejectFriendRequest(pubSub: apollo.PubSub, userId: number): Promise<boolean>;

    /**
     * Removes friend from the friend list
     *
     * @param pubSub
     * @param user1Id
     * @param user2Id
     */
    removeFriend(pubSub: apollo.PubSub, user1Id: number, user2Id: number): Promise<void>;

    /**
     * Returns all active friend requests for given user
     * @param forUser
     */
    getFriendRequests(forUser: User): Promise<FriendRequest[]>;

    /**
     * Get friend status for the given pair of users
     *
     * @param contextUser
     * @param foreignUser
     */
    getFriendStatus(contextUser: User, foreignUser: User): Promise<FriendStatus>
}
