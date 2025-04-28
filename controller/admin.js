import Order from "../models/order.js";
import { SalesPerson } from "../models/salesperson.js";
import { Seller } from "../models/sellers.js";
import { User } from "../models/user.js";
import { cookieOption } from "../utility/features.js";
import { ErrorHandler, errorMiddleware, TryCatch } from "../utility/utility.js";
import jwt from "jsonwebtoken";

export const handleAdminLogin = TryCatch(async (req, res, next) => {
  const { secretKey } = req.body;

  const adminSecretKey = process.env.ADMIN_SECRET_KEY;
  const isMatch = secretKey === adminSecretKey;
  if (!isMatch) return next(new ErrorHandler("Invalid key", 401));

  const token = jwt.sign(secretKey, process.env.ADMIN_SECRET_KEY);
  return res
    .status(200)
    .cookie("adminToken", token, {
      ...cookieOption,
      maxAge: 1000 * 60 * 60 * 24,
    })
    .json({
      success: true,
      message: "welcome boss",
    });
});

export const handleAdminLogout = TryCatch(async (req, res, next) => {
  return res
    .status(200)
    .cookie("adminToken", "", { ...cookieOption, maxAge: 0 })
    .json({
      success: true,
      message: "logout successfully",
    });
});

export const handleAllUsers = TryCatch(async (req, res, next) => {
  const allUsers = await User.find();
  if (!allUsers) return next(new ErrorHandler("No User exist", 404));
  res.status(200).json({
    success: true,
    allUsers,
  });
});
export const handleAllOrders = TryCatch(async (req, res, next) => {
  const allOrders = await Order.find()
    .populate("user", "phoneNumber")
    .populate("seller", "sellerName");
  if (!allOrders) return next(new ErrorHandler("No order exist", 404));

  const transformedOrders = await Promise.all(
    allOrders.map(async (order) => {
      const {
        _id,
        prescriptionLink,
        billLink,
        user,
        name,
        orderStatus,
        price,
        createdAt,
        updatedAt,
        location,
        remark,
        salesPerson,
      } = order;

      // Find the sales person by ID
      const salesPersonExist = await SalesPerson.findById(salesPerson);

      return {
        _id,
        name,
        phoneNumber: user.phoneNumber,
        salesName: salesPersonExist?.salesName , // Handle if salesPerson doesn't exist
        prescriptionLink: prescriptionLink?.url, // Handle possible null values
        price,
        billLink: billLink?.url, // Handle possible null values
        orderStatus,
        location,
        remark,
        createdAt,
      };
    })
  );
  res.status(200).json({
    success: true,
    transformedOrders,
  });
});

export const handleAdminProfile = TryCatch(async (req, res, next) => {
  const adminToken = req.cookies.adminToken;
  if (!adminToken)
    return next(new ErrorHandler("this page only excess by admin", 401));
  jwt.verify(adminToken, process.env.ADMIN_SECRET_KEY);
  res.status(200).json({ success: true, message: "admin is here" });
});

export const handleSellerRegister = TryCatch(async (req, res, next) => {
  const { phoneNumber, sellerName, sellerAddress } = req.body;

  if (!phoneNumber || !sellerName || !sellerAddress) {
    return next(new ErrorHandler("All fields are required"));
  }

  let seller = await Seller.findOne({ phoneNumber: phoneNumber });
  if (seller) {
    return next(new ErrorHandler("Seller already exists"));
  }

  seller = new Seller({
    phoneNumber,
    sellerName,
    sellerAddress,
  });

  await seller.save();

  res.status(201).json({
    success: true,
    message: "Seller created successfully",
  });
});

export const handleAllSeller = TryCatch(async (req, res, next) => {
  const sellers = await Seller.find();
  if (!sellers) return next(new ErrorHandler("NO seller exist", 404));

  res.status(201).json({
    success: true,
    sellers,
  });
});
export const handleSalesPerson = TryCatch(async (req, res, next) => {
  const { name, phoneNumber } = req.body;

  if (!name || !phoneNumber)
    return next(new ErrorHandler("All inputs are required", 404));

  let salesPerson = await SalesPerson.findOne({ phoneNumber });
  if (salesPerson)
    return next(new ErrorHandler("Sales Person already exists with this Number", 400));

  salesPerson = new SalesPerson({
    phoneNumber,
    salesName: name,
  });

  await salesPerson.save();

  res.status(201).json({
    success: true,
    message: "SalesPerson Created Successfully",
  });
});
