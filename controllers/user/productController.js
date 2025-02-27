const productSchema = require("../../models/productSchema")
const sizeSchema = require('../../models/sizeSchema')
const brandSchema = require('../../models/brandSchema')
const categorySchema = require('../../models/categorySchema')
const viewProduct = async (req,res)=>{
   //const productId = '67c0cb99a2f30570cddcd306'
   const productId = req.params.productId
     const allCategories = await categorySchema.find({isListed:true})

     const productData = await productSchema.findById(productId).populate([
        { path: 'brand' },
        { path: 'category' },
        { path: 'size' },
     ])
     //console.log(productData)
    res.render('users/viewProduct',{productData,allCategories})
}


module.exports={viewProduct}