const userSchema = require('../../models/userSchema')
const viewProfilePage=async (req,res)=>{
   // const profileId = '67c7d0b3f12d98a81be2a36b'

     let search = req.query.search ?? "";

    const profileId = req.session._id
    const userData = await userSchema.findOne({_id:profileId}).populate('addresses')
    
   // console.log(userData)
    console.log(`userLoggedIn: ${userData.name}`)
   // console.log('user',userData)
    return res.render('users/profile',{userData,searchKeyWord:search,
        minPrice:0,maxPrice:7500,
    })
}

module.exports={
    viewProfilePage
}