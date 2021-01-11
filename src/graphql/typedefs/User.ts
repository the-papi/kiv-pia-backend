import {ObjectType, Field, registerEnumType} from "type-graphql";

export enum FriendStatus {
    PendingRequest,
    Friend,
    NotFriend
}

registerEnumType(FriendStatus, {
    name: "FriendStatus"
});

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

    @Field({defaultValue: false, nullable: true})
    online?: boolean;

    @Field(type => FriendStatus, {nullable: true})
    friendStatus?: FriendStatus;
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
