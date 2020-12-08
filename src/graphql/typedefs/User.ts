import {ObjectType, Field} from "type-graphql";

@ObjectType()
export class User {
    @Field()
    id: number;

    @Field()
    username: string;
}

@ObjectType()
export class UsernameAlreadyUsed {
    @Field()
    message: string;
}
