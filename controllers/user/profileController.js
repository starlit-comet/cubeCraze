const userSchema = require('../../models/userSchema')
const orderSchema = require('../../models/orderSchema')
const Wallet = require('../../models/walletSchema')
const viewProfilePage=async (req,res)=>{
   // const profileId = '67c7d0b3f12d98a81be2a36b'
try{
     let search = req.query.search ?? "";
    let searchOrder = req.query.search_order ?? ''
    //console.log(searchOrder,'gerwar')
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
    let userWallet=[]
    userWallet = await Wallet.findOne({userId})
    
   // console.log(userData)
    console.log(`userLoggedIn: ${userData.name}`)
   // console.log('user',userData)
  // console.log(orders)
    return res.render('users/profile',{userData,userWallet,searchKeyWord:search,
        minPrice:0,maxPrice:7500, orders
    })
}
catch(error){
    console.log(error)
}
}

module.exports={
    viewProfilePage
}