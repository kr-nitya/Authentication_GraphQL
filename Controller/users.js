const bcrypt = require("bcryptjs");
const Redis = require("ioredis");
const jwt = require("jsonwebtoken");
const { UserInputError } = require("apollo-server");
const {
  validateRegisterInput,
  validateLoginInput,
} = require("../utility/validators");
const dotenv = require("dotenv");
dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY || "";
const User = require("../models/User");
const client = new Redis();

client.on("error", function (error) {
  console.error(error);
});

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    SECRET_KEY,
    { expiresIn: "2m" }
  );
}

module.exports = {
  Mutation: {
    async login(_, { username, password }, context) {
      const { req } = context;
      let newToken;
      const authToken = req.headers.authorization || "";
      const user = await User.findOne({ username });
      if (authToken) {
        try {
          const decodedToken = jwt.verify(authToken, SECRET_KEY);
          await client.set(authToken, JSON.stringify(user)); // Expires in 2 minutes (120 seconds)
          console.log("Data store in cache");
          return {
            ...decodedToken,
            token: authToken,
          };
        } catch (error) {
          throw new UserInputError("Invalid token. Please log in again", {
            error,
          });
        }
      }
      const { errors, valid } = validateLoginInput(username, password);
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }
      if (!user) {
        throw new UserInputError("User not found");
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        throw new UserInputError("Wrong credentials");
      }
      // Generate token
      newToken = generateToken(user);
      return {
        ...user._doc,
        id: user._id,
        token: newToken,
      };
    },
    async register(
      _,
      { registerInput: { username, email, password, confirmPassword } }
    ) {
      const { valid, errors } = validateRegisterInput(
        username,
        email,
        password,
        confirmPassword
      );
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        throw new UserInputError("Username is taken", {
          errors: { username: "This username is taken" },
        });
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = new User({
        email,
        username,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      });
      const res = await newUser.save();
      return {
        ...res._doc,
        id: res._id,
      };
    },
  },
  Query: {
    async getDetails(_, __, context) {
      const { req } = context;
      const authToken = req.headers.authorization || "";
      if (!authToken) {
        throw new UserInputError("Token not provided");
      }
      const cachedUserData = await client.get(authToken);
      if (!cachedUserData) {
        throw new UserInputError("User data not found in cache");
      }
      // Parse cached user data
      const userData = JSON.parse(cachedUserData);
      // Ensure all required fields are present
      if (!userData._id || !userData.email || !userData.username) {
        throw new UserInputError("Missing required fields in cached user data");
      }
      return userData;
    },
  },
};
