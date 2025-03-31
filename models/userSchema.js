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
    cart: [{  
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, // ✅ Stores Product ID
        quantity: { type: Number, required: true, default: 1 } // ✅ Stores quantity
    }],
    wallet:[{
        type:Schema.Types.ObjectId,
        ref:'wallet'

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
        unique:true

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
        // default:Date.now,
        // type:Date,
        // required:true,
    },
    // deleteIfNotVerified:{
    //     type:Date,
    //     default: ()=> new Date(Date.now()),
    //     index:{ expires:120} 
    // },
    wishList:[{
        type: Schema.Types.ObjectId,
        ref:'Product',
        default:[],
    } ],
  
    avatar: { type: String },
    addresses:[{
        type:Schema.Types.ObjectId,
        ref:'Address'
    }],
   coupon:[{
    type:Schema.Types.ObjectId,
    ref:'Coupon'
   }],


})

// ✅ Setting default empty array for cart
userSchema.path('cart').default([]);
//userSchema.path('Address').default([])
module.exports = mongoose.model('user',userSchema)