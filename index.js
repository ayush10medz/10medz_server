import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./utility/features.js";
import { errorMiddleware, ErrorHandler } from "./utility/utility.js"; // Import ErrorHandler
import userRouter from "./routers/user.js";
import orderRouter from "./routers/order.js";
import adminRouter from "./routers/admin.js";
import sellerRouter from "./routers/seller.js";
import salesRouter from "./routers/SalesPerson.js";
import smartdataRouter from "./routers/smartdata.js";
import otpRouter from "./routers/otp.js";
import { createServer } from "http";

import cors from "cors";
import { v2 as cloudinary } from "cloudinary";

import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { socketAuthenticator } from "./middleware/auth.js";

import mongoose from "mongoose";

export const userSocketIDs = new Map();

dotenv.config({});

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.PACENT_URL,
      process.env.SELLER_URL,
      process.env.ADMIN_URL,
      "http://localhost:3000", // Consistent port
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.set("io", io);

try {
  // connectDB(process.env.MONGODB); // Handle potential DB connection errors
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => console.log("MongoDB connected!"))
    .catch(err => console.error("MongoDB connection error:", err));
} catch (error) {
  console.error("Failed to connect to MongoDB:", error);
  process.exit(1);
}

const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      process.env.PACENT_URL,
      process.env.SELLER_URL,
      process.env.ADMIN_URL,
      "http://localhost:3000", // Consistent port
    ],
    credentials: true,
  })
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/seller", sellerRouter);
app.use("/api/v1/sales", salesRouter);
app.use("/api/v1", smartdataRouter);
app.use("/api/v1/otp", otpRouter);

io.use((socket, next) => {
  cookieParser()(
    socket.request,
    socket.request.res,
    async (err) => await socketAuthenticator(err, socket, next)
  );
});

io.on("connection", (socket) => {
  console.log(`User connected with socket ID: ${socket.id}`);

  const user = socket.user;
  console.log(user);

  userSocketIDs.set(user._id.toString(), socket.id);

  console.log(userSocketIDs);

  socket.on("disconnect", () => {
    console.log(`User disconnected with socket ID: ${socket.id}`);
    if (socket.user && socket.user._id) {
      userSocketIDs.delete(socket.user._id.toString());
    }
  });
});

app.use(errorMiddleware);

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
