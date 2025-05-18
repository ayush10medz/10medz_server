import express from 'express';
import { sendOTP, resendOTP, verifyOTP } from '../controller/otp.controller.js';

const router = express.Router();

// Send OTP
router.post('/send', sendOTP);

// Resend OTP
router.post('/resend', resendOTP);

// Verify OTP
router.post('/verify', verifyOTP);

export default router; 