// const express=require('express')
// const session=require('express-session')



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
        req.session._id='67c810f8c0b9a2f078c05b61'
        next()
        // -----------

   //   res.redirect('/login')
    }
    else next()
}





module.exports={isUserLoggedin,isUserLoggedOut}