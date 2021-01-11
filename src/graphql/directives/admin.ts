import * as apollo from "apollo-server";
import {SchemaDirectiveVisitor} from "apollo-server";
import {defaultFieldResolver, GraphQLField} from "graphql";

export default class AdminDirective extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        const {resolve = defaultFieldResolver} = field;
        field.resolve = async function (...args) {
            const ctx = args[2];
            if (!(await ctx.user).admin) {
                throw new apollo.ForbiddenError('Admin role is required')
            }

            return resolve.apply(this, args);
        };
    }
}
