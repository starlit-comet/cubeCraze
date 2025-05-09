const userSchema = require('../../models/userSchema')
const orderSchema = require('../../models/orderSchema')
const Wallet = require('../../models/walletSchema')
const RESPONSE_CODES = require('../../utils/StatusCodes')
const MESSAGES = require('../../utils/responseMessages')

const viewProfilePage=async (req,res)=>{
try{
     let search = req.query.search ?? "";
    let searchOrder = req.query.search_order ?? ''
    const userId = req.session._id
    const userData = await userSchema.findOne({_id:userId,isBlocked:false}).populate('addresses')
    if(!userData) return res.redirect()
        let orders = await orderSchema.find({userId}).sort({invoiceDate:'desc'})
    if(searchOrder){
        orders = orders.filter(item=>{
            return(
                item.orderId.toLowerCase().includes(searchOrder) 
            )
        })
    }
    let userWallet = await Wallet.findOne({userId})
    if(!userWallet) {
       userWallet =  new Wallet({
        userId,transactions:[],
       })
       
       userData.wallet=userWallet._id
       await userWallet.save()
       await userData.save()
    }
      
    return res.status(RESPONSE_CODES.OK).render('users/profile',{userData,userWallet,searchKeyWord:search,
        minPrice:0,maxPrice:7500, orders
    })
}
catch(error){
    console.log(error)
    return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({message: MESSAGES.INTERNAL_SERVER_ERROR })
}
}

module.exports={
    viewProfilePage
}