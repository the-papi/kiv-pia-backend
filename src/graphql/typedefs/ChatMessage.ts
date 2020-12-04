import {ObjectType, Field} from "type-graphql";
import {User} from "./User";

@ObjectType()
export class ChatMessage {
    @Field()
    from: User;

    @Field()
    message: string;
}
