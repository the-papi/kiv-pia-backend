import {Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany, JoinTable} from "typeorm";
import {User} from "./User";

@Entity()
export class Lobby {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(() => User, user => user.lobbies)
    users: User[];
}
