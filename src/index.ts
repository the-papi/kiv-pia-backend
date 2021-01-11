import * as dotenv from "dotenv";

dotenv.config();

import "reflect-metadata";
import * as apollo from "apollo-server";
import {container} from "./tsyringe.config";
import {createConnection} from "typeorm";
import {buildSchema} from "type-graphql";
import {UserResolver} from "./graphql/resolvers/User";
import {ChatMessageResolver} from "./graphql/resolvers/ChatMessage";
import {getUser} from "./auth";
import {GameResolver} from "./graphql/resolvers/Game";
import {UserService, UserStatus} from "./services/types";
import {RedisClient} from "redis";
import {FriendResolver} from "./graphql/resolvers/Friend";
import AuthDirective from "./graphql/directives/auth";
import AdminDirective from "./graphql/directives/admin";

createConnection().then(async connection => {
    const pubSub = new apollo.PubSub();
    let schema = await buildSchema({
        dateScalarMode: "isoDate",
        resolvers: [
            UserResolver,
            ChatMessageResolver,
            GameResolver,
            FriendResolver
        ],
        pubSub: pubSub,
        container: {
            get: someClass => container.resolve(someClass)
        }
    });

    apollo.SchemaDirectiveVisitor.visitSchemaDirectives(schema, {
        auth: AuthDirective,
        admin: AdminDirective
    })
    const server = new apollo.ApolloServer({
        tracing: true,
        schema: schema,
        context: ({req, connection}) => {
            if (connection) {
                return connection.context;
            }

            return {request: req, user: getUser({request: req})}
        },
        subscriptions: {
            onConnect: async (connectionParams, webSocket) => {
                let user = getUser({connectionParams: connectionParams});
                if (await user) {
                    let userService: UserService = container.resolve("UserService");
                    let redis: RedisClient = container.resolve("redis");
                    userService.setStatus(pubSub, redis, await user, UserStatus.Online);
                }

                return {user}
            },
            onDisconnect: async (webSocket, context) => {
                let userService: UserService = container.resolve("UserService");
                let redis: RedisClient = container.resolve("redis");
                let user = await (await context.initPromise).user;

                if (user) {
                    userService.setStatus(pubSub, redis, user, UserStatus.Offline);
                }
            }
        },
    });

    server.listen().then(({url, subscriptionsUrl}) => {
        console.log(`🚀  HTTP server ready at ${url}`);
        console.log(`🚀  Websocket server ready at ${subscriptionsUrl}`);
    });
}).catch(error => console.log(error));
