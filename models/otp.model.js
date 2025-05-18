import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    mobileNumber: {
        type: String,
        required: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // Document will be automatically deleted after 5 minutes
    }
});

const OTP = mongoose.model('OTP', otpSchema);

export default OTP; 