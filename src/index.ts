import * as dotenv from "dotenv";
dotenv.config();

import "reflect-metadata";
import {ApolloServer} from "apollo-server";
import {createConnection} from "typeorm";
import {buildSchema} from "type-graphql";
import {UserResolver} from "./graphql/resolvers/User";
import {Container} from "typedi";
import {getUser} from "./auth";

createConnection().then(async connection => {
    const server = new ApolloServer({
        schema: await buildSchema({resolvers: [UserResolver], container: Container}),
        context: ({req}) => {
            let user = getUser(req);
            return {request: req, user}
        }
    });

    server.listen().then(({url}) => {
        console.log(`🚀  Server ready at ${url}`);
    });
}).catch(error => console.log(error));
