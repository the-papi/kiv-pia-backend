import {Mutation, Resolver, InputType, Field, Arg, Ctx, createUnionType, Subscription, Root} from "type-graphql";
import {User, UsernameAlreadyUsed} from "../typedefs/User";
import {authenticate} from "../../auth";
import {JWT} from "../typedefs/JWT";
import {forUser as JWTForUser} from "../../auth/jwt";
import {inject, injectable} from "tsyringe";
import {UserService} from "../../services/types";
import {ChatMessage} from "../typedefs/ChatMessage";

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

    constructor(@inject("UserService") userService: UserService) {
        this.userService = userService;
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
                user.email = value.email;

                return user;
            })
            .catch(e => {
                 let usernameAlreadyUsed = new UsernameAlreadyUsed();
                 usernameAlreadyUsed.message = "This username is already in use.";

                 return usernameAlreadyUsed;
            });
    }

    @Subscription({
        topics: "USER_STATUS_UPDATE",
    })
    userList(@Root() user: User): User {
        return user;
    }
}
