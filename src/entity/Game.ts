import {Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany, JoinTable, OneToMany, ManyToOne, OneToOne, JoinColumn, UpdateDateColumn} from "typeorm";
import {Player} from "./Player";
import {ChatMessage} from "./ChatMessage";
import {GameState} from "./GameState";

@Entity()
export class Game {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(() => Player, player => player.game)
    players: Promise<Player[]>;

    @OneToMany(() => ChatMessage, chatMessage => chatMessage.game)
    chatMessages: Promise<ChatMessage[]>;

    @OneToMany(() => GameState, gameState => gameState.game)
    gameStates: Promise<GameState[]>;

    @ManyToOne(() => Player, player => player.game, {nullable: true, onDelete: "CASCADE"})
    winner: Promise<Player>;

    @Column({default: true})
    active: boolean;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column("int")
    boardSize: number;
}
