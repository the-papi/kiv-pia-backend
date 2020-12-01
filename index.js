import { ApolloServer, gql, mergeSchemas } from 'apollo-server'
// import { sequelize, Sequelize } from './models'
import User from './models/user.js'
import schemas from './schemas/index.js'

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.

const resolvers = {
    Query: {
        users: () => User.findAll(),
    },
};

const server = new ApolloServer({ typeDefs: schemas, resolvers });

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});
