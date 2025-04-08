const path = require('path');
const adminModel = require('../../models/adminModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');


// Load Admin Login Page
const loadLogin = async (req, res) => {
    try {
        res.render('admin/login');
    } catch (error) {
        console.error("Error loading login page:", error);
        res.status(500).send("Server error");
    }
};

// Admin Login Validation
const formValidate = async (req, res) => {
    try {
        // console.log("Received data:", req.body);
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(200).json({ message: 'Email and Password are required', success: false });
        }

        const admin = await adminModel.findOne({ email });
        if (!admin) {
            return res.status(200).json({ message: 'Email Not Found', success: false });
        }
       // console.log(admin)
        const isMatchPassword = await bcrypt.compare(password,admin.password);
       // console.log(isMatchPassword,password,admin.password)
       // console.log(isMatchPassword)
        if (!isMatchPassword == true) {
            return res.status(200).json({ message: 'Invalid Password', success: false });
        }
        console.log('adminlogged in')
        req.session.admin = true;
        return res.status(200).json({ message: 'LOGIN SUCCESS', success: true });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server Error', success: false });
    }
};

// Forgot Password Page
const forgetPassword = async (req, res) => {
    try {
        res.render('admin/forgetPassword');
    } catch (error) {
        console.error("Error loading forget password page:", error);
        res.status(500).send("Server error");
    }
};

// Send OTP for Password Reset
const sendOtp = async (req, res) => {
    try {
        console.log("Received email:", req.body);
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const admin = await adminModel.findOne({ email });
        if (!admin) {
            return res.status(400).json({ message: 'Admin Data not Found' });
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
        res.status(500).json({ message: 'Server Error' });
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

// Export Module
module.exports = {
    loadLogin,
    logout,
    formValidate,
    forgetPassword,
    sendOtp,viewErrorPage
};
