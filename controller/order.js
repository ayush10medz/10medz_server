import { CUSTOMER_COMFORMED, NEW_ORDER } from "../constant/events.js";
import { getSockets } from "../lib/helper.js";
import Order from "../models/order.js";
import { User } from "../models/user.js";
import { uploadFilesToCloudinary } from "../utility/features.js";
import { ErrorHandler, TryCatch } from "../utility/utility.js";

export const handleOrder = TryCatch(async (req, res, next) => {
  const { name, remark, location } = req.body;

  if (!name) return next(new ErrorHandler("Name is required", 401));
  if (!location) return next(new ErrorHandler("Locationo is required", 401));

  // Cloudinary setup - assuming you have it configured
  const file = req.file; // Correct file extraction
  if (!file) return next(new ErrorHandler("Please upload a prescription", 404));

  const result = await uploadFilesToCloudinary([file]); // Assuming this is a function you've written

  const prescriptionLink = {
    public_id: result[0].public_id,
    url: result[0].url,
  };

  const order = new Order({
    user: req.user,
    name: name,
    prescriptionLink,
    location,
    remark,
  });
  await order.save();
  const user = await User.findById({ _id: req.user });
  if (!user) return next(new ErrorHandler("user not exist"), 401);

  const realTimeOrder = {
    _id: order._id,
    name: name,
    phoneNumber: user?.phoneNumber,
    prescriptionLink: prescriptionLink.url,
    price: order.price,
    billLink: order?.billLink?.url,
    orderStatus: order.orderStatus,
    location: location,
    remark,
    createdAt: order.createdAt,
  };

  const io = req.app.get("io");
  io.emit(NEW_ORDER, realTimeOrder);

  res.status(200).json({
    success: true,
    message: "We will reach you in 2 minutes",
    realTimeOrder,
  });
});

export const handleMyOrder = TryCatch(async (req, res, next) => {
  const allOrders = await Order.find({ user: req.user });

  if (!allOrders)
    return next(new ErrorHandler("you didn't order anythings from us"));

  const transformedOrders = allOrders.map(
    ({
      _id,
      name,
      prescriptionLink,
      billLink,
      price,
      orderStatus,
      createdAt,
    }) => {
      return {
        _id,
        name,
        prescriptionLink: prescriptionLink.url,
        billLink: billLink.url,
        price,
        orderStatus,
        createdAt,
      };
    }
  );
  res.status(200).json({
    success: true,
    transformedOrders,
  });
});

export const handleConfirmOrder = TryCatch(async (req, res, next) => {
  const orderId = req.params.id;
  const { orderStatus } = req.body;

  const orderExist = await Order.findById(orderId).populate(
    "user",
    "phoneNumber"
  );
  if (!orderExist) return next(new ErrorHandler("Invalid order ID", 401));

  orderExist.orderStatus = orderStatus;
  await orderExist.save();

  const realTimeOrder = {
    _id: orderExist._id,
    name: orderExist.name,
    phoneNumber: orderExist?.user?.phoneNumber,
    prescriptionLink: orderExist?.prescriptionLink.url,
    price: orderExist.price,
    billLink: orderExist?.billLink?.url,
    orderStatus: orderExist.orderStatus,
    location: orderExist.location,
    remark: orderExist.remark,
    createdAt: orderExist.createdAt,
  };

  const io = req.app.get("io");

  io.emit(CUSTOMER_COMFORMED, realTimeOrder);

  res.status(200).json({
    success: true,
    message: "Order updated successfully",
    orderExist,
  });
});
