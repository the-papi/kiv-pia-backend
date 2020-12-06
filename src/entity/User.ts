import {Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany, JoinTable, OneToMany, ManyToOne} from "typeorm";
import * as bcrypt from "bcryptjs";
import {Lobby} from "./Lobby";
import {ChatMessage} from "./ChatMessage";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column()
    @Index({unique: true})
    username: string;

    @Column({name: "password"})
    _password: string;

    @Column({default: true})
    active: boolean;

    @OneToMany(() => ChatMessage, chatMessage => chatMessage.from)
    chatMessages: Promise<ChatMessage[]>;

    @ManyToMany(() => Lobby, lobby => lobby.activeUsers)
    lobbyHistory: Promise<Lobby[]>;

    @ManyToOne(() => Lobby, lobby => lobby.activeUsers, {onDelete: "SET NULL"})
    activeLobby: Promise<Lobby>;

    set password(password: string) {
        this._password = bcrypt.hashSync(password, 10);
    }

    validatePassword(password: string) {
        return bcrypt.compareSync(password, this._password)
    }
}
