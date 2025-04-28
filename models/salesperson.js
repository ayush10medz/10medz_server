import { Schema, model } from "mongoose";

const salespersonSchema = new Schema(
  {
    phoneNumber: {
      type: Number,
      required: true,
    },
    salesName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SalesPerson =
  model.SalesPerson || model("SalesPerson", salespersonSchema);
