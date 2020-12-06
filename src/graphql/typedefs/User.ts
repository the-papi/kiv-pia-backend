import {ObjectType, Field} from "type-graphql";

@ObjectType()
export class User {
    @Field()
    email: string;

    @Field()
    username: string;
}

@ObjectType()
export class UsernameAlreadyUsed {
    @Field()
    message: string;
}
