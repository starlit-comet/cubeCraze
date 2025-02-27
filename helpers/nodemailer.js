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

module.exports={
transporter,mailCreator
}


// {
//     from: process.env.GOOGLE_APP_EMAIL,
//     to: userData.email,
//     subject: "Your OTP for CubeCraze SignUp",
//     text: `Your OTP code is ${newSecretOTP}. It is valid for 3 minute.`
// };