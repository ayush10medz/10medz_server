import { User } from "../models/user.js";
import { cookieOption, sendToken } from "../utility/features.js";
import { ErrorHandler, TryCatch } from "../utility/utility.js";

export const handleLogin = TryCatch(async (req, res, next) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) return next(new ErrorHandler("Phone Number is required!"));

  let user = await User.findOne({ phoneNumber });

  if (user) {
    sendToken(res, user, 201, `Welcome!`);
  } else {
    user = new User({ phoneNumber });

    try {
      await user.save();

      sendToken(res, user, 201, `Welcome!`);
    } catch (error) {
      return next(
        new ErrorHandler("Error registering user. Please try again.", 500)
      );
    }
  }
});

export const getMyProfile = TryCatch(async (req, res, nextt) => {
  const myProfile = await User.findById(req.user);
  res.status(200).json({ success: true, myProfile });
});

export const handleLogout = TryCatch(async (req, res, next) => {
  return res
    .status(200)
    .cookie("authToken", "", { ...cookieOption, maxAge: 0 })
    .json({
      success: true,
      message: "Logged out successfully",
    });
});
