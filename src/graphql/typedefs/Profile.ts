import {ObjectType, Field} from "type-graphql";

@ObjectType()
export class Profile {
    @Field()
    id: number;

    @Field()
    username: string;

    @Field()
    email: string;
}
