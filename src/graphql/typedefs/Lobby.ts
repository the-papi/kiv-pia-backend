import {ObjectType, Field} from "type-graphql";

@ObjectType()
export class Lobby {
    @Field()
    id: number;

    @Field()
    name: string;
}

@ObjectType()
export class AlreadyJoined {
    @Field()
    message: string;
}
