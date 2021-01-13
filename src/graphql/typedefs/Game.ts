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
    @Field(type => [SymbolPlacement], {description: "List of all game states"})
    gameStates: SymbolPlacement[];

    @Field(type => [Player], {description: "List of all players (currently it should be list of 2 players)"})
    players: Player[];

    @Field(type => Player, {nullable: true, description: "Winner of the game (null if game hasn't ended)"})
    winner: Player;

    @Field({description: "Time of game creation"})
    datetime: Date;

    @Field(type => BoardSize, {description: "Board size (only one side - board is always square)"})
    boardSize: BoardSize;
}

@ObjectType({description: "Error that is returned when the game already started"})
export class GameAlreadyStarted {
    @Field()
    message: string;
}

@ObjectType({description: "Error that is returned when the game doesn't exist"})
export class GameDoesntExist {
    @Field()
    message: string;
}

@ObjectType({description: "Error that is returned when the player is already in another game"})
export class PlayerAlreadyInGame {
    @Field()
    message: string;
}

@ObjectType({description: "Error that is returned when the player rejected game request"})
export class GameRejected {
    @Field()
    status: boolean;
}
