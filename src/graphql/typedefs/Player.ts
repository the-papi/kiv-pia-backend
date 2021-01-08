import {ObjectType, Field} from "type-graphql";
import {User} from "./User";
import {GameSymbol} from "./SymbolPlacement";

@ObjectType()
export class Player {
    @Field(type => User)
    user: User;

    @Field(type => GameSymbol)
    symbol: GameSymbol;
}
