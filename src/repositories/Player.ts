import {EntityRepository, Repository} from "typeorm";
import {Player} from "../entity/Player";
import {User} from "../entity/User";

@EntityRepository(Player)
export class PlayerRepository extends Repository<Player> {
    async findActivePlayer(user: User): Promise<Player | undefined> {
        return this.createQueryBuilder("player")
            .innerJoin("player.user", "user")
            .innerJoin("player.game", "game")
            .where("user.id = :id", {id: user.id})
            .andWhere("game.active IS TRUE")
            .orderBy("player.id", "DESC")
            .getOne()
    }
}
