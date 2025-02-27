const userSchema = require('../../models/userSchema')
const viewProfilePage=async (req,res)=>{
    //const profileId = '67bfee131e53f21e84a34109'
    const profileId = req.session._id
    const userData = await userSchema.findOne({_id:profileId})
    const googleUserData = req.session.user
    console.log(userData,googleUserData)
   // console.log('user',userData)
    return res.render('users/profile',{userData})
}

module.exports={
    viewProfilePage
}