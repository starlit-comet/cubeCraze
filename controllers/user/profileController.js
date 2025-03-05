const userSchema = require('../../models/userSchema')
const viewProfilePage=async (req,res)=>{
   // const profileId = '67c7d0b3f12d98a81be2a36b'
    const profileId = req.session._id
    const userData = await userSchema.findOne({_id:profileId})
    console.log(`userLoggedIn: ${userData.name}`)
   // console.log('user',userData)
    return res.render('users/profile',{userData})
}

module.exports={
    viewProfilePage
}