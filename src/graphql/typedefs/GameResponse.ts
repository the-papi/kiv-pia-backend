import {ObjectType, Field, registerEnumType} from "type-graphql";
import {User} from "./User";

export enum GameResponseStatus {
    Accepted,
    Rejected
}

registerEnumType(GameResponseStatus, {
    name: "GameResponseStatus"
});

@ObjectType()
export class GameResponse {
    @Field(type => String)
    requestId: string;

    @Field(type => GameResponseStatus)
    status: GameResponseStatus
}
