const mongoose = require('mongoose')
require('dotenv').config()

const connectDb = async()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI,{})
        console.log('MongoDB Connected')
    } catch (error) {
        console.log(error)
        process.exit(1)
        
    }
}

module.exports= connectDb