import {Arg, createUnionType, Ctx, Field, InputType, Mutation, Query, registerEnumType, Resolver, Root, Subscription} from "type-graphql";
import {User, UsernameAlreadyUsed} from "../typedefs/User";
import {authenticate} from "../../auth";
import {JWT} from "../typedefs/JWT";
import {forUser as JWTForUser} from "../../auth/jwt";
import {inject, injectable} from "tsyringe";
import {UserService} from "../../services/types";
import {UserStatusUpdate} from "../typedefs/UserStatusUpdate";
import {Profile} from "../typedefs/Profile";
import {RedisClient} from "redis";

const RegisterResultUnion = createUnionType({
    name: "RegisterResult",
    types: () => [User, UsernameAlreadyUsed] as const,
})

@InputType()
class LoginInput {
    @Field()
    username: string;

    @Field()
    password: string;
}

@InputType()
class RegisterInput {
    @Field()
    email: string;

    @Field()
    username: string;

    @Field()
    password: string;
}

@Resolver(User)
@injectable()
export class UserResolver {

    private readonly userService: UserService;
    private readonly redis: RedisClient;

    constructor(
        @inject("UserService") userService: UserService,
        @inject("redis") redis: RedisClient
    ) {
        this.userService = userService;
        this.redis = redis;
    }

    @Query(returns => Profile)
    async me(@Ctx() context): Promise<Profile> {
        return await context.user;
    }

    @Mutation(returns => JWT, {nullable: true})
    async login(
        @Arg("input") input: LoginInput,
        @Ctx() context
    ): Promise<JWT | null> {
        let user = await authenticate(context.request, {
            username: input.username,
            password: input.password,
        });

        if (user) {
            return JWTForUser(user);
        }
    }

    @Mutation(returns => RegisterResultUnion)
    async register(
        @Arg("input") input: RegisterInput
    ): Promise<typeof RegisterResultUnion> {
        return this.userService.save(await this.userService.create(input))
            .then(value => {
                let user = new User();
                user.username = value.username;

                return user;
            })
            .catch(e => {
                let usernameAlreadyUsed = new UsernameAlreadyUsed();
                usernameAlreadyUsed.message = "This username is already in use.";

                return usernameAlreadyUsed;
            });
    }

    @Query(returns => [UserStatusUpdate], {nullable: true})
    async activeUsers(@Ctx() context): Promise<UserStatusUpdate[]> {
        return new Promise(async (resolve) => {
            let userStatuses = [];

            for (let user of await this.userService.getAllActiveUsers(this.redis)) {
                if (user.id == (await context.user).id) {
                    continue;
                }

                let userStatus = new UserStatusUpdate();
                userStatus.user = user;
                userStatus.status = await this.userService.getStatus(this.redis, user);
                userStatuses.push(userStatus);
            }

            resolve(userStatuses);
        });
    }

    @Subscription({
        topics: "USER_STATUS",
        filter: async ({payload, context}) =>
            payload && payload.user.id != (await context.user).id
    })
    userStatus(
        @Root() userStatus
    ): UserStatusUpdate {
        return {
            user: userStatus.user,
            status: userStatus.status
        };
    }
}
