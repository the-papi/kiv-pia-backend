import {ObjectType, Field} from "type-graphql";

@ObjectType()
export class User {
    @Field()
    id: number;

    @Field()
    username: string;

    @Field()
    email: string;

    @Field()
    admin: boolean;
}

@ObjectType()
export class EmailAlreadyUsed {
    @Field()
    message: string;
}

@ObjectType()
export class PasswordTooWeak {
    @Field()
    message: string;
}
