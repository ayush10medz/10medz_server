import { CUSTOMER_COMFORMED, NEW_ORDER } from "../constant/events.js";
import { getSockets } from "../lib/helper.js";
import Order from "../models/order.js";
import { User } from "../models/user.js";
import { uploadFilesToCloudinary, sendUserNotification } from "../utility/features.js";
import { ErrorHandler, TryCatch } from "../utility/utility.js";

export const handleOrder = TryCatch(async (req, res, next) => {
  const { name, remark, location } = req.body;

  if (!name) return next(new ErrorHandler("Name is required", 401));
  if (!location) return next(new ErrorHandler("Location is required", 401));

  // Cloudinary setup - assuming you have it configured
  const file = req.file;
  if (!file) return next(new ErrorHandler("Please upload a prescription", 404));

  const result = await uploadFilesToCloudinary([file]);

  const prescriptionLink = {
    public_id: result[0].public_id,
    url: result[0].url,
  };

  // Create order object based on whether user is authenticated
  const orderData = {
    name: name,
    prescriptionLink,
    location,
    remark,
  };

  // Only add user if authenticated
  if (req.user) {
    orderData.user = req.user;
  }

  const order = new Order(orderData);
  await order.save();

  // Send user notification (SMS for now) if user is authenticated
  if (req.user) {
    const user = await User.findById(req.user);
    if (user && user.phoneNumber) {
      // Send notification to customer number : English
      const message = `🌟 Your health matters to us!
✅ We’ve received your medicine order.
💊 Our team will make sure your essentials are delivered safely and promptly.
🙏 Stay well and thank you for trusting us with your care!`;
      await sendUserNotification(user.phoneNumber, message);

      // Send notification to customer number : Hindi
      const hindiMessage = `🌟 आपका स्वास्थ्य हमारे लिए महत्वपूर्ण है!
✅ हमने आपकी दवा का ऑर्डर प्राप्त कर लिया है।
💊 हमारी टीम आपके ज़रूरी मेडिसिन्स को सुरक्षित और जल्द से जल्द डिलीवर करेगी।
🙏 स्वस्थ रहें, और हम पर भरोसा करने के लिए धन्यवाद!`;
      await sendUserNotification(user.phoneNumber, hindiMessage);

      // Send notification to admin number
      const adminPhoneNumber = '7742464697';
      const adminMessage = `🤩 Ka-ching! ${name} (${user.phoneNumber}) just placed an order!  
🛠️ Please prepare and deliver it as soon as possible.  
😊 Let’s make another customer happy!`;
      await sendUserNotification(adminPhoneNumber, adminMessage);
    }
  }

  // Prepare response data
  const responseData = {
    _id: order._id,
    name: name,
    prescriptionLink: prescriptionLink.url,
    price: order.price,
    billLink: order?.billLink?.url,
    orderStatus: order.orderStatus,
    location: location,
    remark,
    createdAt: order.createdAt,
  };

  // Add user phone number if authenticated
  if (req.user) {
    const user = await User.findById(req.user);
    if (user) {
      responseData.phoneNumber = user.phoneNumber;
    }
  }

  const io = req.app.get("io");
  io.emit(NEW_ORDER, responseData);

  res.status(200).json({
    success: true,
    message: "We will reach you in 2 minutes",
    realTimeOrder: responseData,
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
