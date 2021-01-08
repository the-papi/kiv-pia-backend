import {ObjectType, Field} from "type-graphql";
import {Player} from "./Player";

@ObjectType()
export class GameWin {
    @Field(type => Player)
    player: Player;
}
