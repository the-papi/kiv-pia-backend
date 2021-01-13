import {ObjectType, Field} from "type-graphql";

@ObjectType({description: "This object is used for telling user it's own personal information"})
export class Profile {
    @Field()
    id: number;

    @Field()
    username: string;

    @Field()
    email: string;

    @Field()
    admin: boolean;
}
