// require("dotenv").config();
const { Schema, model } = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    unique: [true, "This email is already being used by another user"],
    required: [true, "Email is required"],
    validate: [validator.isEmail, "This is not a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [4, "Password must have at least 4 characters"],
    select: false,
  },
  role: {
    type: String,
    default: "user",
  },
  addresses: [
    {
      country: {
        type: String,
      },
      state: {
        type: String,
      },
      city: {
        type: String,
      },
      postalCode: {
        type: String,
      },
      line1: {
        type: String,
      },
      line2: {
        type: String,
      },
    },
  ],
  orders: [], //TODO: Put in the orderschema in this array
  photo: {
    id: {
      type: String,
    },
    secure_url: {
      type: String,
    },
  },
  forgotPasswordToken: {
    type: String,
  },
  forgotPasswordExpiry: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now, //Dont write this syntax as Date.now() as we dont want to run this function upon saving files rather we want it to run when user is
    //created
  },
});

//Encrypting password before saving it using 'pre' hook.
//We cant use arrow functionn here because then we wont be able to access the "this" keyword because this keyword becomes undefined in case of arrow functions
// as it does not know which scope to use.
userSchema.pre("save", async function (next) {
  //We only want to encrypt password if the password field changes somehow,rather than messing up our entire code by encrypting password everytime before saving
  //the user schema otherwise if we make changes to some other field of user schema and save it then the system will waste time encrypting an already encrypted
  //password.
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

//Function to handle validating password at login time.
//This syntax is what the documentation suggested.
userSchema.method("validatePassword", async function (password) {
  return await bcrypt.compare(password, this.password);
}); //This function returns either true or false.

//For the above process, Hitesh Choudhary(course instructor) used the following syntax with 'methods' instead of 'method'
// userSchema.methods.validatePassword= async function (password) {
//   return await bcrypt.compare(password, this.password);
// };
//TODO: Check both syntaxes and figure out if they work the same while testing.

//Generating tokens
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
  return token;
};

//IMPORTANT: A token is generally something which encapsulates some information(or payload, which is id in above case). But when talk about the 'Forgot
//Password' token its not really a token rather its a random string that we store in the database.

//Forgot Password tokens
userSchema.method("generateForgotPasswordToken", function () {
  //Generating a random string
  const forgotToken = crypto.randomBytes(15).toString("hex");

  //Now we'll give the user the token in normal form but in the database we're gonna store the hash of it.
  //With crypto it generates the same hash for the same values so when its time to actually check forgot password we'll have to send user this token from
  //backend in plain text form, then get it back from him/her to the backend, hash the recieved token and then compare the new hashed token with the one
  //saved in the database. This ensures security

  //Saving to databse in hashed format
  this.forgotPasswordToken = crypto
    .createHash("sha256")
    .update(forgotToken)
    .digest("hex");

  //Setting expiry of this token.

  this.forgotPasswordExpiry = Date.now() + 10 * 60 * 1000; //This is setting expiry to 10 minutes

  return forgotToken;
});

module.exports = new model("User", userSchema);
