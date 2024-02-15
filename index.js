const { ApolloServer } = require('apollo-server');
const mongoose = require('mongoose');
const typeDefs = require('./Controller/typeDefs');
const resolvers = require('./Controller/users');
const dotenv = require('dotenv');
dotenv.config();
const MONGODB = process.env.URL;

const server = new ApolloServer({
  typeDefs,
  resolvers: applyMiddlewareForAuth(resolvers),
  context: ({ req }) => ({ req }),
});

function applyMiddlewareForAuth(resolvers) {
  const authenticatedResolvers = ['Query.getDetails','Query.randomTest']; 
  const publicResolvers = ['Query.publicData','Mutation.register','Mutation.login']; 

  authenticatedResolvers.forEach((resolverPath) => {
    const [typeName, fieldName] = resolverPath.split('.');
    const resolver = resolvers[typeName][fieldName];
    resolvers[typeName][fieldName] = async (...args) => {
      const [, , context] = args;
      if (!context.req.headers.authorization) {
        throw new Error('Authentication required!');
      }
      return resolver(...args);
    };
  });

  publicResolvers.forEach((resolverPath) => {
    const [typeName, fieldName] = resolverPath.split('.');
    const resolver = resolvers[typeName][fieldName];
    resolvers[typeName][fieldName] = resolver;
  });
  return resolvers;
}

mongoose
  .connect(MONGODB)
  .then(() => {
    console.log('MongoDB Connected');
    return server.listen({ port: 4000 });
  })
  .then((res) => {
    console.log(`Server running at ${res.url}`);
  });
