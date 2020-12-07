import * as apollo from "apollo-server";
import {Arg, createUnionType, Ctx, Field, InputType, Mutation, PubSub, Resolver, Root, Subscription} from "type-graphql";
import * as exceptions from "../../services/exceptions";
import {GameService} from "../../services/types";
import {inject, injectable} from "tsyringe";
import {Player} from "../typedefs/Player";
import {GameRequest} from "../typedefs/GameRequest";
import {getRepository} from "typeorm";
import {User} from "../../entity/User";
import {RedisClient} from "redis";
import {Game, GameAlreadyStarted, GameDoesntExist, PlayerAlreadyInGame} from "../typedefs/Game";
import {GameResponse, GameResponseStatus} from "../typedefs/GameResponse";

const StartGameResultUnion = createUnionType({
    name: "StartGameResult",
    types: () => [Game, GameAlreadyStarted] as const,
})

const GameResponseResultUnion = createUnionType({
    name: "GameResponseResult",
    types: () => [Game, PlayerAlreadyInGame, GameDoesntExist] as const,
})

@InputType()
class GameRequestInput {
    @Field()
    userId: number;
}

@InputType()
class GameResponseInput {
    @Field()
    requestId: string
}

@Resolver(Game)
@injectable()
export class GameResolver {

    private readonly gameService: GameService;
    private readonly redis: RedisClient;

    constructor(
        @inject("GameService") gameService: GameService,
        @inject("redis") redis: RedisClient
    ) {
        this.gameService = gameService;
        this.redis = redis;
    }

    @Mutation(returns => String, {nullable: true})
    async sendGameRequest(
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub,
        @Arg("input") input: GameRequestInput
    ): Promise<string | null> {
        try {
            return await this.gameService.sendGameRequest(pubSub, this.redis, await context.user, input.userId);
        } catch (e) {
            return null;
        }
    }

    @Subscription(returns => GameRequest, {
        topics: "GAME_REQUEST",
        filter: async ({payload, context}) =>
            payload && payload.targetUserId == (await context.user).id
    })
    async gameRequest(@Root() gameRequest): Promise<GameRequest> {
        return {
            requestId: gameRequest.requestId,
            from: await getRepository(User).findOne({id: gameRequest.fromUserId})
        };
    }

    @Mutation(returns => GameResponseResultUnion)
    async acceptGameRequestAndStartGame(
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub,
        @Arg("input") input: GameResponseInput
    ): Promise<typeof GameResponseResultUnion> {
        return this.gameService.acceptGameRequest(pubSub, this.redis, input.requestId).then(
            users => {
                return this.gameService.startGame(pubSub, users).then(
                    async v => {
                        let game = new Game();
                        game.players = await this.gameService.getPlayers(v) as unknown as Player[];

                        return game;
                    }
                ).catch(e => {
                    if (e instanceof exceptions.PlayerAlreadyInGame) {
                        e = Object.assign(new PlayerAlreadyInGame(), e);
                    } else {
                        throw e;
                    }

                    return e;
                });
            }
        ).catch(e => {
            if (e instanceof exceptions.GameDoesntExist) {
                e = Object.assign(new GameDoesntExist(), e);
            } else {
                throw e;
            }

            return e;
        });
    }

    @Subscription(returns => GameResponse, {
        topics: "GAME_RESPONSE",
        filter: async ({payload, context}) =>
            payload && payload.fromUserId == (await context.user).id
    })
    async gameResponse(@Root() gameResponse): Promise<GameResponse> {
        return {
            requestId: gameResponse.requestId,
            status: gameResponse.accepted ? GameResponseStatus.Accepted : GameResponseStatus.Rejected
        };
    }

    // @Mutation()
    // async placeSymbol(
    //     @Ctx() context,
    //     @PubSub() pubSub: apollo.PubSub
    // ): Promise<null> {
    //
    //     return null;
    // }

    // @Subscription({
    //     topics: "CHAT_NEW_MESSAGE",
    //     filter: async ({payload, context}) =>
    //         (await (await context.user).activeLobby).id == (await (await payload.from).activeLobby).id
    //         && (await context.user).id != (await payload.from).id,
    // })
    // newGame(@Root() chatMessage: Game): Game {
    //     return chatMessage;
    // }
}
