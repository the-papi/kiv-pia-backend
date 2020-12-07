import {ObjectType, Field} from "type-graphql";
import {User} from "./User";

@ObjectType()
export class Player {
    @Field(type => User)
    user: User;
}
