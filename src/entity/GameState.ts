import {Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany, JoinTable, OneToMany, ManyToOne, OneToOne, JoinColumn} from "typeorm";
import {Player} from "./Player";
import {Game} from "./Game";

@Entity()
export class GameState {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Player, player => player.gameStates, {nullable: false, onDelete: "CASCADE"})
    player: Promise<Player>;

    @ManyToOne(() => Game, game => game.gameStates, {nullable: false, onDelete: "CASCADE"})
    game: Promise<Game>;

    @Column()
    x: number;

    @Column()
    y: number;
}
