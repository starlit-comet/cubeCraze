const mongoose=require('mongoose')
const {Schema}= mongoose

const brandsSchema= new Schema({
    brandName:{
        type:String,
        required:true,
        unique:true

    },
    brandImage:{
        type:String,
        required:true
    },
    brandDescription:{
        type:String,
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    brandOffer:{
        type:Number,
        default:0,
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})

module.exports=mongoose.model("Brand",brandsSchema)