import {Arg, createUnionType, Ctx, Directive, Field, FieldResolver, InputType, Int, Mutation, PubSub, Query, registerEnumType, Resolver, Root, Subscription} from "type-graphql";
import {container, inject, injectable} from "tsyringe";
import {FriendService, GameService, UserService} from "../../services/types";
import {RedisClient} from "redis";
import {FriendRequest} from "../typedefs/FriendRequest";
import * as apollo from "apollo-server";
import {ChatMessage} from "../typedefs/ChatMessage";
import {User} from "../typedefs/User";

@InputType()
class FriendRequestInput {
    @Field(() => Int)
    foreignUserId: number;
}

@InputType()
class AcceptFriendRequestInput {
    @Field(() => Int)
    userId: number;
}

@InputType()
class RejectFriendRequestInput {
    @Field(() => Int)
    userId: number;
}

@InputType()
class RemoveFriendInput {
    @Field(() => Int)
    friendId: number;
}

@Resolver(FriendRequest)
@injectable()
export class FriendResolver {

    private readonly userService: UserService;
    private readonly friendService: FriendService;

    constructor(
        @inject("UserService") userService: UserService,
        @inject("FriendService") friendService: FriendService,
    ) {
        this.userService = userService;
        this.friendService = friendService;
    }

    @Directive('@auth')
    @Query(returns => [FriendRequest])
    async friendRequests(@Ctx() context) {
        return this.friendService.getFriendRequests(await context.user);
    }

    @Directive('@auth')
    @FieldResolver()
    async foreigner(@Root() friendRequest) {
        return friendRequest.foreigner || friendRequest.potentialFriend;
    }

    @Directive('@auth')
    @Mutation(returns => Boolean)
    async sendFriendRequest(
        @Arg("input") input: FriendRequestInput,
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub
    ): Promise<boolean> {
        return this.friendService.sendFriendRequest(pubSub, await context.user, input.foreignUserId);
    }

    @Directive('@auth')
    @Mutation(returns => Boolean)
    async acceptFriendRequest(
        @Arg("input") input: AcceptFriendRequestInput,
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub
    ): Promise<boolean> {
        return this.friendService.acceptFriendRequest(pubSub, input.userId);
    }

    @Directive('@auth')
    @Mutation(returns => Boolean)
    async rejectFriendRequest(
        @Arg("input") input: RejectFriendRequestInput,
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub
    ): Promise<boolean> {
        return this.friendService.rejectFriendRequest(pubSub, input.userId);
    }

    @Directive('@auth')
    @Mutation(returns => Boolean)
    async removeFriend(
        @Arg("input") input: RemoveFriendInput,
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub
    ): Promise<boolean> {
        try {
            await this.friendService.removeFriend(pubSub, (await context.user).id, input.friendId);
            return true;
        } catch (e) {
            return false;
        }
    }

    @Directive('@auth')
    @Subscription(() => FriendRequest, {
        topics: "FRIEND_REQUEST",
        filter: async function ({payload, context}) {
            return payload.potentialFriendId == (await context.user).id
        },
    })
    async newFriendRequest(@Root() friendInfo): Promise<FriendRequest> {
        return {
            foreigner: await this.userService.getById(friendInfo.requesterId)
        };
    }

    @Directive('@auth')
    @Subscription(() => User, {
        topics: "UPDATED_FRIEND_STATUS",
        filter: async function ({payload, context}) {
            return payload.requesterId == (await context.user).id || payload.potentialFriendId == (await context.user).id
        },
    })
    async updatedFriendStatus(@Root() friendInfo, @Ctx() context): Promise<User> {
        if (friendInfo.potentialFriendId === (await context.user).id) {
            return this.userService.getById(friendInfo.requesterId);
        } else {
            return this.userService.getById(friendInfo.potentialFriendId);
        }
    }
}
