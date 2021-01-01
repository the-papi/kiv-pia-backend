import {ObjectType, Field} from "type-graphql";
import {User} from "./User";
import {GameSymbol} from "./GameState";

@ObjectType()
export class Player {
    @Field(type => User)
    user: User;

    @Field(type => GameSymbol)
    symbol: GameSymbol;
}
