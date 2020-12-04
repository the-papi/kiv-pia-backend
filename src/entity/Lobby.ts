import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm";
import {User} from "./User";
import {ChatMessage} from "./ChatMessage";

@Entity()
export class Lobby {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(() => User, user => user.lobby)
    users: Promise<User[]>;

    @OneToMany(() => ChatMessage, chatMessage => chatMessage.lobby)
    chatMessages: Promise<ChatMessage[]>;
}
