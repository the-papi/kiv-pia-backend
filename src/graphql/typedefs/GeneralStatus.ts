import {ObjectType, Field} from "type-graphql";

@ObjectType()
export class GeneralStatus {
    @Field(type => Boolean)
    status: boolean;

    @Field(type => String)
    message: string = '';
}
