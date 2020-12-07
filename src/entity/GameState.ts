import {Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany, JoinTable, OneToMany, ManyToOne, OneToOne, JoinColumn} from "typeorm";
import {Player} from "./Player";

@Entity()
export class GameState {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Player, player => player.gameStates, {nullable: false, onDelete: "CASCADE"})
    player: Promise<Player>;

    @Column()
    x: number;

    @Column()
    y: number;
}
