import {ObjectType, Field} from "type-graphql";
import {User} from "./User";

@ObjectType()
export class FriendRequest {
    @Field({description: "Receiver of the friend request"})
    foreigner: User;
}
