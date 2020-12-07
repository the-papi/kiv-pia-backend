import {EntityRepository, Repository} from "typeorm";
import {User} from "../entity/User";
import {Game} from "../entity/Game";

@EntityRepository(User)
export class UserRepository extends Repository<User> {
    async findByUsername(username: string): Promise<User | null> {
        return this.findOne({username});
    }

    async findActiveGame(user: User): Promise<Game | null> {
        let _user = this.createQueryBuilder("user")
            .select(["user.id", "player.id", "game.id", "game.active"])
            .leftJoin("user.players", "player")
            .leftJoin("player.game", "game")
            .where("user.id = :id", {id: user.id})
            .andWhere("game.active IS TRUE")
            .orderBy("game.id", "DESC")
            .getOne();

        if (!(await _user)) {
            return null;
        }

        if (!(await (await _user).players) || !(await (await _user).players).length) {
            return null
        }

        return (await (await _user).players)[0].game;
    }
}
