import {ObjectType, Field} from "type-graphql";
import {Player} from "./Player";

@ObjectType({description: "This object is used to give up the game"})
export class GameSurrender {
    @Field(type => Player)
    player: Player;
}
