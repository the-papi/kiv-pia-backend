import * as apollo from "apollo-server";
import {getConnection, getRepository} from "typeorm";
import {Service} from "typedi";
import {User} from "../entity/User";
import {ChatMessage} from "../entity/ChatMessage";

@Service()
export class ChatMessageService {
    async create(data: {
        from: User,
        message: string,
    }): Promise<ChatMessage> {
        let chatMessageRepository = getRepository(ChatMessage);
        let chatMessage = chatMessageRepository.create(data);
        chatMessage.lobby = await data.from.lobby;

        return chatMessage;
    }

    async send(pubSub: apollo.PubSub, chatMessage: ChatMessage): Promise<ChatMessage> {
        let chatMessageRepository = getRepository(ChatMessage);
        await pubSub.publish("CHAT_NEW_MESSAGE", chatMessage)

        console.log(chatMessage);

        return chatMessageRepository.save(chatMessage);
    }
}
