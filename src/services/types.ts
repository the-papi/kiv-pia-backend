import * as apollo from "apollo-server";
import {ChatMessage} from "../entity/ChatMessage";
import {Game} from "../entity/Game";
import {Lobby} from "../entity/Lobby";
import {User} from "../entity/User";
import {Field, ObjectType} from "type-graphql";

export interface ChatMessageService {
    create(data: {
        from: User,
        message: string,
    }): Promise<ChatMessage>;

    send(pubSub: apollo.PubSubEngine, chatMessage: ChatMessage): Promise<ChatMessage>;
}

export interface GameService {
    startForUser(user: User): Promise<Game>;

    players(game: Game): Promise<User[]>;
}

export interface LobbyService {
    create(data: {
        name?: string
    }): Promise<Lobby>;

    save(lobby: Lobby): Promise<Lobby>;

    join(user: User, lobby: Lobby | number): Promise<Lobby>;

    all(): Promise<Lobby[]>;
}

export interface UserService {
    create(data: {
        email: string
        username: string
        password: string
    }): Promise<User>;

    save(user: User);

    online(pubSub: apollo.PubSubEngine, user: User);
}
