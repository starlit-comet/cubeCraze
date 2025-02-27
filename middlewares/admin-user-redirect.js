const isAdminSession = (req,res,next)=>{
    if (req.session.admin ){
        res.redirect('/admin/dashboard')
    }
    else{
        next()
    }
}

const isUserSession = (req,res,next)=>{
    if(req.session.user){
        res.redirect('/profile')
    }
    else{
        next()
    }
}

module.exports={isAdminSession,isUserSession}