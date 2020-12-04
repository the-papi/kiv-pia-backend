import {Inject} from "typedi";
import {Mutation, Resolver, InputType, Field, Arg, Ctx, createUnionType} from "type-graphql";
import {User, UsernameAlreadyUsed} from "../typedefs/User";
import {authenticate} from "../../auth";
import {UserService} from "../../services/UserService";
import {JWT} from "../typedefs/JWT";
import {forUser as JWTForUser} from "../../auth/jwt";

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
    firstName: string;

    @Field()
    lastName: string;

    @Field()
    username: string;

    @Field()
    password: string;
}

@Resolver(User)
export class UserResolver {

    @Inject()
    private readonly userService: UserService

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
                user.firstName = value.firstName;
                user.lastName = value.lastName;

                return user;
            })
            .catch(e => {
                 let usernameAlreadyUsed = new UsernameAlreadyUsed();
                 usernameAlreadyUsed.message = "This username is already in use.";

                 return usernameAlreadyUsed;
            });
    }
}
