import {ObjectType, Field} from "type-graphql";
import {User} from "./User";

@ObjectType()
export class GameRequest {
    @Field(type => String, {description: "Request ID (random string) that is needed for game request acceptation"})
    requestId: string;

    @Field(type => User, {description: "Sender of the game request"})
    from: User;
}
