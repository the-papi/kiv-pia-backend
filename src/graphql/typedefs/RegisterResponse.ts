import {ObjectType, Field} from "type-graphql";
import {ValidationError} from "./ValidationError";

@ObjectType()
export class RegisterResponse {
    @Field()
    success: boolean;

    @Field(returns => [ValidationError], {nullable: true})
    validationErrors: ValidationError[];
}
