import {getRepository} from "typeorm";
import * as types from "./types"
import {Lobby} from "../entity/Lobby";
import {User} from "../entity/User";
import {LobbyAlreadyJoined} from "./exceptions";

export class LobbyService implements types.LobbyService {
    async create(data: {
        name?: string
    }): Promise<Lobby> {
        let lobbyRepository = getRepository(Lobby);
        return lobbyRepository.create(data);
    }

    async save(lobby: Lobby): Promise<Lobby> {
        let lobbyRepository = getRepository(Lobby);
        return lobbyRepository.save(lobby);
    }

    async join(user: User, lobby: Lobby | number): Promise<Lobby> {
        if (typeof lobby == "number") {
            let lobbyRepository = getRepository(Lobby);
            lobby = await lobbyRepository.findOne({id: lobby});
        }

        if (await user.activeLobby) {
            throw new LobbyAlreadyJoined();
        }

        let userRepository = getRepository(User);
        user.activeLobby = Promise.resolve(lobby);
        await userRepository.save(user);

        return lobby;
    }

    async all(): Promise<Lobby[]> {
        return getRepository(Lobby).find()
    }
}
