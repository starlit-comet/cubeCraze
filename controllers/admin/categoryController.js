const categorySchema = require('../../models/categorySchema')
const responseCodes = require('../../helpers/StatusCodes')


const loadCategories = async (req,res)=>{  
    const categoriesData = await categorySchema.find({})
    res.render('admin/categories',{categoriesData})
        
}
 const addCategory = async (req,res)=>{
    try {
    const {categoryName,description,offer} = req.body
    if(!categoryName || !description ) return res.status(responseCodes.BAD_REQUEST).json({message:'All fields are required'})
    const isCategoryAlreadyExist = await categorySchema.findOne({categoryName})
    const allCategoryNames =  (await categorySchema.find().select('categoryName -_id')).map(val=>val.categoryName.split(' ').join('').toLocaleLowerCase())
    if (allCategoryNames.some(val=>val=== categoryName.toLowerCase().split(' ').join(''))) return res.status(responseCodes.BAD_REQUEST).json({message:'Category Already Exists'})
    const category =  new categorySchema({categoryName,description,categoryOffer:offer})
    category.save()
       return res.status(responseCodes.OK).json({success:true,message:'New Category Created'})
    }
    catch(error){
        console.log(error)
    }
  }

 const editCategory= async (req,res)=>{
    const { categoryName, description, isListed,id ,offer} = req.body;
    try {
        const updatedCategory=await categorySchema.findByIdAndUpdate(id, { 
            categoryName, 
            description, 
            isListed ,categoryOffer:offer,
        }, {new:true});

        if (!updatedCategory) {
            return res.status(responseCodes.NOT_FOUND).json({ success: false, message: "Category not found" });
        }
            console.log(`Category Updated : ${updatedCategory.categoryName}`)
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error });
    }
 }


module.exports={loadCategories,addCategory,editCategory}