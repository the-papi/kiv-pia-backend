import {Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany, JoinTable, OneToMany, ManyToOne, OneToOne, JoinColumn} from "typeorm";
import {Player} from "./Player";
import {ChatMessage} from "./ChatMessage";

@Entity()
export class Game {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(() => Player, player => player.game)
    players: Promise<Player[]>;

    @OneToMany(() => ChatMessage, chatMessage => chatMessage.game)
    chatMessages: Promise<ChatMessage[]>;

    @Column({default: true})
    active: boolean;
}
