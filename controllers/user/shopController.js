const productSchema = require("../../models/productSchema")
const sizeSchema = require('../../models/sizeSchema')
const brandSchema = require('../../models/brandSchema')
const categorySchema = require('../../models/categorySchema')

const viewShop = async(req,res)=>{
    const allCategories = await categorySchema.find({isListed:true})
    const allBrands = await brandSchema.find({isBlocked:false})
    const allProducts = await productSchema.find({isBlocked:false}).populate([ 
        { path: 'brand' },
        { path: 'category' },
        { path: 'size' },])
        console.log(allProducts)
    res.render('users/shop',{allProducts,allBrands,allCategories})
}
module.exports={viewShop}