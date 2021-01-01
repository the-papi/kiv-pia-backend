import {ObjectType, Field} from "type-graphql";
import {Player} from "./Player";
import {GameState} from "./GameState";

@ObjectType()
export class Game {
    @Field(type => [GameState])
    gameStates: GameState[];

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
