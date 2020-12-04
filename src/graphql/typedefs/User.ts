import {ObjectType, Field} from "type-graphql";

@ObjectType()
export class User {
    @Field()
    firstName: string;

    @Field()
    lastName: string;

    @Field()
    username: string;
}

@ObjectType()
export class UsernameAlreadyUsed {
    @Field()
    message: string;
}
