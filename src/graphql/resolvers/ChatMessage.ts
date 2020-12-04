import * as apollo from "apollo-server";
import {Inject} from "typedi";
import {Query, Mutation, Subscription, Resolver, InputType, Field, Arg, Ctx, PubSub, Root} from "type-graphql";
import {User} from "../typedefs/User";
import {ChatMessageService} from "../../services/ChatMessageService";
import {ChatMessage} from "../typedefs/ChatMessage";
import {getRepository} from "typeorm";

@InputType()
class ChatMessageInput {
    @Field()
    message: string;
}

@Resolver(User)
export class ChatMessageResolver {

    @Inject()
    private readonly chatMessageService: ChatMessageService

    @Mutation(returns => Boolean)
    async sendChatMessage(
        @Arg("input") input: ChatMessageInput,
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub
    ): Promise<boolean> {
        try {
            await this.chatMessageService.send(pubSub, await this.chatMessageService.create({
                from: await context.user,
                message: input.message
            }))
        } catch (e) {
            console.log(e);
            return false;
        }

        return true;
    }

    @Subscription({
        topics: "CHAT_NEW_MESSAGE",
        filter: async ({payload, context}) =>
            (await (await context.user).activeLobby).id == (await (await payload.from).activeLobby).id
            && (await context.user).id != (await payload.from).id,
    })
    newChatMessage(@Root() chatMessage: ChatMessage): ChatMessage {
        return chatMessage;
    }
}
