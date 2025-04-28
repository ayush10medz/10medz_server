import express from "express";
import { getMyProfile, handleLogin, handleLogout } from "../controller/user.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", handleLogin);
router.use(isAuthenticated);
router.get("/me",getMyProfile)
router.get("/logout", handleLogout);

export default router;
