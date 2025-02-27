
const isAdminLoggedin =(req,res,next)=>{
    if(req.session.admin){
        console.log(`got tru session redirecting to home`)
        res.redirect('/admin/dashboard')
    }
    else next()
}

const isAdminLoggedOut=(req,res,next)=>{
    if(!req.session.admin){
        res.redirect('/admin/login')
    }
    else next()
}





module.exports={isAdminLoggedin,isAdminLoggedOut}