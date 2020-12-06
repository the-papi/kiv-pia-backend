import {Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany, JoinTable, OneToMany, ManyToOne, OneToOne, JoinColumn} from "typeorm";
import {Game} from "./Game";
import {User} from "./User";

@Entity()
export class GameState {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Game, {onDelete: "CASCADE"})
    game: Promise<Game>;

    @ManyToOne(() => User, {onDelete: "CASCADE"})
    user: Promise<User>;

    @Column()
    x: number;

    @Column()
    y: number;
}
