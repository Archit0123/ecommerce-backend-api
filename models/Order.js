const { Schema, model, isValidObjectId, Mongoose } = require("mongoose");

const orderSchema = new Schema({
  deliveryAddress: {
    country: {
      type: String,
      required: [true, "Country is required"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    postalCode: {
      type: String,
      required: [true, "postal code is required"],
    },
    line1: {
      type: String,
      required: [true, "address line 1 is required"],
    },
    line2: {
      type: String,
    },
  },
  user: {
    type: Schema.ObjectId,
    ref: "User",
    required: [true, "user is not found.Please try logging in again"],
  },
  products: [
    {
      product: {
        type: Schema.ObjectId,
        ref: "Product",
        required: [true, "there needs to be a product id"],
      },
      quantity: {
        type: Number,
        required: [true, "there needs to be a quantity"],
      },
      subtotal: {
        type: Number,
        required: [true, "subtotal is required"],
      },
    },
  ],
  paymentinfo: {
    id: {
      type: String,
      required: [true, "payment id is required"],
    },
    shippingamount: {
      type: Number,
      required: [true, "shipping amount is required"],
    },
    taxamount: {
      type: Number,
      required: [true, "tax amount is required"],
    },
    totalamount: {
      type: Number,
      required: [true, "total amount is required"],
    },
  },
  status: {
    type: String,
    default: "processing",
  },
  deliveredAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = new model("Order", orderSchema);
