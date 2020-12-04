import {ObjectType, Field} from "type-graphql";

@ObjectType()
export class JWT {
    @Field({nullable: true})
    accessToken: string;

    @Field({nullable: true})
    refreshToken: string;
}
