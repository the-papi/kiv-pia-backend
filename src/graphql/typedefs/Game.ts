import {ObjectType, Field, registerEnumType} from "type-graphql";
import {Player} from "./Player";
import {SymbolPlacement} from "./SymbolPlacement";

export enum BoardSize {
    Five = 5,
    Seven = 7,
    Eleven = 11
}

registerEnumType(BoardSize, {
    name: "BoardSize"
});

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

    @Field(type => BoardSize)
    boardSize: BoardSize;
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
