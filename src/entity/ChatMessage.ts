import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm";
import {User} from "./User";
import {Lobby} from "./Lobby";

@Entity()
export class ChatMessage {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.chatMessages, {onDelete: "CASCADE"})
    from: User;

    @ManyToOne(() => Lobby, lobby => lobby.chatMessages, {onDelete: "CASCADE"})
    lobby: Lobby;

    @Column({type: "text"})
    message: string;
}
