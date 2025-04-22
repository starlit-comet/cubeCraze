const categorySchema = require('../../models/categorySchema')
const RESPONSE_CODES = require('../../utils/StatusCodes')
const MESSAGES = require('../../utils/responseMessages')

const loadCategories = async (req,res)=>{  
    try{
    let totalItems, currentPage,totalPages,limit=5
    currentPage = parseInt(req.query.page,10) ||1
    if(currentPage<1) currentPage =1
    let allItems = await categorySchema.find({})
    totalItems = allItems.length
    totalPages = Math.ceil(totalItems/limit)
    const categoriesData = await categorySchema.find({})
    .skip((currentPage-1)*limit).limit(limit)
    res.render('admin/categories',{categoriesData,totalItems, currentPage,totalPages,limit})
        
}catch(err){
    console.log(err)
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).redirect
}}
 const addCategory = async (req,res)=>{
    try {
    const {categoryName,description,offer} = req.body
    if(!categoryName || !description ) return res.status(RESPONSE_CODES.BAD_REQUEST).json({message:MESSAGES.ALL_FIELDS_ARE_REQUIRED})
    const isCategoryAlreadyExist = await categorySchema.findOne({categoryName})
    const allCategoryNames =  (await categorySchema.find().select('categoryName -_id')).map(val=>val.categoryName.split(' ').join('').toLocaleLowerCase())
    if (allCategoryNames.some(val=>val=== categoryName.toLowerCase().split(' ').join(''))) return res.status(RESPONSE_CODES.BAD_REQUEST).json({message:MESSAGES.CATEGORY_ALREADY_EXISTS })
    const category =  new categorySchema({categoryName,description,categoryOffer:offer})
    category.save()
       return res.status(RESPONSE_CODES.OK).json({success:true,message:'New Category Created'})
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
            return res.status(RESPONSE_CODES.NOT_FOUND).json({ success: false, message:MESSAGES.CATEGORY_NOT_FOUND  });
        }
            console.log(`Category Updated : ${updatedCategory.categoryName}`)
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error });
    }
 }


module.exports={loadCategories,addCategory,editCategory}