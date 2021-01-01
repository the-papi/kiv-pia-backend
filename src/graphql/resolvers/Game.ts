import * as apollo from "apollo-server";
import {Arg, createUnionType, Ctx, Field, FieldResolver, InputType, Int, Mutation, PubSub, Query, Resolver, Root, Subscription} from "type-graphql";
import * as exceptions from "../../services/exceptions";
import {GameService} from "../../services/types";
import {inject, injectable} from "tsyringe";
import {Player} from "../typedefs/Player";
import {GameRequest} from "../typedefs/GameRequest";
import {getRepository} from "typeorm";
import {Game as GameEntity} from "../../entity/Game";
import {User} from "../../entity/User";
import {RedisClient} from "redis";
import {Game, GameAlreadyStarted, GameDoesntExist, PlayerAlreadyInGame} from "../typedefs/Game";
import {GameResponse, GameResponseStatus} from "../typedefs/GameResponse";
import {GameState} from "../typedefs/GameState";

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
    @Field(() => Int)
    userId: number;
}

@InputType()
class GameResponseInput {
    @Field()
    requestId: string
}

@InputType()
class PlaceSymbolInput {
    @Field(() => Int)
    x: number;

    @Field(() => Int)
    y: number;
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

    @Query(returns => Game, {nullable: true})
    async activeGame(@Ctx() context) {
        return this.gameService.getActiveGame(await context.user);
    }

    @FieldResolver()
    async gameStates(@Root() game: GameEntity) {
        return this.gameService.getGameStates(game);
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
                        game.players = <Player[]><unknown>(await this.gameService.getPlayers(v));

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

    @Mutation(returns => Boolean)
    async placeSymbol(
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub,
        @Arg("input") input: PlaceSymbolInput
    ): Promise<boolean> {
        return this.gameService.placeSymbol(pubSub, this.redis, await context.user, input.x, input.y);
    }

    @Subscription({
        topics: "GAME_STATE",
        filter: async ({payload, context}) => true,
    })
    gameState(@Root() gameState: GameState): GameState {
        return gameState;
    }
}
