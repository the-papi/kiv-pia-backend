import * as apollo from "apollo-server";
import {Query, Mutation, Subscription, Resolver, InputType, Field, Arg, Ctx, PubSub, Root, FieldResolver} from "type-graphql";
import {ChatMessage} from "../typedefs/ChatMessage";
import {ChatMessageService, GameService} from "../../services/types";
import {container, inject, injectable} from "tsyringe";

@InputType()
class ChatMessageInput {
    @Field()
    message: string;
}

@Resolver(ChatMessage)
@injectable()
export class ChatMessageResolver {

    private readonly chatMessageService: ChatMessageService;
    private readonly gameService: GameService;

    constructor(@inject("ChatMessageService") chatMessageService: ChatMessageService,
                @inject("GameService") gameService: GameService) {
        this.chatMessageService = chatMessageService;
        this.gameService = gameService;
    }

    @Query(returns => [ChatMessage])
    async chatMessagesForActiveGame(@Ctx() context): Promise<ChatMessage[]> {
        let chatMessages = [];
        for (const chatMessage of
            await this.chatMessageService.getChatMessagesForGame(
                await this.gameService.getActiveGame(await context.user))) {
            chatMessages.push({
                id: chatMessage.id,
                from: chatMessage.from,
                message: chatMessage.message,
                time: chatMessage.createdAt
            });
        }

        return chatMessages;
    }

    @Mutation(returns => Boolean)
    async sendChatMessage(
        @Arg("input") input: ChatMessageInput,
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub
    ): Promise<boolean> {
        if (!input.message) {
            return false;
        }

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
        filter: async function ({payload, context}) {
            const gameService: GameService = container.resolve("GameService");
            return (await gameService.getActiveGame(await context.user)).id == payload.gameId;
        },
    })
    newChatMessage(@Root() chatMessage: ChatMessage): ChatMessage {
        return chatMessage;
    }
}
