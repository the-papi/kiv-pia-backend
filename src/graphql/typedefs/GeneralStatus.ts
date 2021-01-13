import {ObjectType, Field} from "type-graphql";

@ObjectType({description: "General status object that can be used for simple operations that has boolean result"})
export class GeneralStatus {
    @Field(type => Boolean)
    status: boolean;

    @Field(type => String)
    message: string = '';
}
