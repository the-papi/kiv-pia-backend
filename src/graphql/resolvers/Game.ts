import * as apollo from "apollo-server";
import {Query, Mutation, Subscription, Resolver, InputType, Field, Arg, Ctx, PubSub, Root, createUnionType} from "type-graphql";
import * as exceptions from "../../services/exceptions";
import {Game, GameAlreadyStarted, NotInLobby} from "../typedefs/Game";
import {GameService} from "../../services/types";
import {inject, injectable} from "tsyringe";

const StartGameResultUnion = createUnionType({
    name: "StartGameResult",
    types: () => [Game, GameAlreadyStarted, NotInLobby] as const,
})

@Resolver(Game)
@injectable()
export class GameResolver {

    private readonly gameService: GameService;

    constructor(@inject("GameService") gameService: GameService) {
        this.gameService = gameService;
    }

    @Mutation(returns => StartGameResultUnion)
    async startGame(
        @Ctx() context,
        @PubSub() pubSub: apollo.PubSub
    ): Promise<typeof StartGameResultUnion> {
        return this.gameService.startForUser(await context.user)
            .then(async value => {
                let game = new Game();
                game.players = await this.gameService.players(value);

                return game;
            }).catch(e => {
                let exception: GameAlreadyStarted | NotInLobby;
                if (e instanceof exceptions.GameAlreadyStarted) {
                    exception = new GameAlreadyStarted();
                    exception.message = e?.message;

                } else if (e instanceof exceptions.NotInLobby) {
                    exception = new NotInLobby();
                    exception.message = e?.message;
                } else {
                    throw e;
                }

                return exception;
            });
    }

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
