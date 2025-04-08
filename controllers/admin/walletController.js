const adminWalletSchema = require('../../models/adminWalletSchema')
const userSchema = require('../../models/userSchema')
const viewWallet = async (req,res)=>{
    try{
    const wallet = await adminWalletSchema.findOne({}).populate({
        path:'transactions.user',
        select:'name email phone _id'
    })

    res.render('admin/wallet',{wallet})
  //  console.log(wallet,wallet.transactions)
} catch(error){
    console.log('error rendering admin wallet',error,)
}}
module.exports= {viewWallet} 