import {ObjectType, Field} from "type-graphql";
import {Player} from "./Player";

@ObjectType()
export class Game {
    @Field(type => [Player])
    players: Player[];
}

@ObjectType()
export class GameAlreadyStarted {
    @Field()
    message: string;
}

@ObjectType()
export class GameDoesntExist {
    @Field()
    message: string;
}

@ObjectType()
export class PlayerAlreadyInGame {
    @Field()
    message: string;
}
