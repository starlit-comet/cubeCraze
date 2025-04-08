const UserSchema = require('../models/userSchema')
const couponSchema = require('../models/referalCouponSchema');

const generateUniqueCode = async  () =>{
    try{
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;

    do {
        code = Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    } while (await UserSchema.exists({ referalCode: code })
         || await couponSchema.exists({code})
    );
    console.log('new Unique code creaded',code)
    return code;
}catch(err){
    console.log('error creating unique string',err)
}
}


 module.exports = {generateUniqueCode}
