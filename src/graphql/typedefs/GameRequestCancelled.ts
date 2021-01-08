import {ObjectType, Field} from "type-graphql";
import {User} from "./User";

@ObjectType()
export class GameRequestCancelled {
    @Field(type => String)
    requestId: string;
}
