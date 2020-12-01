import "reflect-metadata";
import {createConnection} from "typeorm";
import {User} from "./entity/User";
import {ApolloServer, gql} from "apollo-server";
import schemas from './schemas'

createConnection().then(async connection => {

    const userRepository = connection.getRepository(User);
    const user = new User();
    user.firstName = "Timber";
    user.lastName = "Saw";
    // user.age = 25;
    await userRepository.save(user)
    console.log(await userRepository.find());

    const resolvers = {
        Query: {
            users: () => userRepository.find(),
        },
    };

    const server = new ApolloServer({typeDefs: schemas, resolvers});

    // The `listen` method launches a web server.
    server.listen().then(({url}) => {
        console.log(`🚀  Server ready at ${url}`);
    });

}).catch(error => console.log(error));

