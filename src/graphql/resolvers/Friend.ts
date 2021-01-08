import {Arg, createUnionType, Ctx, Field, FieldResolver, InputType, Int, Mutation, Query, registerEnumType, Resolver, Root, Subscription} from "type-graphql";
import {inject, injectable} from "tsyringe";
import {FriendService, UserService} from "../../services/types";
import {RedisClient} from "redis";
import {FriendRequest} from "../typedefs/FriendRequest";

@InputType()
class FriendRequestInput {
    @Field(() => Int)
    foreignUserId: number;
}

@InputType()
class AcceptFriendRequestInput {
    @Field(() => Int)
    requestId: number;
}

@Resolver(FriendRequest)
@injectable()
export class FriendResolver {

    private readonly userService: UserService;
    private readonly friendService: FriendService;
    private readonly redis: RedisClient;

    constructor(
        @inject("UserService") userService: UserService,
        @inject("FriendService") friendService: FriendService,
        @inject("redis") redis: RedisClient
    ) {
        this.userService = userService;
        this.friendService = friendService;
        this.redis = redis;
    }

    @Query(returns => [FriendRequest])
    async friendRequests(@Ctx() context) {
        return this.friendService.getFriendRequests(await context.user);
    }

    @FieldResolver()
    async foreigner(@Root() friendRequest) {
        return friendRequest.potentialFriend;
    }

    @Mutation(returns => Boolean)
    async sendFriendRequest(
        @Arg("input") input: FriendRequestInput,
        @Ctx() context
    ): Promise<boolean> {
        return this.friendService.sendFriendRequest(await context.user, input.foreignUserId);
    }

    @Mutation(returns => Boolean)
    async acceptFriendRequest(
        @Arg("input") input: AcceptFriendRequestInput,
        @Ctx() context
    ): Promise<boolean> {
        return this.friendService.acceptFriendRequest(input.requestId);
    }
}
