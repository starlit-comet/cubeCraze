const userSchema = require('../models/userSchema')
const categorySchema = require('../models/categorySchema')
const productSchema = require('../models/productSchema')
const brandSchema = require('../models/brandSchema')
const sizeSchema = require('../models/sizeSchema')

const localsData = async (req,res,next)=>{
    const userId = req.session._id
    const user = await userSchema.findById(userId)
    if(!user){
        res.locals.cart = {}

        next()
    }
    
}


module.exports = localsData