import {getConnection, getRepository} from "typeorm";
import {Service} from "typedi";
import {Lobby} from "../entity/Lobby";
import {User} from "../entity/User";
import {Game} from "../entity/Game";
import {GameAlreadyStarted, NotInLobby} from "./exceptions";

@Service()
export class GameService {
    async startForUser(user: User): Promise<Game> {
        let lobby = await user.activeLobby;
        if (!lobby) {
            throw new NotInLobby();
        }

        if (await lobby.game) {
            throw new GameAlreadyStarted();
        }

        let gameRepository = getRepository(Game);
        let game = new Game();

        return getConnection().transaction(async transactionalEntityManager => {
            await gameRepository.save(game);

            await getConnection()
                .createQueryBuilder()
                .relation(Lobby, "game")
                .of(lobby)
                .set(game);
        }).then(value => game);
    }

    async players(game: Game): Promise<User[]> {
        let lobby = await game.lobby;
        return lobby.activeUsers;
    }
}
