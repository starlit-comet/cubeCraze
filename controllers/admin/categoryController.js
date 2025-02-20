const categorySchema = require('../../models/categorySchema')


const loadCategories = async (req,res)=>{  
    const categoriesData = await categorySchema.find({})
    res.render('admin/categories',{categoriesData})
        
}
 const addCategory = async (req,res)=>{
    try {
    const {categoryName,description} = req.body
    const category = await new categorySchema({categoryName,description})
    category.save()
    res.redirect('/admin/categories')}
    catch(error){
        console.log(error)
    }
 }

 const editCategory= async (req,res)=>{
    try {
        
    } catch (error) {
        
    }
 }


module.exports={loadCategories,addCategory,editCategory}