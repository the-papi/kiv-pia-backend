import {ObjectType, Field} from "type-graphql";
import {User} from "./User";

@ObjectType()
export class GameRequest {
    @Field(type => String)
    requestId: string;

    @Field(type => User)
    from: User;
}
