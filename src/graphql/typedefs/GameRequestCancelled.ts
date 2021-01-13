import {ObjectType, Field} from "type-graphql";

@ObjectType({description: "This object is sent when sender cancels game request"})
export class GameRequestCancelled {
    @Field(type => String)
    requestId: string;
}
