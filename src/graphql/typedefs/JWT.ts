import {ObjectType, Field} from "type-graphql";

@ObjectType({description: "Wrapper object for JWT access and refresh token"})
export class JWT {
    @Field({nullable: true})
    accessToken: string;

    @Field({nullable: true})
    refreshToken: string;
}
