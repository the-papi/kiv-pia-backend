import * as apollo from "apollo-server";
import {getCustomRepository, getRepository} from "typeorm";
import * as types from "./types"
import {User} from "../entity/User";
import {ChatMessage} from "../entity/ChatMessage";
import {UserRepository} from "../repositories/User";

export class ChatMessageService implements types.ChatMessageService {
    async create(data: {
        from: User,
        message: string,
    }): Promise<ChatMessage> {
        let userRepository = getCustomRepository(UserRepository);

        let chatMessage = new ChatMessage();
        chatMessage.from = Promise.resolve(data.from);
        chatMessage.game = Promise.resolve(await userRepository.findActiveGame(data.from));
        chatMessage.message = data.message;

        return chatMessage;
    }

    async send(pubSub: apollo.PubSub, chatMessage: ChatMessage): Promise<ChatMessage> {
        let chatMessageRepository = getRepository(ChatMessage);
        chatMessage = await chatMessageRepository.save(chatMessage);

        await pubSub.publish("CHAT_NEW_MESSAGE", chatMessage)

        return chatMessage;
    }
}
