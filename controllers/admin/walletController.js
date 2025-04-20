const adminWalletSchema = require('../../models/adminWalletSchema')
const userSchema = require('../../models/userSchema')
const responseCodes= require('../../helpers/StatusCodes')

const viewWallet = async (req,res)=>{
    try{
    const wallet = await adminWalletSchema.findOne({}).populate({
        path:'transactions.user',
        select:'name email phone _id'
    })

    res.render('admin/wallet',{wallet})
} catch(error){
    console.log('error rendering admin wallet',error,)
}}
module.exports= {viewWallet} 