import * as apollo from "apollo-server";
import {SchemaDirectiveVisitor} from "apollo-server";
import {defaultFieldResolver, GraphQLField} from "graphql";

export default class AuthDirective extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        const {resolve = defaultFieldResolver} = field;
        field.resolve = async function (...args) {
            const ctx = args[2];
            if (!(await ctx.user)) {
                throw new apollo.AuthenticationError('Authentication is required')
            }

            return resolve.apply(this, args);
        };
    }
}
