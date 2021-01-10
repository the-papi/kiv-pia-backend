import {Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany, JoinTable, OneToMany, ManyToOne} from "typeorm";
import * as bcrypt from "bcryptjs";
import {ChatMessage} from "./ChatMessage";
import {Player} from "./Player";
import {FriendRequest} from "./FriendRequest";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Index({unique: true})
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

    @ManyToMany(() => User, user => user.friends)
    @JoinTable()
    friends: Promise<User[]>;

    @OneToMany(() => FriendRequest, friendRequest => friendRequest.requester)
    myFriendRequests: Promise<FriendRequest[]>;

    @OneToMany(() => FriendRequest, friendRequest => friendRequest.potentialFriend)
    foreignFriendRequests: Promise<FriendRequest[]>;

    set password(password: string) {
        this._password = bcrypt.hashSync(password, 10);
    }

    validatePassword(password: string) {
        return bcrypt.compareSync(password, this._password)
    }
}
