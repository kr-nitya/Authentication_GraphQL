// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const { UserInputError } = require("apollo-server");

// const {
//   validateRegisterInput,
//   validateLoginInput,
// } = require("../../util/validators");
// const dotenv = require("dotenv");
// dotenv.config();
// const SECRET_KEY = process.env.SECRET_KEY || "";
// const User = require("../../models/User");

// function generateToken(user) {
//   return jwt.sign(
//     {
//       id: user.id,
//       email: user.email,
//       username: user.username,
//     },
//     SECRET_KEY,
//     { expiresIn: "2m" }
//   );
// }

// module.exports = {
//   Mutation: {
//     async login(_, { username, password }, context) {
//       const { req } = context;

//       // Get token from headers
//       const token = req.headers.authorization || "";

//       const { errors, valid } = validateLoginInput(username, password);

//       if (!valid) {
//         throw new UserInputError("Errors", { errors });
//       }

//       // If token is provided, verify it
//       if (token) {
//         try {
//           const decodedToken = jwt.verify(token, SECRET_KEY);
//           return {
//             ...decodedToken,
//             token,
//           };
//         } catch (error) {
//           throw new UserInputError("Invalid token", {
//             errors: { token: "Invalid or expi red token" },
//           });
//         }
//       }

//       const user = await User.findOne({ username });

//       if (!user) {
//         errors.general = "User not found";
//         throw new UserInputError("User not found", { errors });
//       }

//       const match = await bcrypt.compare(password, user.password);
//       if (!match) {
//         errors.general = "Wrong credentials";
//         throw new UserInputError("Wrong credentials", { errors });
//       }

//       return {
//         ...user._doc,
//         id: user._id,
//       };
//     },
//     async register(
//       _,
//       { registerInput: { username, email, password, confirmPassword } }
//     ) {
//       // Validate user data
//       const { valid, errors } = validateRegisterInput(
//         username,
//         email,
//         password,
//         confirmPassword
//       );
//       if (!valid) {
//         throw new UserInputError("Errors", { errors });
//       }
//       // Check if user already exists
//       const user = await User.findOne({ username });
//       if (user) {
//         throw new UserInputError("Username is taken", {
//           errors: {
//             username: "This username is taken",
//           },
//         });
//       }
//       // Hash password and create an auth token
//       password = await bcrypt.hash(password, 12);

//       const newUser = new User({
//         email,
//         username,
//         password,
//         createdAt: new Date().toISOString(),
//       });

//       const res = await newUser.save();

//       const generatedToken = generateToken(res);

//       return {
//         ...res._doc,
//         id: res._id,
//         token: generatedToken,
//       };
//     },
//   },
// };
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserInputError } = require("apollo-server");

const { validateRegisterInput, validateLoginInput,} = require("../../utility/validators");
const dotenv = require("dotenv");
dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY || "";
const User = require("../../models/User");

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
      const user = await User.findOne({ username });
      const authToken = req.headers.authorization || "";
      const { errors, valid } = validateLoginInput(username, password);
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }
      if (authToken) {
        try {
          const decodedToken = jwt.verify(authToken, SECRET_KEY);
          return {
            ...decodedToken,
            token: authToken,
          };
        } catch (error) {
          return {
            error
          };
         
        }
      }
      if (!user) {
        errors.general = "User not found";
        throw new UserInputError("User not found", { errors });
      }
    
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        errors.general = "Wrong credentials";
        throw new UserInputError("Wrong credentials", { errors });
      }
    
      // If token is not provided or if provided token is invalid, generate new token
      if (!authToken) {
        newToken = generateToken(user);
      }
    
      return {
        ...user._doc,
        id: user._id,
        token: newToken,
      };
    },
    
    async register(_,{ registerInput: { username, email, password, confirmPassword } }) {
      const { valid, errors } = validateRegisterInput(
        username,
        email,
        password,
        confirmPassword
      );
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }
      // Check if user already exists
      const user = await User.findOne({ username });
      if (user) {
        throw new UserInputError("Username is taken", {
          errors: {
            username: "This username is taken",
          },
        });
      }
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create new user
      const newUser = new User({
        email,
        username,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      });

      // Save user to database
      const res = await newUser.save();

      return {
        ...res._doc,
        id: res._id,
      };
    },
  },
};
