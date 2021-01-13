import {ObjectType, Field} from "type-graphql";
import {Player} from "./Player";

@ObjectType({description: "This object is used to announce the winner"})
export class GameWin {
    @Field(type => Player)
    player: Player;
}
