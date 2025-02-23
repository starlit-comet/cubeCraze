const mongoose=require('mongoose')
const {Schema}= mongoose

const sizeSchema= new Schema({
    size:{
        type:String,
        required:true,
        unique:true

    },
    
    description:{
        type:String,
    },
    // isBlocked:{
    //     type:Boolean,
    //     default:false
    // },
    createdAt:{
        type:Date,
        default:Date.now
    }
})

module.exports=mongoose.model("size",sizeSchema)