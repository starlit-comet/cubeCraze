const mongoose = require('mongoose');

const {Schema}= mongoose;

const productSchema = new mongoose.Schema ({
    product_name:{
        type:String,
        required:true
    },
    description:{
        type:String,
    },
    size:{
        type:String,
    },
    price:{
        type:Integer,
        
    }
})

module.exports=mongoose.model('product',productSchema)