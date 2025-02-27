const mongoose = require('mongoose');
const type = require('mongoose/lib/schema/operators/type');

const {Schema}= mongoose;

const userSchema = new mongoose.Schema ({
    
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    phone:{
        type:String,
        required:false,
        unique:false,
        sparse:true,
        default:null,
    },
    googleId:{
        type:String,
        required:true,
        unique:false,
        default:'noGoogleId'
       // sparse:true,

    },
    hashedPassword:{
        type:String,
        required:false,
        default:null,
    },
    isBlocked:{
        type:Boolean,
        default:false,
    },
    // isAdmin:{
    //     type:boolean,
    //     default:false
    // },
    cart:[{
        type:Schema.Types.ObjectId,
        ref:'Cart'
    }],
    wallet:[{
        type:Schema.Types.ObjectId,
        ref:'Wishlist'

    }],
    orderHistory:[{
        type:Schema.Types.ObjectId,
        ref:'Order'
    }],
    createdOn:{
        type:Date,
        default:Date.now,
    },
    referalCode:{
        type:String,

    },
    isOTPVerified:{
        type:Boolean,
        required:true,
        default:false
    },
    otp:{
        type:String,
        default:'',
    },
    otpExpires:{
        type:Date,
        required:true,
        default:Date.now,

    },
  
    avatar: { type: String },


})

module.exports = mongoose.model('user',userSchema)