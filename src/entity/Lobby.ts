import {Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn, ManyToMany, JoinTable} from "typeorm";
import {User} from "./User";
import {ChatMessage} from "./ChatMessage";
import {Game} from "./Game";

@Entity()
export class Lobby {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(() => Game, {onDelete: "SET NULL"})
    @JoinColumn()
    game: Promise<Game>;

    @ManyToMany(() => User, user => user.lobbyHistory)
    @JoinTable()
    historyUsers: Promise<User[]>;

    @OneToMany(() => User, user => user.activeLobby)
    activeUsers: Promise<User[]>;

    @OneToMany(() => ChatMessage, chatMessage => chatMessage.lobby)
    chatMessages: Promise<ChatMessage[]>;
}
