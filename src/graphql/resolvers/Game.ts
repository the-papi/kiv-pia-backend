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
import {Game, GameAlreadyStarted, GameDoesntExist, GameRejected, PlayerAlreadyInGame} from "../typedefs/Game";
import {GameResponse, GameResponseStatus} from "../typedefs/GameResponse";
import {SymbolPlacement} from "../typedefs/SymbolPlacement";
import {GameWin} from "../typedefs/GameWin";
import {GameRequestCancelled} from "../typedefs/GameRequestCancelled";
import {GeneralStatus} from "../typedefs/GeneralStatus";

const StartGameResultUnion = createUnionType({
    name: "StartGameResult",
    types: () => [Game, GameAlreadyStarted] as const,
})

const GameRequestResultUnion = createUnionType({
    name: "GameRequestResult",
    types: () => [GameRequest, GameRequestCancelled] as const,
});

const CancelGameResultUnion = createUnionType({
    name: "CancelGameResult",
    types: () => [GeneralStatus, GameDoesntExist] as const,
});

const AcceptGameResultUnion = createUnionType({
    name: "AcceptGameResult",
    types: () => [Game, PlayerAlreadyInGame, GameDoesntExist] as const,
});

const RejectGameResultUnion = createUnionType({
    name: "RejectGameResult",
    types: () => [GameRejected, GameDoesntExist] as const,
});

const GameStateUnion = createUnionType({
    name: "GameState",
    types: () => [SymbolPlacement, GameWin] as const,
});

@InputType()
class GameRequestInput {
    @Field(() => Int)
    userId: number;
}

@InputType()
class CancelGameRequestInput {
    @Field(() => String)
    requestId: string;
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

    @Query(returns => [Game], {nullable: true})
    async gamesHistory(@Ctx() context) {
        return this.gameService.gamesHistory(await context.user);
    }

    @FieldResolver(returns => Date)
    async datetime(@Root() game: GameEntity) {
        return game.updatedAt;
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

    @Mutation(returns => CancelGameResultUnion)
    async cancelGameRequest(
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub,
        @Arg("input") input: CancelGameRequestInput
    ): Promise<typeof CancelGameResultUnion> {
        try {
            return Object.assign(new GeneralStatus(), {
                status: await this.gameService.cancelGameRequest(pubSub, this.redis, input.requestId)
            });
        } catch (e) {
            if (e instanceof exceptions.GameDoesntExist) {
                e = Object.assign(new GameDoesntExist(), e);
            }

            return e;
        }
    }

    @Subscription(returns => GameRequestResultUnion, {
        topics: "GAME_REQUEST",
        filter: async ({payload, context}) =>
            payload && payload.targetUserId == (await context.user).id
    })
    async gameRequest(@Root() gameRequest): Promise<typeof GameRequestResultUnion> {
        if (gameRequest.cancelled) {
            return Object.assign(new GameRequestCancelled(), {
                requestId: gameRequest.requestId,
            });
        } else {
            return Object.assign(new GameRequest(), {
                requestId: gameRequest.requestId,
                from: await getRepository(User).findOne({id: gameRequest.fromUserId})
            });
        }
    }

    @Mutation(returns => AcceptGameResultUnion)
    async acceptGameRequestAndStartGame(
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub,
        @Arg("input") input: GameResponseInput
    ): Promise<typeof AcceptGameResultUnion> {
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
                    }

                    return e;
                });
            }
        ).catch(e => {
            if (e instanceof exceptions.GameDoesntExist) {
                e = Object.assign(new GameDoesntExist(), e);
            }

            return e;
        });
    }

    @Mutation(returns => RejectGameResultUnion)
    async rejectGameRequest(
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub,
        @Arg("input") input: GameResponseInput
    ): Promise<typeof RejectGameResultUnion> {
        try {
            return Object.assign(new GameRejected(), {
                status: await this.gameService.rejectGameRequest(pubSub, this.redis, input.requestId)
            });
        } catch (e) {
            if (e instanceof exceptions.GameDoesntExist) {
                e = Object.assign(new GameDoesntExist(), e);
            }

            return e;
        }
    }

    @Subscription(returns => GameResponse, {
        topics: "GAME_RESPONSE",
        filter: async ({payload, context}) => {
            console.log(payload, payload.fromUserId, (await context.user).id, payload && payload.fromUserId == (await context.user).id)
            return payload && payload.fromUserId == (await context.user).id
        }
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

    @Subscription(returns => GameStateUnion, {
        topics: "GAME_STATE",
        filter: async ({payload, context}) => true,
    })
    gameState(@Root() gameState: any): typeof GameStateUnion {
        if (gameState.type === 'SYMBOL_PLACEMENT') {
            let result = new SymbolPlacement();
            result.x = gameState.x;
            result.y = gameState.y;
            result.symbol = gameState.symbol;

            return result;
        } else if (gameState.type === 'WIN') {
            let result = new GameWin();
            result.player = gameState.player;

            return result;
        }
    }
}
