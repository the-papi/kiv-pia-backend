import {Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany, JoinTable, OneToMany} from "typeorm";
import {User} from "./User";
import {ChatMessage} from "./ChatMessage";

@Entity()
export class Lobby {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(() => User, user => user.lobbies)
    users: User[];

    @OneToMany(() => ChatMessage, chatMessage => chatMessage.lobby)
    chatMessages: ChatMessage[];
}
