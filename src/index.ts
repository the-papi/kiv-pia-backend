import * as dotenv from "dotenv";

dotenv.config();

import "reflect-metadata";
import {container} from "./tsyringe.config";
import {ApolloServer} from "apollo-server";
import {createConnection} from "typeorm";
import {buildSchema} from "type-graphql";
import {UserResolver} from "./graphql/resolvers/User";
import {ChatMessageResolver} from "./graphql/resolvers/ChatMessage";
import {getUser} from "./auth";
import {GameResolver} from "./graphql/resolvers/Game";

createConnection().then(async connection => {
    const server = new ApolloServer({
        tracing: true,
        schema: await buildSchema({
            resolvers: [
                UserResolver,
                ChatMessageResolver,
                GameResolver
            ], container: {
                get: someClass => container.resolve(someClass)
            }
        }),
        context: ({req, connection}) => {
            if (connection) {
                return connection.context;
            }

            return {request: req, user: getUser({request: req})}
        },
        subscriptions: {
            onConnect: (connectionParams, webSocket) => {
                return {user: getUser({connectionParams: connectionParams})}
            }
        },
    });

    server.listen().then(({url, subscriptionsUrl}) => {
        console.log(`🚀  HTTP server ready at ${url}`);
        console.log(`🚀  Websocket server ready at ${subscriptionsUrl}`);
    });
}).catch(error => console.log(error));
