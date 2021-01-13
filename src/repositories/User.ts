import {EntityRepository, getConnection, Repository} from "typeorm";
import {User} from "../entity/User";
import {Game} from "../entity/Game";

@EntityRepository(User)
export class UserRepository extends Repository<User> {
    async findByUsername(username: string): Promise<User | undefined> {
        return this.findOne({username});
    }

    async findActiveGame(user: User): Promise<Game | undefined> {
        let _user = await this.createQueryBuilder("user")
            .select(["user.id", "player.id", "game.*"])
            .innerJoin("user.players", "player")
            .innerJoin("player.game", "game")
            .where("user.id = :id", {id: user.id})
            .andWhere("game.active IS TRUE")
            .orderBy("game.id", "DESC")
            .getOne();

        if (!_user) {
            return undefined;
        }

        if (!(await _user.players) || !(await _user.players).length) {
            return undefined;
        }

        return (await _user.players)[0].game;
    }

    async gamesHistory(user: User): Promise<Game[] | undefined> {
        let _user = await this.createQueryBuilder("user")
            .select(["user.id", "player.id", "game.id", "game.active", "game.updatedAt"])
            .innerJoin("user.players", "player")
            .innerJoin("player.game", "game")
            .where("user.id = :id", {id: user.id})
            .andWhere("game.active IS FALSE")
            .orderBy("game.id", "DESC")
            .getOne();

        if (!_user) {
            return undefined;
        }

        if (!(await _user.players) || !(await _user.players).length) {
            return undefined;
        }

        let games = [];
        for (let player of await _user.players) {
            games.push(await player.game)
        }

        return games;
    }

    async addFriend(me: Promise<User>, foreigner: Promise<User>) {
        await getConnection().transaction(async transactionalEntityManager => {
            await transactionalEntityManager.query(`
                INSERT INTO "user_friends_user"("userId_1", "userId_2")
                VALUES ($1, $2)
            `, [(await me).id, (await foreigner).id]);

            await transactionalEntityManager.query(`
                INSERT INTO "user_friends_user"("userId_1", "userId_2")
                VALUES ($1, $2)
            `, [(await foreigner).id, (await me).id]);
        })
    }

    async removeFriend(me: Promise<User>, foreigner: Promise<User>) {
        await getConnection().transaction(async transactionalEntityManager => {
            await transactionalEntityManager.query(`
                DELETE FROM "user_friends_user" WHERE "userId_1" = $1 AND "userId_2" = $2
            `, [(await me).id, (await foreigner).id]);

            await transactionalEntityManager.query(`
                DELETE FROM "user_friends_user" WHERE "userId_1" = $1 AND "userId_2" = $2
            `, [(await foreigner).id, (await me).id]);
        })
    }
}
