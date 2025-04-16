const userSchema = require('../../models/userSchema')
const referalGenerator = require('../../helpers/generateUniquesVal')
const nodeMailer = require('../../helpers/nodemailer')
const sentEmail = async(req,res)=>{
const {referEmail} = req.body
const userId = req.session._id
console.log(userId,'checking fir id')
    try{
    let user = await userSchema.findById(userId)
    if(!user && user?.isBlocked==false && user.isOTPVerified==true) return res.status(404).json({message:'User Not Found'})
    
    if(!user.referalCode){ //create a new refffeeral code if the user didn't have one
       const newReferalCode = await referalGenerator.generateUniqueCode()
       user.referalCode=newReferalCode
       await user.save()
       console.log(`new referal code generated, ${user.referalCode}`)
    }
    const isUserAlreadyExists = await userSchema.findOne({email:referEmail,isOTPVerified:true})
    if(isUserAlreadyExists) return res.status(400).json({message:'User Already Exists'})
    const mailOptions = nodeMailer.referalMail(user,referEmail)
    await nodeMailer.transporter.sendMail(mailOptions)
    console.log('referal email sent')
    return res.status(200).json({ok:true})

} catch(error){
    console.log(error)
    return res.status(500).json({message:error})
}
}

module.exports={sentEmail}