import {ObjectType, Field} from "type-graphql";

@ObjectType()
export class ValidationError {
    @Field()
    field: string;

    @Field(returns => [String])
    messages: string[];
}
