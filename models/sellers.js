import { Schema, model } from "mongoose";

const sellerSchema = new Schema(
  {
    phoneNumber: {
      type: Number,
      required: true,
    },
    sellerName: {
      type: String,
      required: true,
    },
    sellerAddress: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Seller = model.Seller || model("Seller", sellerSchema);
