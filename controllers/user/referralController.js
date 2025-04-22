const userSchema = require('../../models/userSchema')
const referalGenerator = require('../../helpers/generateUniquesVal')
const nodeMailer = require('../../helpers/nodemailer')
const RESPONSE_CODES = require('../../utils/StatusCodes')
const MESSAGES = require('../../utils/responseMessages')

const sentEmail = async(req,res)=>{
const {referEmail} = req.body
const userId = req.session._id
console.log(userId,'checking fir id')
    try{
    let user = await userSchema.findById(userId)
    if(!user && user?.isBlocked==false && user.isOTPVerified==true) return res.status(RESPONSE_CODES.NOT_FOUND).json({message:'User Not Found'})
    
    if(!user.referalCode){ //create a new refffeeral code if the user didn't have one
       const newReferalCode = await referalGenerator.generateUniqueCode()
       user.referalCode=newReferalCode
       await user.save()
       console.log(`new referal code generated, ${user.referalCode}`)
    }
    const isUserAlreadyExists = await userSchema.findOne({email:referEmail,isOTPVerified:true})
    if(isUserAlreadyExists) return res.status(RESPONSE_CODES.BAD_REQUEST).json({message:MESSAGES.USER_ALREADY_EXISTS})
    const mailOptions = nodeMailer.referalMail(user,referEmail)
    await nodeMailer.transporter.sendMail(mailOptions)
    return res.status(RESPONSE_CODES.OK).json({ok:true})

} catch(error){
    console.log(error)
    return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({message:error})
}
}

module.exports={sentEmail}