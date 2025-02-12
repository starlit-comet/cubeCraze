const loadHome = async(req,res)=>{
    try {
        res.render('users/userhome')
    } catch (error) {
        console.log(error)
        res.status(500).send('PageNotFound')
    }
}

module.exports={loadHome}