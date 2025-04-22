const { query } = require('express')
const User = require('../../models/userSchema')
const RESPONSE_CODES = require('../../utils/StatusCodes')
const MESSAGES = require('../../utils/responseMessages')

const viewCustomers = async (req,res)=>{
    try {
        let search=req.query.search??''
        
        let page= req.query.page??1

        if(req.query.page){
            page=req.query.page
        }
        let limit =5

        const userData = await User.find({
            $or:[
                {name :{$regex:".*"+search+".*"}},
                {email :{$regex:'.*'+search+".*"}}
            ]
        }).limit(limit*1)
        .skip((page-1)*limit)
        .exec()

        const count = await User.find({
            $or:[
                {name :{$regex:".*"+search+".*"}},
                {email :{$regex:'.*'+search+".*"}}
            ]
        }).countDocuments()
        let link = ``
        res.status(RESPONSE_CODES.OK).render('admin/customers',{userData,count,limit,page,link})
    } catch (error) {
        console.log(error)
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).redirect('/admin/internal-server-error')
        
    }
}
const unblockCustomer= async(req,res)=>{
    try {
        let id = req.query.id
        await User.updateOne({_id:id},{$set:{isBlocked:false}})
        res.redirect('/admin/customers')
    } catch (error) {
        console.log(error)
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({message:MESSAGES.INTERNAL_SERVER_ERROR})

    }
}

const blockCustomer = async(req,res)=>{
    try {
        let id = req.query.id
        await User.updateOne({_id:id},{$set:{isBlocked:true}})
        res.redirect('/admin/customers')
    } catch (error) {
        console.log(error)
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({message:MESSAGES.INTERNAL_SERVER_ERROR})

    }
}


const searchCustomer = async (req,res)=>{
const {searchValue} = req.body
if(!searchValue) return res.status(RESPONSE_CODES.BAD_REQUEST).json({message:MESSAGES.ENTER_A_SEARCH_VALUE})

    try {
        const regex = new RegExp(searchValue,'i')
        
    } catch (error) {
        console.log(error)
        res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({message:MESSAGES.INTERNAL_SERVER_ERROR})
    }
}

module.exports={viewCustomers,unblockCustomer,blockCustomer, searchCustomer}