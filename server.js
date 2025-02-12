require('dotenv').config();
const express= require('express')
const app=express()
const path = require('path')
const mongoose = require('mongoose')
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bodyParser = require('body-parser')
const toastr = require('toastr')

const cors = require('cors')

app.use(express.static('public', {
    setHeaders: (res, path, stat) => {
        res.set('X-Content-Type-Options', 'nosniff');
    }
}));

//const expressLayouts=require('express-ejs-layouts')
const userRoute = require('./routes/user')
const adminRoute=require('./routes/admin');
const connectDb = require('./mongoDb/connectDb');
app.use(bodyParser.json())
app.use(express.json())
app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs')
app.use(express.static(path.join(__dirname,'public')))
app.use(express.urlencoded({extended:true}))
//app.use(expressLayouts)
// app.set('layout','layouts/main')

// mongoose.connect(process.env.MONGO_URI)
//     .then((val)=>console.log('MongoDB Connected'))
//     .catch((err)=>{console.log(`MongoDb connection Err : ${err}`)})

app.use('/',userRoute)
app.use('/admin',adminRoute)

connectDb()
app.listen(process.env.PORT,()=>console.log(`server on ${process.env.PORT}`))