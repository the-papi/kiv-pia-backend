import * as apollo from "apollo-server";
import {Arg, createUnionType, Ctx, Directive, Field, FieldResolver, InputType, Int, Mutation, PubSub, Query, registerEnumType, Resolver, Root, Subscription} from "type-graphql";
import * as exceptions from "../../services/exceptions";
import {GameService} from "../../services/types";
import {inject, injectable} from "tsyringe";
import {Player} from "../typedefs/Player";
import {GameRequest} from "../typedefs/GameRequest";
import {getRepository} from "typeorm";
import {Game as GameEntity} from "../../entity/Game";
import {User} from "../../entity/User";
import {RedisClient} from "redis";
import {BoardSize, Game, GameAlreadyStarted, GameDoesntExist, GameRejected, PlayerAlreadyInGame} from "../typedefs/Game";
import {GameResponse, GameResponseStatus} from "../typedefs/GameResponse";
import {SymbolPlacement} from "../typedefs/SymbolPlacement";
import {GameWin} from "../typedefs/GameWin";
import {GameRequestCancelled} from "../typedefs/GameRequestCancelled";
import {GeneralStatus} from "../typedefs/GeneralStatus";
import {container} from "../../tsyringe.config";

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

    @Field(() => BoardSize, {defaultValue: BoardSize.Seven})
    boardSize: BoardSize;
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

    constructor(
        @inject("GameService") gameService: GameService,
    ) {
        this.gameService = gameService;
    }

    @Directive('@auth')
    @Query(returns => Game, {nullable: true, description: "Returns active game for currently logged in user"})
    async activeGame(@Ctx() context) {
        return this.gameService.getActiveGame(await context.user);
    }

    @Directive('@auth')
    @FieldResolver({description: "Returns list of game states for the given game"})
    async gameStates(@Root() game: GameEntity) {
        return this.gameService.getGameStates(game);
    }

    @Directive('@auth')
    @Query(returns => [Game], {nullable: true, description: "Returns list of all finished games"})
    async gamesHistory(@Ctx() context) {
        return this.gameService.gamesHistory(await context.user);
    }

    @Directive('@auth')
    @FieldResolver(returns => Date)
    async datetime(@Root() game: GameEntity) {
        return game.updatedAt;
    }

    @Directive('@auth')
    @Mutation(returns => String, {nullable: true, description: "Send game request to another player"})
    async sendGameRequest(
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub,
        @Arg("input") input: GameRequestInput
    ): Promise<string | null> {
        try {
            return await this.gameService.sendGameRequest(pubSub, await context.user, input.userId, input.boardSize);
        } catch (e) {
            return null;
        }
    }

    @Directive('@auth')
    @Mutation(returns => CancelGameResultUnion, {description: "Cancels sent game request"})
    async cancelGameRequest(
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub,
        @Arg("input") input: CancelGameRequestInput
    ): Promise<typeof CancelGameResultUnion> {
        try {
            return Object.assign(new GeneralStatus(), {
                status: await this.gameService.cancelGameRequest(pubSub, input.requestId)
            });
        } catch (e) {
            if (e instanceof exceptions.GameDoesntExist) {
                e = Object.assign(new GameDoesntExist(), e);
            }

            return e;
        }
    }

    @Directive('@auth')
    @Subscription(returns => GameRequestResultUnion, {
        topics: "GAME_REQUEST",
        filter: async ({payload, context}) =>
            payload && payload.targetUserId == (await context.user).id,
        description: "You can receive game requests through this subscription"
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

    @Directive('@auth')
    @Mutation(returns => AcceptGameResultUnion, {description: "Accept game request and start the game"})
    async acceptGameRequestAndStartGame(
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub,
        @Arg("input") input: GameResponseInput
    ): Promise<typeof AcceptGameResultUnion> {
        return this.gameService.acceptGameRequest(pubSub, input.requestId).then(
            data => {
                return this.gameService.startGame(pubSub, data.users, data.boardSize).then(
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

    @Directive('@auth')
    @Mutation(returns => RejectGameResultUnion, {description: "Rejects the game request"})
    async rejectGameRequest(
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub,
        @Arg("input") input: GameResponseInput
    ): Promise<typeof RejectGameResultUnion> {
        try {
            return Object.assign(new GameRejected(), {
                status: await this.gameService.rejectGameRequest(pubSub, input.requestId)
            });
        } catch (e) {
            if (e instanceof exceptions.GameDoesntExist) {
                e = Object.assign(new GameDoesntExist(), e);
            }

            return e;
        }
    }

    @Directive('@auth')
    @Subscription(returns => GameResponse, {
        topics: "GAME_RESPONSE",
        filter: async ({payload, context}) => {
            return payload && payload.fromUserId == (await context.user).id
        },
        description: "Answer to the game request"
    })
    async gameResponse(@Root() gameResponse): Promise<GameResponse> {
        return {
            requestId: gameResponse.requestId,
            status: gameResponse.accepted ? GameResponseStatus.Accepted : GameResponseStatus.Rejected
        };
    }

    @Directive('@auth')
    @Mutation(returns => Boolean, {description: "Place assigned symbol at the given position"})
    async placeSymbol(
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub,
        @Arg("input") input: PlaceSymbolInput
    ): Promise<boolean> {
        return this.gameService.placeSymbol(pubSub, await context.user, input.x, input.y);
    }

    @Directive('@auth')
    @Subscription(returns => GameStateUnion, {
        topics: "GAME_STATE",
        // We need to use container.resolve, because we don't have access to `this.gameService` here
        filter: async ({payload, context}) => payload.gameId == (await (<GameService>container.resolve("GameService")).getActiveGame(await context.user)).id,
        description: "Sends new game states"
    })
    gameState(@Root() gameState: any): typeof GameStateUnion {
        if (gameState.type === 'SYMBOL_PLACEMENT') {
            return Object.assign(new SymbolPlacement(), gameState);
        } else if (gameState.type === 'WIN') {
            return Object.assign(new GameWin(), gameState);
        }
    }
}
