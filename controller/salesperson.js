import Order from "../models/order.js";
import { SalesPerson } from "../models/salesperson.js";
import {
  salesPersonToken,
  uploadFilesToCloudinary,
} from "../utility/features.js";
import { ErrorHandler, TryCatch } from "../utility/utility.js";

export const handleSalesLogin = TryCatch(async (req, res, next) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber)
    return next(new ErrorHandler("Phone Number is required", 404));

  const salesperson = await SalesPerson.findOne({ phoneNumber });
  if (!salesperson)
    return next(
      new ErrorHandler("You are not a Sales person in this company", 405)
    );

  salesPersonToken(res, salesperson, 201, `welcome ${salesperson.salesName}`);
});

export const handleSalesPersonOrder = TryCatch(async (req, res, next) => {
  const { name, remark, location } = req.body;
  if (!name) return next(new ErrorHandler("Name is required", 401));

  const file = req.file;
  if (!file) return next(new ErrorHandler("Please upload a prescription", 404));

  const result = await uploadFilesToCloudinary([file]);

  const prescriptionLink = {
    public_id: result[0].public_id,
    url: result[0].url,
  };

  const order = new Order({
    salesPerson: req.salesPerson,
    name: name,
    prescriptionLink,
    remark: remark,
    location,
  });

  await order.save();

  const salesPerson = await SalesPerson.findById(req.salesPerson);
  if (!salesPerson)
    return next(new ErrorHandler("Sales Person does not exist", 404));

  res.status(200).json({
    success: true,
    message: "We will reach you in 2 minutes",
    salesName: salesPerson.salesName,
    order,
  });
});
