import {ObjectType, Field, registerEnumType} from "type-graphql";
import {User} from "./User";

enum GameSymbol {
    Circle,
    Cross
}

registerEnumType(GameSymbol, {
    name: "GameSymbol"
});

@ObjectType()
export class GameState {
    @Field(type => [User])
    players: User[];
}

@ObjectType()
export class Symbol {

}
