const express=require('express')
const session=require('express-session')



const isUserLoggedin =(req,res,next)=>{
    if(req.session._id){
        console.log(`got tru session redirecting to home`)
        res.redirect('/home')
    }
    else next()
}

const isUserLoggedOut=(req,res,next)=>{
    if(!req.session._id){

        // For testing
        // req.session._id='67c7d0b3f12d98a81be2a36b'
        // next()
 //

        res.redirect('/login')
    }
    else next()
}





module.exports={isUserLoggedin,isUserLoggedOut}