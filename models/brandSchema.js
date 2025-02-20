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
    createdAt:{
        type:Date,
        default:Date.now
    }
})

module.exports=mongoose.model("Brand",brandsSchema)