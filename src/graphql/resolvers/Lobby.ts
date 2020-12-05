import {Query, Mutation, InputType, Field, Arg, Ctx, Resolver, createUnionType} from "type-graphql";
import {AlreadyJoined, Lobby} from "../typedefs/Lobby";
import * as exceptions from "../../services/exceptions";
import {LobbyService} from "../../services/types";
import {inject, injectable} from "tsyringe";

const CreateLobbyResultUnion = createUnionType({
    name: "CreateLobbyResult",
    types: () => [AlreadyJoined, Lobby] as const,
})

const JoinLobbyResultUnion = createUnionType({
    name: "JoinLobbyResult",
    types: () => [AlreadyJoined, Lobby] as const,
})

@InputType()
class CreateLobbyInput {
    @Field()
    name: string;
}

@InputType()
class JoinLobbyInput {
    @Field()
    id: number;
}

@Resolver(Lobby)
@injectable()
export class LobbyResolver {

    private readonly lobbyService: LobbyService;

    constructor(@inject("LobbyService") lobbyService: LobbyService) {
        this.lobbyService = lobbyService;
    }

    @Query(returns => [Lobby])
    async lobbies(): Promise<Lobby[]> {
        return this.lobbyService.all();
    }

    @Mutation(returns => CreateLobbyResultUnion)
    async createLobby(
        @Arg("input") input: CreateLobbyInput,
        @Ctx() context,
    ): Promise<typeof CreateLobbyResultUnion> {
        if ((await (await context.user).activeLobby)) {
            let alreadyJoined = new AlreadyJoined();
            alreadyJoined.message = "You can't create new lobby, because you are already joined in another lobby."

            return alreadyJoined;
        }

        let lobby = await this.lobbyService.save(await this.lobbyService.create(input));
        lobby = await this.lobbyService.join(await context.user, lobby);

        let lobbyResult = new Lobby();
        lobbyResult.id = lobby.id;
        lobbyResult.name = lobby.name;

        return lobbyResult;
    }

    @Mutation(returns => JoinLobbyResultUnion)
    async joinLobby(
        @Arg("input") input: JoinLobbyInput,
        @Ctx() context,
    ): Promise<typeof JoinLobbyResultUnion> {
        return this.lobbyService.join(await context.user, input.id)
            .then(value => {
                    let lobby = new Lobby();
                    lobby.id = value.id;
                    lobby.name = value.name;

                    return lobby;
                }
            ).catch(e => {
                let exception: AlreadyJoined;
                if (e instanceof exceptions.LobbyAlreadyJoined) {
                    exception = new AlreadyJoined();
                    exception.message = e?.message;
                } else {
                    throw e;
                }

                return exception;
            });
    }
}
