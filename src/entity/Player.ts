import {Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany, JoinTable, OneToMany, ManyToOne, OneToOne, JoinColumn} from "typeorm";
import {Game} from "./Game";
import {User} from "./User";
import {GameState} from "./GameState";

@Entity()
export class Player {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Game, game => game.players, {onDelete: "CASCADE"})
    game: Promise<Game>;

    @ManyToOne(() => User, user => user.players, {onDelete: "CASCADE"})
    user: Promise<User>;

    @OneToMany(() => GameState, gameState => gameState.player)
    gameStates: Promise<GameState[]>;

    @Column()
    x: number;

    @Column()
    y: number;
}
