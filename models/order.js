import { Schema, Types, model } from "mongoose";

const orderSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    prescriptionLink: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    billLink: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    price: {
      type: Number,
    },
    orderStatus: {
      type: String,
      enum: [
        "Uploaded Rx",
        "Price Uploaded",
        "Confirm Order",
        "Out For Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Uploaded Rx",
    },
    seller: {
      type: Types.ObjectId,
      ref: "Seller",
    },
    salesPerson: {
      type: Types.ObjectId,
      ref: "SalesPerson",
    },
    remark: {
      type: String,
    },
    location: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Order = model("Order", orderSchema);

export default Order;
