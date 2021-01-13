import {ObjectType, Field, registerEnumType, Int} from "type-graphql";

export enum GameSymbol {
    Circle,
    Cross
}

registerEnumType(GameSymbol, {
    name: "GameSymbol"
});

@ObjectType()
export class SymbolPlacement {
    @Field(type => Int)
    x: number;

    @Field(type => Int)
    y: number;

    @Field(type => GameSymbol)
    symbol: GameSymbol;
}
