const userSchema = require('../../models/userSchema')
const referalGenerator = require('../../helpers/generateUniquesVal')
const nodeMailer = require('../../helpers/nodemailer')
const responseCodes = require('../../helpers/StatusCodes')

const sentEmail = async(req,res)=>{
const {referEmail} = req.body
const userId = req.session._id
console.log(userId,'checking fir id')
    try{
    let user = await userSchema.findById(userId)
    if(!user && user?.isBlocked==false && user.isOTPVerified==true) return res.status(responseCodes.NOT_FOUND).json({message:'User Not Found'})
    
    if(!user.referalCode){ //create a new refffeeral code if the user didn't have one
       const newReferalCode = await referalGenerator.generateUniqueCode()
       user.referalCode=newReferalCode
       await user.save()
       console.log(`new referal code generated, ${user.referalCode}`)
    }
    const isUserAlreadyExists = await userSchema.findOne({email:referEmail,isOTPVerified:true})
    if(isUserAlreadyExists) return res.status(responseCodes.BAD_REQUEST).json({message:'User Already Exists'})
    const mailOptions = nodeMailer.referalMail(user,referEmail)
    await nodeMailer.transporter.sendMail(mailOptions)
    console.log('referal email sent')
    return res.status(responseCodes.OK).json({ok:true})

} catch(error){
    console.log(error)
    return res.status(responseCodes.INTERNAL_SERVER_ERROR).json({message:error})
}
}

module.exports={sentEmail}