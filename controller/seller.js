import { CUSTOMER_COMFORMATION } from "../constant/events.js";
import { getSockets } from "../lib/helper.js";
import Order from "../models/order.js";
import { SalesPerson } from "../models/salesperson.js";
import { Seller } from "../models/sellers.js";
import {
  sellerCookieOption,
  sellerToken,
  uploadFilesToCloudinary,
} from "../utility/features.js";
import { ErrorHandler, TryCatch } from "../utility/utility.js";

export const handleSellerLogin = TryCatch(async (req, res, next) => {
  const { number } = req.body;

  // Check if the phone number is provided
  if (!number) {
    return next(new ErrorHandler("Please enter phone number"));
  }

  // Check if the seller exists
  const seller = await Seller.findOne({ phoneNumber: number });
  if (!seller) {
    return next(new ErrorHandler("Seller not found with this number", 404));
  }

  // Assuming sellerToken is a utility function for token creation and response
  sellerToken(res, seller, 201, `Welcome, ${seller.sellerName}!`);
});
export const handleSellerOrder = TryCatch(async (req, res, next) => {
  const orderId = req.params.id;
  const { orderStatus, price } = req.body;

  // Ensure both orderStatus and price are provided
  if (orderStatus === undefined || price === undefined) {
    return next(new ErrorHandler("Please provide updated info", 401));
  }

  // Check if the order exists
  let orderExist = await Order.findOne({ _id: orderId });
  if (!orderExist) {
    return next(new ErrorHandler("Invalid order ID", 401));
  }

  const file = req.file;
  if (!file) return next(new ErrorHandler("Please upload a prescription", 400)); // Changed to 400 Bad Request

  try {
    const result = await uploadFilesToCloudinary([file]);

    if (!result || !result[0] || !result[0].public_id || !result[0].url) {
      return next(new ErrorHandler("Error uploading file", 500));
    }

    const billLink = {
      public_id: result[0].public_id,
      url: result[0].url,
    };

    // Update the order fields
    orderExist.billLink = billLink;
    orderExist.orderStatus = orderStatus;
    orderExist.price = price;
    orderExist.seller = req.seller;

    // Save the updated order
    await orderExist.save();

    const informationForConfirmation = {
      _id: orderExist._id,
      price: price,
      billLink: billLink?.url,
      orderStatus: orderExist.orderStatus,
    };

    const io = req.app.get("io");
    const userSocket = getSockets(orderExist.user);
    const ayush = io
      .to(userSocket)
      .emit(CUSTOMER_COMFORMATION, informationForConfirmation); // Corrected spelling
    console.log(ayush);

    // Send success response
    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order: orderExist,
    });
  } catch (error) {
    return next(new ErrorHandler("Error processing order update", 500));
  }
});

export const handleSellerLogout = TryCatch(async (req, res, next) => {
  // Clear the authToken cookie
  res.cookie("sellerToken", "", {
    ...sellerCookieOption,
    expires: new Date(Date.now()), // Set expiration to the past to delete the cookie
  });

  // Send a response indicating success
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export const handleSellerMyOrder = TryCatch(async (req, res, next) => {
  const sellerOrder = await Order.find({ seller: req.seller }).populate(
    "user",
    "phoneNumber"
  );

  const transformedSellerOrder = sellerOrder.map(
    ({
      prescriptionLink,
      billLink,
      user,
      name,
      orderStatus,
      price,
      createdAt,
      updatedAt,
    }) => {
      return {
        name: name,
        phoneNumber: user.phoneNumber,
        prescriptionLink: prescriptionLink.url,
        price: price,
        billLink: billLink.url,
        createdAt: createdAt,
        updatedAt: updatedAt,
        orderStatus: orderStatus,
      };
    }
  );

  res.status(200).json({
    success: true,
    transformedSellerOrder,
  });
});

export const handlesellerProfile = TryCatch(async (req, res, next) => {
  const myProfile = await Seller.findById(req.seller);
  res.status(200).json({ success: true, myProfile });
});

export const handleSellerAllOrder = TryCatch(async (req, res, next) => {
  const allOrders = await Order.find().populate("user", "phoneNumber");
  if (!allOrders || allOrders.length === 0) {
    return next(new ErrorHandler("No orders exist", 404));
  }

  // Use Promise.all to handle asynchronous logic inside map
  const transformedAllOrder = await Promise.all(
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
        salesName: salesPersonExist?.salesName, // Handle if salesPerson doesn't exist
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

  // Send the response
  res.status(200).json({
    success: true,
    transformedAllOrder,
  });
});
