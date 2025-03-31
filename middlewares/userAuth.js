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
    //     req.session._id='67e7e5e8be981778f5096161'
    //    next()
       // res.locals.user = findUser('67c810f8c0b9a2f078c05b61')
        // -----------
      res.redirect('/login')
    }
    else next()
}





module.exports={isUserLoggedin,isUserLoggedOut}