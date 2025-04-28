import express from "express";
import { handleSalesLogin, handleSalesPersonOrder } from "../controller/salesperson.js";
import { isSalesPersonAuthenticated } from "../middleware/auth.js";
import { prescription } from "../middleware/multer.js";

const router = express.Router();

router.post("/login", handleSalesLogin);
router.use(isSalesPersonAuthenticated);
router.post("/order", prescription, handleSalesPersonOrder);

export default router;
