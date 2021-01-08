import {ObjectType, Field} from "type-graphql";
import {Player} from "./Player";
import {SymbolPlacement} from "./SymbolPlacement";

@ObjectType()
export class Game {
    @Field(type => [SymbolPlacement])
    gameStates: SymbolPlacement[];

    @Field(type => [Player])
    players: Player[];

    @Field(type => Player, {nullable: true})
    winner: Player;

    @Field()
    datetime: Date;
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

@ObjectType()
export class GameRejected {
    @Field()
    status: boolean;
}
