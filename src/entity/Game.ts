import {Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany, JoinTable, OneToMany, ManyToOne, OneToOne, JoinColumn} from "typeorm";
import {Lobby} from "./Lobby";

@Entity()
export class Game {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => Lobby)
    lobby: Promise<Lobby>;
}
