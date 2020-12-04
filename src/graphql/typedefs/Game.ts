import {ObjectType, Field} from "type-graphql";
import {User} from "./User";

@ObjectType()
export class Game {
    @Field(type => [User])
    players: User[];
}

@ObjectType()
export class GameAlreadyStarted {
    @Field()
    message: string;
}

@ObjectType()
export class NotInLobby {
    @Field()
    message: string;
}
