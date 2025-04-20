require('dotenv').config()
const nodemailer = require('nodemailer')

const transporter= nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:process.env.GOOGLE_APP_EMAIL,
        pass:process.env.GOOGLE_APP_PASSWORD,

    }
})

function mailCreator (userData){

return {
    from: process.env.GOOGLE_APP_EMAIL,
    to:userData.email,
    subject:`OTP for Verification of CubeCraze Account`,
    text:`Your OTP Code for Verification of CubeCraze Account is ${userData.otp}`,
}
}

function referalMail(userData, senderMail) {
    return {
        from: process.env.GOOGLE_APP_EMAIL,
        to: senderMail,
        subject: `Referral Code for CubeCraze Website - Redeem ₹100!`,
        text: `You have been referred by ${userData.name} to use our shopping website.
Click the link below to create an account and claim ₹100 off on any order:
http://localhost:3232/signup?referal=${userData.referalCode}`,
        html: `
            <p>You have been referred by <strong>${userData.name}</strong> to shop with us!</p>
            <p>Click the link below to create an account and get ₹100 off on your first order:</p>
            <p><a href="http://localhost:3232/signup?referal=${userData.referalCode}" style="color: #fff; background-color: #28a745; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Claim ₹100 Now</a></p>
            <p>Or copy and paste this link in your browser: <br> 
            <a href="http://localhost:3232/signup?referal=${userData.referalCode}">http://localhost:3232/signup?referal=${userData.referalCode}</a></p>
        `
    };
}


module.exports={
transporter,mailCreator,referalMail
}

