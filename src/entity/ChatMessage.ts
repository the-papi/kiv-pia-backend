import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn} from "typeorm";
import {User} from "./User";
import {Game} from "./Game";

@Entity()
export class ChatMessage {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.chatMessages, {nullable: false, onDelete: "CASCADE"})
    from: Promise<User>;

    @ManyToOne(() => Game, game => game.chatMessages, {nullable: false, onDelete: "CASCADE"})
    game: Promise<Game>;

    @Column({type: "text"})
    message: string;

    @CreateDateColumn()
    createdAt: Date;
}
