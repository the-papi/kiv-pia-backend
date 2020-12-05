import * as apollo from "apollo-server";
import {getRepository} from "typeorm";
import {User} from "../entity/User";
import {ChatMessage} from "../entity/ChatMessage";

export class ChatMessageService {
    async create(data: {
        from: User,
        message: string,
    }): Promise<ChatMessage> {
        let chatMessage = new ChatMessage();
        chatMessage.from = new Promise<User>(() => data.from);
        chatMessage.lobby = (await data.from).activeLobby;
        chatMessage.message = data.message;

        return chatMessage;
    }

    async send(pubSub: apollo.PubSub, chatMessage: ChatMessage): Promise<ChatMessage> {
        let chatMessageRepository = getRepository(ChatMessage);
        await pubSub.publish("CHAT_NEW_MESSAGE", chatMessage)

        return chatMessageRepository.save(chatMessage);
    }
}
