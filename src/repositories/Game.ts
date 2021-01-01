import {EntityRepository, Repository} from "typeorm";
import {GameState} from "../entity/GameState";
import {GameSymbol} from "../entity/Player";
import {Game} from "../entity/Game";

@EntityRepository(GameState)
export class GameStateRepository extends Repository<GameState> {
    async countSymbols(game: Game, symbol: GameSymbol): Promise<number> {
        let result = await this.createQueryBuilder("gameState")
            .select("COUNT(1)", "count")
            .innerJoin("gameState.game", "game")
            .innerJoin("gameState.player", "player")
            .where("game.id = :id", {id: game.id})
            .andWhere("player.symbol = :symbol", {symbol: symbol})
            .getRawOne();

        return result.count;
    }

    async isFieldOccupied(game: Game, x: number, y:number): Promise<boolean> {
        let result = await this.createQueryBuilder("gameState")
            .select("1", "exists")
            .innerJoin("gameState.game", "game")
            .where("game.id = :id", {id: game.id})
            .andWhere("x = :x", {x: x})
            .andWhere("y = :y", {y: y})
            .getRawOne();

        return !!result;
    }
}
