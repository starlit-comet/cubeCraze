const sizeSchema = require('../../models/sizeSchema')
const MESSAGES = require('../../utils/responseMessages')
const RESPONSE_CODES = require('../../utils/StatusCodes')


const viewCubeSizes = async (req,res)=>{
    let currentPage ,totalPages,totalItems,limit = 5
    currentPage = parseInt(req.query.page,10) || 1
    if(currentPage < 1 ) currentPage =1
    let allItems = await sizeSchema.find()
    totalItems = allItems.length
    totalPages = Math.ceil(totalItems/limit)

    const sizeData = await sizeSchema.find({}).skip((currentPage-1)*limit).limit(limit)
    res.render('admin/cubeSizes',{sizeData,currentPage ,totalPages,totalItems,limit})
}

const addSize = async (req,res)=>{

    try {
        const {description,cubeSize} =req.body
        const isSize = await sizeSchema.find({size:cubeSize})
        if(!isSize){
            return res.status(RESPONSE_CODES.CREATED).json({message: MESSAGES.SIZE_ALREADY_EXISTS ,isconfirmed:false})
        }
        const newSize = new sizeSchema({description,size:cubeSize})
        newSize.save()
        console.log(`New Size Added`)
        res.status(RESPONSE_CODES.PERMANENT_REDIRECT).redirect('/admin/prodiuctSizes')
    } catch (error) {
        console.log(error)
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).redirect('/admin/internal-server-error')
    }
}

module.exports={viewCubeSizes,addSize}