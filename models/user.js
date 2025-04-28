import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    phoneNumber: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = model.User || model("User", userSchema);
