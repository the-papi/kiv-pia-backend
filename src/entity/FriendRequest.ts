import {Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany, JoinTable, OneToMany, ManyToOne} from "typeorm";
import * as bcrypt from "bcryptjs";
import {ChatMessage} from "./ChatMessage";
import {Player} from "./Player";
import {User} from "./User";

@Entity()
export class FriendRequest {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => User, user => user.myFriendRequests)
    requester: Promise<User>;

    @ManyToOne(type => User, user => user.foreignFriendRequests)
    potentialFriend: Promise<User>;
}
