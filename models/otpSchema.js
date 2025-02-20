const mongoose=require('mongoose')

const {Schema}=mongoose

const otpSchema = new mongoose.Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:'user',
        req:'true',
        immutable:true
    },
    OTPValue:{
        type:String,
        default:null,
        required:true,
        immutable:true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires:120,
        immutable:true,
    },
     
})

module.exports=mongoose.model('OtpData',otpSchema)