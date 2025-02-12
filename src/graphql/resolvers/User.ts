import {Arg, createUnionType, Ctx, Directive, Field, FieldResolver, InputType, Int, Mutation, Query, registerEnumType, Resolver, Root, Subscription} from "type-graphql";
import {User, EmailAlreadyUsed, PasswordTooWeak} from "../typedefs/User";
import {authenticate} from "../../auth";
import {JWT} from "../typedefs/JWT";
import {forUser as JWTForUser, RefreshToken} from "../../auth/jwt";
import {inject, injectable} from "tsyringe";
import {FriendService, UserService, UserStatus} from "../../services/types";
import {UserStatusUpdate} from "../typedefs/UserStatusUpdate";
import {Profile} from "../typedefs/Profile";

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
    @Query(returns => Profile, {description: "Can be used to inspect user profile"})
    async me(@Ctx() context): Promise<Profile> {
        return await context.user;
    }

    @Directive('@auth')
    @Query(returns => [User], {description: "Returns list of all users"})
    async users(@Ctx() context): Promise<User[]> {
        return this.userService.getAllUsers();
    }

    @Directive('@auth')
    @FieldResolver({description: "Resolves friend status in context with the given user"})
    async friendStatus(@Root() user, @Ctx() context) {
        return this.friendService.getFriendStatus(await context.user, user);
    }

    @Directive('@auth')
    @FieldResolver({description: "Resolves if given user is online or not"})
    async online(@Root() user) {
        return await this.userService.getStatus(user) === UserStatus.Online;
    }

    @Mutation(returns => JWT, {nullable: true, description: "Login user by given credentials"})
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

    @Directive("auth")
    @Mutation(returns => JWT, {nullable: true, description: "Refresh login by valid auth session"})
    async refreshLogin(
        @Ctx() context
    ): Promise<JWT | null> {
        if (await context.user) {
            return JWTForUser(await context.user);
        }

        return null;
    }

    @Mutation(returns => RegisterResultUnion, {description: "Registers new user"})
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
    @Mutation(returns => Boolean, {nullable: true, description: "Changes password for the currently logged in user"})
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
    @Mutation(returns => String, {nullable: true, description: "Resets password to the given user"})
    async resetPassword(
        @Ctx() context,
        @Arg("input") input: ResetPasswordInput
    ): Promise<string> {
        if ((await context.user).id == input.userId) {
            return "";
        }

        return this.userService.resetPassword(input.userId);
    }

    @Directive('@auth')
    @Directive('@admin')
    @Mutation(returns => Boolean, {nullable: true, description: "Changes user role to admin or casual user"})
    async changeUserRole(
        @Ctx() context,
        @Arg("input") input: ChangeUserRoleInput
    ): Promise<boolean> {
        if ((await context.user).id == input.userId) {
            return false;
        }

        return this.userService.changeUserRole(input.userId, input.admin);
    }

    @Directive('@auth')
    @Query(returns => [UserStatusUpdate], {nullable: true, description: "Returns all online users"})
    async activeUsers(@Ctx() context): Promise<UserStatusUpdate[]> {
        return new Promise(async (resolve) => {
            let userStatuses = [];

            // Load status of all active users
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
            payload && payload.user.id != (await context.user).id,
        description: "Returns object when user changed it's status (online/offline)"
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
