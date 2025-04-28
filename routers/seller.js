import express from "express";
import {
  handleSellerAllOrder,
  handleSellerLogin,
  handleSellerLogout,
  handleSellerMyOrder,
  handleSellerOrder,
  handlesellerProfile,
} from "../controller/seller.js";
import { isSellerAuthenticated } from "../middleware/auth.js";
import { billvalidator } from "../middleware/multer.js";

const router = express.Router();

router.post("/sellerlogin", handleSellerLogin);

router.use(isSellerAuthenticated);
router.get("/sellerprofile", handlesellerProfile);

router.put("/sellerorder/:id", billvalidator, handleSellerOrder);
router.get("/sellerlogout", handleSellerLogout);
router.get("/sellermyorder", handleSellerMyOrder);
router.get("/sellerallorder", handleSellerAllOrder);

export default router;
