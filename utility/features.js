import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import { v4 as uuid } from "uuid";

import mongoose from "mongoose";
import { getBase64 } from "../lib/helper.js";

export const connectDB = (url) => {
  mongoose
    .connect(url, { dbName: "medz" })
    .then((data) => {
      console.log(`connect to DB : ${data.connection.host}`);
    })
    .catch((err) => {
      console.log(err);
    });
};

export const cookieOption = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};
export const sellerCookieOption = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

export const sendToken = (res, user, code, message) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
  return res.status(code).cookie("authToken", token, cookieOption).json({
    success: true,
    message,
  });
};
export const sellerToken = (res, seller, code, message) => {
  const token = jwt.sign({ _id: seller._id }, process.env.JWT_SECRET);
  return res
    .status(code)
    .cookie("sellerToken", token, sellerCookieOption)
    .json({
      success: true,
      message,
    });
};
export const salesPersonToken = (res, salesperson, code, message) => {
  const token = jwt.sign({ _id: salesperson._id }, process.env.JWT_SECRET);
  return res.status(code).cookie("salespersonToken", token, cookieOption).json({
    success: true,
    message,
  });
};

export const uploadFilesToCloudinary = async (files = []) => {
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        getBase64(file),
        {
          resource_type: "auto",
          public_id: uuid(),
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });
  try {
    const results = await Promise.all(uploadPromises);
    const formattedResults = results.map((result) => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));
    return formattedResults;
  } catch (error) {
    throw new Error("error uploading files to cloudinary", error);
  }
};
