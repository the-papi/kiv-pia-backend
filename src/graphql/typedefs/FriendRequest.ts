import {ObjectType, Field} from "type-graphql";
import {User} from "./User";

@ObjectType()
export class FriendRequest {
    @Field()
    foreigner: User;
}
