// require("dotenv").config();
const mongoose = require("mongoose");
const customErr = require("../utils/customErr");

const dbConn = () => {
  mongoose
    .connect(process.env.DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(console.log("DB connected successfulyy"))
    .catch((e) => {
      console.log("DB connection failed");
      console.log(e);
      process.exit(1);
    });
};

module.exports = dbConn;
