const BigPromise = require("../utils/BigPromise");
const customErr = require("../utils/customErr");
const Product = require("../models/Product");

//Validating the order
//TODO: Remember to add payment verification here
exports.validateOrder = BigPromise(async (req, res, next) => {
  const { products } = req.body;
  let isInStock = true;
  for (let index = 0; index < products.length; index++) {
    const element = products[index];

    const prod = await Product.findById(element.product);
    console.log(`product aa rha ha kya? ${prod}`);

    if (prod.stock < element.quantity) {
      isInStock = false;
      break;
    }
  }
  if (!isInStock) {
    return next(new customErr("Product not in stock", 402));
  }
  console.log(`stock validation result ${isInStock}`);
  return next();
});

/*Remeber that array fuuntions like forEach and find use a callback function and thus if i had used those for the above
purpose then it results in weird bugs due to await keyword using the async of the callback function rather than the top level 
async. This is generally fine but for our above purpose it was resulting in not terminating the program upon error rather the
order was still being created despite the error due to the behaviour of async-await.*/
