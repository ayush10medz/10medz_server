import express from "express";

import {
  handleAdminLogin,
  handleAdminLogout,
  handleAdminProfile,
  handleAllOrders,
  handleAllSeller,
  handleAllUsers,
  handleSalesPerson,
  handleSellerRegister,
} from "../controller/admin.js";
import { isAdminAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.post("/adminlogin", handleAdminLogin);

router.use(isAdminAuthenticated);
router.get("/adminprofile", handleAdminProfile);
router.get("/adminlogout", handleAdminLogout);

router.get("/allusers", handleAllUsers);
router.get("/allorders", handleAllOrders);
router.post("/newseller", handleSellerRegister);
router.get("/allseller", handleAllSeller);
router.post("/newsalesperson",handleSalesPerson)

export default router;
