import { Socket } from "socket.io";
import { ErrorHandler, TryCatch } from "../utility/utility.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { Seller } from "../models/sellers.js";

export const isAuthenticated = TryCatch(async (req, res, next) => {
  const token = req.cookies.authToken;
  if (!token) {
    return next(new ErrorHandler("Please login to access this route", 401));
  }
  const decode = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decode._id;
  next();
});

export const isAdminAuthenticated = TryCatch(async (req, res, next) => {
  const adminToken = req.cookies.adminToken;
  if (!adminToken)
    return next(new ErrorHandler("This page only excess by admin", 401));
  const decode = jwt.verify(adminToken, process.env.ADMIN_SECRET_KEY);
  next();
});
export const isSellerAuthenticated = TryCatch(async (req, res, next) => {
  const sellerToken = req.cookies.sellerToken;
  if (!sellerToken)
    return next(new ErrorHandler("This page only excess by seller", 401));
  const decode = jwt.verify(sellerToken, process.env.JWT_SECRET);
  req.seller = decode._id;
  next();
});
export const isSalesPersonAuthenticated = TryCatch(async (req, res, next) => {
  const salespersonToken = req.cookies.salespersonToken;
  if (!salespersonToken)
    return next(new ErrorHandler("This page only excess by seller", 401));
  const decode = jwt.verify(salespersonToken, process.env.JWT_SECRET);
  req.salesPerson = decode._id;
  next();
});

export const socketAuthenticator = async (err, socket, next) => {
  try {
    if (err) return next(err);
    const authToken = socket.request.cookies.authToken;
    if (!authToken)
      return next(new ErrorHandler("Please login to access this route", 401));
    const decodeData = jwt.verify(authToken, process.env.JWT_SECRET);
    const user = await User.findById(decodeData._id);
    if (!user)
      return next(new ErrorHandler("Please login to access this route", 401));
    socket.user = user;
    return next();
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Please login to access this route", 401));
  }
};
