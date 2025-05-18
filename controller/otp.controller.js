import OTP from '../models/otp.model.js';
import { generateOTP, validateIndianMobile, sendOTPViaSMS } from '../utility/otp.utility.js';
import jwt from 'jsonwebtoken';

// Send OTP
export const sendOTP = async (req, res) => {
    try {
        const { mobileNumber } = req.body;

        if (!mobileNumber) {
            return res.status(400).json({ success: false, message: 'Mobile number is required' });
        }

        if (!validateIndianMobile(mobileNumber)) {
            return res.status(400).json({ success: false, message: 'Invalid mobile number' });
        }

        // Generate new OTP
        const otp = generateOTP();

        // Save OTP to database
        await OTP.findOneAndUpdate(
            { mobileNumber },
            { otp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        // Send OTP via SMS
        await sendOTPViaSMS(mobileNumber, otp);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully'
        });
    } catch (error) {
        console.error('Error in sendOTP:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Resend OTP
export const resendOTP = async (req, res) => {
    try {
        const { mobileNumber } = req.body;

        if (!mobileNumber) {
            return res.status(400).json({ success: false, message: 'Mobile number is required' });
        }

        if (!validateIndianMobile(mobileNumber)) {
            return res.status(400).json({ success: false, message: 'Invalid Indian mobile number' });
        }

        // Generate new OTP
        const otp = generateOTP();

        // Update OTP in database
        await OTP.findOneAndUpdate(
            { mobileNumber },
            { otp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        // Send OTP via SMS
        await sendOTPViaSMS(mobileNumber, otp);

        res.status(200).json({
            success: true,
            message: 'OTP resent successfully'
        });
    } catch (error) {
        console.error('Error in resendOTP:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
    try {
        const { mobileNumber, otp } = req.body;

        if (!mobileNumber || !otp) {
            return res.status(400).json({ success: false, message: 'Mobile number and OTP are required' });
        }

        // Find OTP in database
        const otpRecord = await OTP.findOne({ mobileNumber });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'OTP not found or expired' });
        }

        // Check if OTP matches
        if (otpRecord.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { mobileNumber },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Delete OTP after successful verification
        await OTP.deleteOne({ mobileNumber });

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            token
        });
    } catch (error) {
        console.error('Error in verifyOTP:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}; 