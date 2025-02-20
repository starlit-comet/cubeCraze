const path=require('path')
const adminModel = require('../../models/adminModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const loadLogin = async (req,res) => {
    try {
        res.render('admin/login')
    } catch (error) {
        
    }
}

const formValidate = async(req,res)=>{
    try {
        const {email,password}=req.body
        const admin = await adminModel.findOne({email})
        if(!admin) return res.render('admin/login')
        const isMatchPassword = await bcrypt.compare(password,admin.password)
        if(!isMatchPassword) return res.render('admin/login')  
        req.session.admin=true 
        res.redirect('/admin/dashboard')
    } catch (error) {
        console.log(error)
    }
}

const loadDashboard = async(req,res)=>{
    try {
    
        res.render('admin/dashboard')
    } catch (error) {
        
        console.log(error)
    }
}

const forgetPassword=async (req,res)=>{
// res.render('admin/forgetPassword')
const {email} = req.body

}

const sentOtp = async (req,res)=>{
    try {
        console.log(req.body)
        const {email}=req.body
        const admin = await adminModel.findOne({email})
        if(!admin) res.json({message:'Admin Data not Found'})
    } catch (error) {
        console.log(error)
    }
}

const loadProducts=(req,res)=>{
    res.render('admin/products')
}
const logout = (req,res)=>{
    req.session.destroy()
    res.redirect('/admin/login')
}



const addProduct = (req,res)=>{
    res.render('admin/addProduct')
}




module.exports={loadLogin,logout,formValidate,loadDashboard,forgetPassword,sentOtp,

    loadProducts,addProduct,
    
}