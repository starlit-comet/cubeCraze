const express=require('express')
const session=require('express-session')

const isUserLoggedin =(req,res,next)=>{
    if(req.session.user){
        console.log(`got tru session redirecting to home`)
        res.redirect('/home')
    }
    else next()
}

const isUserLoggedOut=(req,res,next)=>{
    if(!req.session.user){
        res.redirect('/login')
    }
    else next()
}





module.exports={isUserLoggedin,isUserLoggedOut}