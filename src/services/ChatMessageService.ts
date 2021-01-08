import * as apollo from "apollo-server";
import {getCustomRepository, getRepository} from "typeorm";
import * as types from "./types"
import {User} from "../entity/User";
import {ChatMessage} from "../entity/ChatMessage";
import {UserRepository} from "../repositories/User";
import {Game} from "../entity/Game";

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

        await pubSub.publish("CHAT_NEW_MESSAGE", {
            id: chatMessage.id,
            from: chatMessage.from,
            gameId: (await chatMessage.game).id,
            message: chatMessage.message,
            time: chatMessage.createdAt,
        });

        return chatMessage;
    }

    async getChatMessagesForGame(game: Game): Promise<ChatMessage[]> {
        let chatMessageRepository = getRepository(ChatMessage);
        return chatMessageRepository.createQueryBuilder("chatMessage")
            .innerJoin("chatMessage.game", "game")
            .where("game.id = :id", {id: game.id})
            .getMany();
    }
}
