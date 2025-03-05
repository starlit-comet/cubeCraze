const categorySchema = require('../../models/categorySchema')


const loadCategories = async (req,res)=>{  
    const categoriesData = await categorySchema.find({})
    res.render('admin/categories',{categoriesData})
        
}
 const addCategory = async (req,res)=>{
    try {
    const {categoryName,description} = req.body
    if(!categoryName || !description) return res.status(200).json({message:'Both fields are required'})
    const isCategoryAlreadyExist = await categorySchema.findOne({categoryName})
    console.log(isCategoryAlreadyExist,'ds')
    if(isCategoryAlreadyExist) {
        return res.status(200).json({message:'Category Already Exists'})
    }
    const category = await new categorySchema({categoryName,description})
    category.save()
       return res.status(200).json({success:true,message:'New Category Created'})
}
    catch(error){
        console.log(error)
    }
 }

 const editCategory= async (req,res)=>{
    const { categoryName, description, isListed,id } = req.body;
    try {
        const updatedCategory=await categorySchema.findByIdAndUpdate(id, { 
            categoryName, 
            description, 
            isListed 
        }, {new:true});

        if (!updatedCategory) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
            console.log(`Category Updated : ${updatedCategory.categoryName}`)
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error });
    }
 }


module.exports={loadCategories,addCategory,editCategory}