import {Arg, createUnionType, Ctx, Directive, Field, InputType, Mutation, Query, registerEnumType, Resolver, Root, Subscription} from "type-graphql";
import {User, EmailAlreadyUsed, PasswordTooWeak} from "../typedefs/User";
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
    types: () => [User, EmailAlreadyUsed, PasswordTooWeak] as const,
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

    @Directive('@auth')
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
        const data = {
            ...input,
            username: input.email
        }

        let user;
        try {
            user = await this.userService.create(data);
        } catch (e) {
            let passwordTooWeak = new PasswordTooWeak();
            passwordTooWeak.message = "Password is too weak.";

            return passwordTooWeak;
        }
        return this.userService.save(user)
            .then(value => {
                let user = new User();
                user.username = value.username;

                return user;
            })
            .catch(e => {
                let emailAlreadyUsed = new EmailAlreadyUsed();
                emailAlreadyUsed.message = "This email is already in use.";

                return emailAlreadyUsed;
            });
    }

    @Directive('@auth')
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

    @Directive('@auth')
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
