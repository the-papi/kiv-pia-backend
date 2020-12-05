import * as apollo from "apollo-server";
import {Query, Mutation, Subscription, Resolver, InputType, Field, Arg, Ctx, PubSub, Root} from "type-graphql";
import {ChatMessage} from "../typedefs/ChatMessage";
import {ChatMessageService} from "../../services/types";
import {inject} from "tsyringe";

@InputType()
class ChatMessageInput {
    @Field()
    message: string;
}

@Resolver(ChatMessage)
export class ChatMessageResolver {

    private readonly chatMessageService: ChatMessageService;

    constructor(@inject("ChatMessageService") chatMessageService: ChatMessageService) {
        this.chatMessageService = chatMessageService;
    }

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
