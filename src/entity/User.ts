import {Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany, JoinTable, OneToMany, ManyToOne} from "typeorm";
import * as bcrypt from "bcryptjs";
import {ChatMessage} from "./ChatMessage";
import {Player} from "./Player";

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

    @OneToMany(() => Player, player => player.user)
    players: Promise<Player[]>;

    set password(password: string) {
        this._password = bcrypt.hashSync(password, 10);
    }

    validatePassword(password: string) {
        return bcrypt.compareSync(password, this._password)
    }
}
