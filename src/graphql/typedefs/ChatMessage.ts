import {ObjectType, Field, Int} from "type-graphql";
import {User} from "./User";

@ObjectType()
export class ChatMessage {
    @Field(() => Int)
    id: number;

    @Field()
    from: User;

    @Field()
    message: string;

    @Field()
    time: Date;
}
