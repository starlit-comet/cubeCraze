const sizeSchema = require('../../models/sizeSchema')

const viewCubeSizes = async (req,res)=>{
    const sizeData = await sizeSchema.find({})

    res.render('admin/cubeSizes',{sizeData})
}

const addSize = async (req,res)=>{

    try {
        const {description,cubeSize} =req.body
        const isSize = await sizeSchema.find({size:cubeSize})
        if(!isSize){
            return res.status(201).json({message:"Size Already Exists",isconfirmed:false})
        }
        const newSize = new sizeSchema({description,size:cubeSize})
        newSize.save()
        console.log(`New Size Added`)
        res.redirect('/admin/prodiuctSizes')
    } catch (error) {
        
    }
}

module.exports={viewCubeSizes,addSize}