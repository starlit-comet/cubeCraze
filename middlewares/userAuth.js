// const express=require('express')
// const session=require('express-session')
const UserSchema = require('../models/userSchema')


const isUserLoggedin =(req,res,next)=>{
    if(req.session._id){
        console.log(`got tru session redirecting to home`)
        res.redirect('/home')
    }
    else next()
}

const isUserLoggedOut=async (req,res,next)=>{

    try{
        if(!req.session._id){
            req.session._id= '67e7e5e8be981778f5096161'
            next()
         // return  res.redirect('/login')
        }
        else {
        const user = await UserSchema.findOne({_id:req.session._id})
        if(user.isBlocked) {
            req.session._id=null
            return res.redirect('/login')
        }
        next()
    }}
    catch(err){
        console.log('error in MW:',err)
        req.sessoion._id=null
        res.redirect('/home')
    }
}






module.exports={isUserLoggedin,isUserLoggedOut}