import {ObjectType, Field, registerEnumType} from "type-graphql";
import {User} from "./User";

export enum UserStatus {
    Online,
    Offline
}

registerEnumType(UserStatus, {
    name: "UserStatus"
});

@ObjectType()
export class UserStatusUpdate {
    @Field(type => UserStatus)
    status: UserStatus;

    @Field()
    user: User;
}

