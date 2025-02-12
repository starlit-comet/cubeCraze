const loadHome = async(req,res)=>{
    try {
        res.render('users/userhome')
    } catch (error) {
        console.log(error)
       // res.status(500).send('PageNotFound')
        res.status(500).redirect('/pagenotfound')

    }
}
const userLogin =async (req,res)=>{
    try {
        res.render('users/login')
    } catch (error) {
        console.log(error)
        res.status(500).redirect('/pagenotfound')
    }
}
const errorPage = async (req,res)=>{
    try {
        res.render('users/pagenotfound')
    } catch (error) {
        console.log(error)
    }
}

const signUp = async (req,res)=>{
    try {
        res.render('users/signUp')
    } catch (error) {
        console.log(error)
    }
}

module.exports={loadHome,userLogin,errorPage,signUp}