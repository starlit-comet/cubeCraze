const { query } = require('express')
const User = require('../../models/userSchema')

// const viewCustomers=(req,res)=>{
//     res.render('admin/customers')
// }

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
        res.render('admin/customers',{userData,count,limit,page,link})
    } catch (error) {
        console.log(error)
        
    }
}
const unblockCustomer= async(req,res)=>{
    try {
        let id = req.query.id
        await User.updateOne({_id:id},{$set:{isBlocked:false}})
        res.redirect('/admin/customers')
    } catch (error) {
        console.log(error)
    }
}

const blockCustomer = async(req,res)=>{
    try {
        let id = req.query.id
        await User.updateOne({_id:id},{$set:{isBlocked:true}})
        res.redirect('/admin/customers')
    } catch (error) {
        console.log(error)
    }
}


const searchCustomer = async (req,res)=>{
const {searchValue} = req.body
if(!searchValue) return res.status(400).json({message:'Enter a Search Value'})

    try {
        const regex = new RegExp(searchValue,'i')
        
    } catch (error) {
        
    }
}

module.exports={viewCustomers,unblockCustomer,blockCustomer, searchCustomer}