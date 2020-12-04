import {Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany, JoinTable, OneToMany, ManyToOne} from "typeorm";
import * as bcrypt from "bcryptjs";
import {Lobby} from "./Lobby";
import {ChatMessage} from "./ChatMessage";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    @Index({unique: true})
    username: string;

    @Column({name: "password"})
    _password: string;

    @Column({default: true})
    active: boolean;

    @ManyToOne(() => Lobby, {nullable: true, onDelete: "CASCADE"})
    lobby: Promise<Lobby>;

    @OneToMany(() => ChatMessage, chatMessage => chatMessage.from)
    chatMessages: ChatMessage[];

    set password(password: string) {
        this._password = bcrypt.hashSync(password, 10);
    }

    validatePassword(password: string) {
        return bcrypt.compareSync(password, this._password)
    }
}
