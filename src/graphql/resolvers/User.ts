import {Arg, createUnionType, Ctx, Directive, Field, FieldResolver, InputType, Int, Mutation, Query, registerEnumType, Resolver, Root, Subscription} from "type-graphql";
import {User, EmailAlreadyUsed, PasswordTooWeak} from "../typedefs/User";
import {authenticate} from "../../auth";
import {JWT} from "../typedefs/JWT";
import {forUser as JWTForUser} from "../../auth/jwt";
import {inject, injectable} from "tsyringe";
import {FriendService, UserService, UserStatus} from "../../services/types";
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

@InputType()
class ResetPasswordInput {
    @Field(() => Int)
    userId: number;
}

@InputType()
class ChangePasswordInput {
    @Field()
    oldPassword: string;

    @Field()
    newPassword: string;
}

@InputType()
class ChangeUserRoleInput {
    @Field(() => Int)
    userId: number;

    @Field()
    admin: boolean;
}

@Resolver(User)
@injectable()
export class UserResolver {

    private readonly userService: UserService;
    private readonly friendService: FriendService;

    constructor(
        @inject("UserService") userService: UserService,
        @inject("FriendService") friendService: FriendService,
    ) {
        this.userService = userService;
        this.friendService = friendService;
    }

    @Directive('@auth')
    @Query(returns => Profile)
    async me(@Ctx() context): Promise<Profile> {
        return await context.user;
    }

    @Directive('@auth')
    @Query(returns => [User])
    async users(@Ctx() context): Promise<User[]> {
        return this.userService.getAllUsers();
    }

    @Directive('@auth')
    @FieldResolver()
    async friendStatus(@Root() user, @Ctx() context) {
        return this.friendService.getFriendStatus(await context.user, user);
    }

    @Directive('@auth')
    @FieldResolver()
    async online(@Root() user) {
        return await this.userService.getStatus(user) === UserStatus.Online;
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
    @Mutation(returns => Boolean, {nullable: true})
    async changePassword(
        @Arg("input") input: ChangePasswordInput,
        @Ctx() context
    ): Promise<boolean> {
        try {
            return this.userService.changePassword(await context.user, input.oldPassword, input.newPassword);
        } catch (e) {
            return false;
        }
    }

    @Directive('@auth')
    @Directive('@admin')
    @Mutation(returns => String, {nullable: true})
    async resetPassword(
        @Arg("input") input: ResetPasswordInput
    ): Promise<string> {
        return this.userService.resetPassword(input.userId);
    }

    @Directive('@auth')
    @Directive('@admin')
    @Mutation(returns => String, {nullable: true})
    async changeUserRole(
        @Arg("input") input: ChangeUserRoleInput
    ): Promise<boolean> {
        return this.userService.changeUserRole(input.userId, input.admin);
    }

    @Directive('@auth')
    @Query(returns => [UserStatusUpdate], {nullable: true})
    async activeUsers(@Ctx() context): Promise<UserStatusUpdate[]> {
        return new Promise(async (resolve) => {
            let userStatuses = [];

            for (let user of await this.userService.getAllActiveUsers()) {
                if (user.id == (await context.user).id) {
                    continue;
                }

                let userStatus = new UserStatusUpdate();
                userStatus.user = user;
                userStatus.status = await this.userService.getStatus(user);
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
