const { ApolloServer } = require("apollo-server");
const mongoose = require("mongoose");
const typeDefs = require("./Controller/typeDefs");
const resolvers = require("./Controller/resolvers/users");
const dotenv = require("dotenv");
dotenv.config();
//Database Connection
const MONGODB = process.env.URL;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ req }),
});

mongoose
  .connect(MONGODB, { useNewUrlParser: true })
  .then(() => {
    console.log("MongoDB Connected");
    return server.listen({ port: 5000 });
  })
  .then((res) => {
    console.log(`Server running at ${res.url}`);
  });
