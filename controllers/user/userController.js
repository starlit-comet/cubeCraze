const userSchema = require('../../models/userSchema')
const bcrypt=require('bcrypt')
const saltRound=process.env.SALTROUND
const nodemailer= require('nodemailer')





const loadHome = async(req,res)=>{
    try {
        res.render('users/userhome')
    } catch (error) {
        console.log(error)
       // res.status(500).send('PageNotFound')
        res.status(500).redirect('/pagenotfound')

    }
}
const userLogin =async (req,res)=>{
    try {
        res.render('users/login')
    } catch (error) {
        console.log(error)
        res.status(500).redirect('/pagenotfound')
    }
}
const errorPage = async (req,res)=>{
    try {
        res.render('users/pagenotfound')
    } catch (error) {
        console.log(error)
    }
}

const signUp = async (req,res)=>{
    try {
        res.render('users/signUp')
    } catch (error) {
        console.log(error)
    }
}
const aboutPage = async (req,res)=>{
    try {
        res.render('users/about')
    } catch (error) {
        console.log(error)
    }
}
const signIn = async (req,res)=>{
    try {
        console.log(req.body)
        const {email,password}=req.body
        const user= await userSchema.findOne({email,googleId:null})
        if(!user) res.send('email not found')
            if (!user.hashedPassword) {
                return res.status(400).json({ message: 'Password is missing' });
            }
    
        const isMatchPassword = await bcrypt.compare(password,user.hashedPassword)
        if(isMatchPassword) res.redirect('/home')
            else res.send('password not matching')
    } catch (error) {
        console.log(error)
    }
}
const createUser = async(req,res)=>{
    try {
        console.log(req.body)
        const {email,name,password,confirmPassword}=req.body
        const user = await userSchema.findOne({email})
        if(password!==confirmPassword) res.end('password not matching')
        else if(user) res.send('User already exists')
            
        const hashedPassword = await  bcrypt.hash(password,10)
        const newUser = new userSchema({email,name,hashedPassword})
        await newUser.save()
       
        // console.log(`new User added : ${name}`)
        // req.session.email=newUser.email
        sendOTPtoEmail(req,res,newUser)
        res.render('common/generateOTP',{newUser})

    } catch (error) {
        console.log(error)
    }
}
const userProfile=(req,res)=>{
    res.redirect('/profile')
}
const loadProfile=(req,res)=>{
    res.render('users/profile')
}
const logout = (req,res)=>{
    req.logout((err)=>{
        if(err)return next(err)
        req.session.destroy(()=>{
    res.redirect('/home')
        })})
}


// function giveNewOTP(){
//     let newOTP= Math.floor(100000 + Math.random() * 900000).toString();
//     return newOTP
// }

const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
 const generateOTP=(req,res)=>{
//     console.log()
//     res.render('common/generateOTP')
}
const verifyOTP=async (req,res)=>{
   const {otp,user}= req.body
//var userEmail = user.email
    console.log(`otp from page: ${otp}`)
    console.log(`user data:${user.email}`)
    if (!otp) {
        return res.status(400).json({ success: false, message: "OTP is required." });
    }

    if (otp === newOTP) {
       // console.log(user)
            const email = user.email
            const hashedPassword=user.hashedPassword
            const name=user.name
        const userToDatabase = new userSchema({email,hashedPassword,name})
       await userToDatabase.save()

        return res.json({ success: true, message: "OTP Verified Successfully! Redirecting..." });

    } else {
        return res.status(400).json({ success: false, message: "Incorrect OTP. Please try again." });
    }
}

const transporter= nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:process.env.GOOGLE_APP_EMAIL,
        pass:process.env.GOOGLE_APP_PASSWORD,

    }
})
const sendOTPtoEmail=async (req,res,user)=>{
   // const {user}=req.body
    // if(!email) return res.status(400).json({success:false,message:    })
// let newOTP = giveNewOTP()
    const mailOptions= {
        from:process.env.GOOGLE_APP_EMAIL,
        to:user.email,
        subject: 'Your OTP for CubeCraze SignUp',
        text:`your otp code is ${newOTP}. It is valid for 5 minutes.`
    }
    console.log(`mail sent`)
    // try {
        await transporter.sendMail(mailOptions);
       // res.json({ success: true, message: "OTP sent successfully!" });
       // console.log(user)
      //  await user.save()
    //} catch (error) {
      //  this.res.status(500).json({ success: false, message: "Error sending OTP" });
   // }
    // const newUser = new userSchema({email,name,hashedPassword})
   
    // console.log(`new User added : ${name}`)

}


const googleSignin= async(req,res)=>{

}
const products=[
    { 'name':'product1',
    'price':'56.23',},
    {
        'name':'product2',
        'price':'45.12'
    },{ 'name':'product1',
        'price':'56.23',},
        {
            'name':'product2',
            'price':'45.12'
        },{ 'name':'product1',
            'price':'56.23',},
            {
                'name':'product2',
                'price':'45.12'
            },{ 'name':'product1',
                'price':'56.23',},
                {
                    'name':'product2',
                    'price':'45.12'
                }

]
const showProducts=async(req,res)=>{
    res.render('users/products',{products})
}
module.exports={showProducts,loadHome,userLogin,errorPage,signUp,aboutPage,signIn,createUser,googleSignin,
    userProfile,loadProfile,logout,generateOTP,verifyOTP,sendOTPtoEmail}