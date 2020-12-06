import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm";
import {User} from "./User";
import {Game} from "./Game";

@Entity()
export class ChatMessage {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.chatMessages, {onDelete: "CASCADE"})
    from: Promise<User>;

    @ManyToOne(() => Game, game => game.chatMessages, {onDelete: "CASCADE"})
    game: Promise<Game>;

    @Column({type: "text"})
    message: string;
}
