import {ObjectType, Field, Int} from "type-graphql";
import {User} from "./User";

@ObjectType()
export class ChatMessage {
    @Field(() => Int)
    id: number;

    @Field({description: "Sender of the chat message"})
    from: User;

    @Field()
    message: string;

    @Field({description: "Time the message was sent"})
    time: Date;
}
