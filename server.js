require('dotenv').config();
const express= require('express')
const app=express()
const path = require('path')
// const mongoose = require('mongoose')
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bodyParser = require('body-parser')
const toastr = require('toastr')

const cors = require('cors')

const passport=require('passport')
const OAuth2Strategy = require('passport-oauth2')
const session = require('express-session');
const GoogleStrategy = require("passport-google-oauth20").Strategy
require('./config/passport')
const User=require('./models/userSchema')

const cloudinary = require('cloudinary').v2
app.use('/uploads',express.static('uploads'))



// app.use((req, res, next) => {
//     res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
//     next();
//   });
  

app.use(express.static('public', {
    setHeaders: (res, path, stat) => {
        res.set('X-Content-Type-Options', 'nosniff');
    }
}));

app.use(session({
        secret: process.env.SESSION_SECRET,
        resave:false,
        saveUninitialized:true,
}))
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-cache");
    next();
  });
  
app.use(passport.initialize());
app.use(passport.session());

//const expressLayouts=require('express-ejs-layouts')
const userRoute = require('./routes/user')
const adminRoute=require('./routes/admin');
const authRoutes = require('./routes/auth')
const connectDb = require('./mongoDb/connectDb');
app.use(bodyParser.json())
app.use(express.json({limit:"50MB"}))
app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs')
app.use(express.static(path.join(__dirname,'public')))
app.use(express.urlencoded({extended:true,limit: "50MB"}))
//app.use(expressLayouts)
//app.set('layout','layouts/main')

// mongoose.connect(process.env.MONGO_URI)
//     .then((val)=>console.log('MongoDB Connected'))
//     .catch((err)=>{console.log(`MongoDb connection Err : ${err}`)})

app.use('/',userRoute)
app.use('/admin',adminRoute)

connectDb()
app.listen(process.env.PORT,()=>console.log(`server on ${process.env.PORT}`))