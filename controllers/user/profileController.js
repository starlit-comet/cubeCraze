const userSchema = require('../../models/userSchema')
const orderSchema = require('../../models/orderSchema')
const viewProfilePage=async (req,res)=>{
   // const profileId = '67c7d0b3f12d98a81be2a36b'
try{
     let search = req.query.search ?? "";

    const userId = req.session._id
    const userData = await userSchema.findOne({_id:userId,isBlocked:false}).populate('addresses')
    if(!userData) return res.status(404).json({message:'User Not Found'})
        const orders = await orderSchema.find({userId}).sort({invoiceDate:'desc'})
   // console.log(userData)
    console.log(`userLoggedIn: ${userData.name}`)
   // console.log('user',userData)
   console.log(orders)
    return res.render('users/profile',{userData,searchKeyWord:search,
        minPrice:0,maxPrice:7500, orders
    })
}
catch(error){

}
}

module.exports={
    viewProfilePage
}