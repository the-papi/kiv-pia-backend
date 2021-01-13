import {ObjectType, Field, registerEnumType} from "type-graphql";

export enum GameResponseStatus {
    Accepted,
    Rejected
}

registerEnumType(GameResponseStatus, {
    name: "GameResponseStatus"
});

@ObjectType({description: "This object is sent when user accepts or rejects game request"})
export class GameResponse {
    @Field(type => String)
    requestId: string;

    @Field(type => GameResponseStatus)
    status: GameResponseStatus
}
