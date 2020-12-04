import {Inject} from "typedi";
import {Mutation, Query, Resolver, InputType, Field, Arg, Ctx} from "type-graphql";
import {User} from "../typedefs/User";
import {RegisterResponse} from "../typedefs/RegisterResponse";
import {authenticate} from "../../auth";
import {UserService} from "../../services/UserService";
import config from "../../config";
import {JWT} from "../typedefs/JWT";
import {forUser as JWTForUser} from "../../auth/jwt";

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

    @Query()
    placeholder(): string {
        return "hello there"
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

    @Mutation(returns => RegisterResponse)
    async register(
        @Arg("input") input: RegisterInput
    ): Promise<RegisterResponse> {
        let response = new RegisterResponse();
        try {
            await this.userService.save(await this.userService.create(input));
            response.success = true;
        } catch (e) {
            response.success = false;
            response.validationErrors = [
                {field: "username", messages: ["This username is already in use."]}
            ]
        }

        return response;
    }
}
