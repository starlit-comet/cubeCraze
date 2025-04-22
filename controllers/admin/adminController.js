const path = require('path');
const adminModel = require('../../models/adminModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const RESPONSE_CODES = require('../../utils/StatusCodes')
const MESSAGES = require ('../../utils/responseMessages')
 
// Load Admin Login Page
const loadLogin = async (req, res) => {
    try {
        res.render('admin/login');
    } catch (error) {
        console.error("Error loading login page:", error);
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.INTERNAL_SERVER_ERROR);
    }
};

// Admin Login Validation
const formValidate = async (req, res) => {
    try {
        console.log(MESSAGES.EMAIL_NOT_FOUND)
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message:MESSAGES.EMAIL_AND_PASSWORD_ARE_REQUIRED , success: false });
        }

        const admin = await adminModel.findOne({ email });
        if (!admin) {
            return res.status(RESPONSE_CODES.OK).json({ message: MESSAGES.EMAIL_NOT_FOUND, success: false });
        }
        const isMatchPassword = await bcrypt.compare(password,admin.password);
    
        if (!isMatchPassword == true) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message:MESSAGES.INVALID_PASSWORD , success: false });
        }
        console.log('adminlogged in')
        req.session.admin = true;
        return res.status(RESPONSE_CODES.OK).json({ message:MESSAGES.LOGIN_SUCCESS, success: true });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.INTERNAL_SERVER_ERROR, success: false });
    }
};

// Forgot Password Page
const forgetPassword = async (req, res) => {
    try {
        res.render('admin/forgetPassword');
    } catch (error) {
        console.error("Error loading forget password page:", error);
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.INTERNAL_SERVER_ERROR);
    }
};

// Send OTP for Password Reset
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.EMAIL_REQUIRED });
        }
        const admin = await adminModel.findOne({ email });
        if (!admin) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({ message: MESSAGES.ADMIN_DATA_NOT_FOUND });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000);
        console.log(`Generated OTP: ${otp}`);

        // Save OTP in DB (for validation)
        admin.resetOtp = otp;
        admin.resetOtpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 mins
        await admin.save();

        // Send Email (You must configure Nodemailer)
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'your-email@gmail.com',
                pass: 'your-password',
            }
        });

        let mailOptions = {
            from: 'your-email@gmail.com',
            to: admin.email,
            subject: 'Your OTP Code',
            text: `Your OTP for password reset is: ${otp}`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "OTP Sent Successfully", success: true });

    } catch (error) {
        console.error("OTP Error:", error);
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
};

const viewErrorPage = async (req,res)=>{
    res.render('admin/errorPage')
}

// Admin Logout
const logout = (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
};

const viewServerErrorPage = async (req,res)=>{
    res.render('admin/serverErrorPage')

}
// Export Module
module.exports = {
    loadLogin,
    logout,
    formValidate,
    forgetPassword,
    sendOtp,viewErrorPage,
    viewServerErrorPage
};
