import AWS from 'aws-sdk';

// Configure AWS SDK, ideally do this ONCE in your app entry point
AWS.config.update({
    region: 'ap-south-1'
    // accessKeyId and secretAccessKey use ENV or your IAM role
});

const sns = new AWS.SNS();

// Function to generate a 6-digit OTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to validate Indian mobile number
export const validateIndianMobile = (mobileNumber) => {
    const indianMobileRegex = /^[6-9]\d{9}$/;
    return indianMobileRegex.test(mobileNumber);
};

// Function to send OTP via SMS using AWS SNS
export const sendOTPViaSMS = async (mobileNumber, otp) => {
    try {
        // Format the mobile number for India
        const formattedNumber = `+91${mobileNumber}`;

        const params = {
            Message: `Your OTP for verification is: ${otp}. Valid for 5 minutes.`,
            PhoneNumber: formattedNumber,
        };

        const result = await sns.publish(params).promise();

        console.log(`SMS sent successfully. Message ID: ${result.MessageId}`);
        return true;
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw new Error('Failed to send OTP SMS');
    }
};
