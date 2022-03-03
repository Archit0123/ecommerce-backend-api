const BigPromise = require("../utils/BigPromise");

//Although here we're not having any promises for this route but still just to show how a big promise would
//work lets make this async-await.
// exports.home = BigPromise( async(req, res) => {
//   //await DB connection.
//   res.status(200).send(`<h1> Welcome to Ecom Store </h1>`);
// })

exports.home = (req, res) => {
  res.status(200).send(`<h1> Welcome to Ecom Store </h1>`);
};
