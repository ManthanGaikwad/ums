require('dotenv').config()
const User = require('../models/usermodel');
const bcrypt = require('bcrypt');
const nodeMailer = require('nodemailer');
const SMTPPool = require('nodemailer/lib/smtp-pool');
const session = require('express-session');

const randomstring = require('randomstring');
//const { myEmail, myPass } = require('../config/config');
//const express = require('express');


//password secure

const securePassword = async(password)=>{
    try {
        
     const passwordHash= await   bcrypt.hash(password, 10);
     return passwordHash;

    } catch (error) {
        console.log(error.message);
    }
}

const loadRegister = async(req,res)=>{
    try {
       
        res.render('registration')
        
    } catch (error) {
        console.log(error);
    }
}

//email send

const sendVerifyMail = async(name,email,user_id)=>{
    try {
        
      const transport =   nodeMailer.createTransport({
            host:'smtp.server.com',
            port:2525,
            secure:false,
            service:'gmail',
            //requireTLS:true,            
            auth:{
                user:process.env.MY_EMAIL,
                pass:process.env.MY_PASSWORD
            }
        })

        const mailOption = {
            from:process.env.MY_EMAIL,
            to:email,
            subject:'verification mail',
            html:'<P> Hi '+ name +' , please click here <a href="http://localhost:1900/verify?id='+ user_id+'">verify</a> your mail </p>'
        }
        transport.sendMail(mailOption, function(error,info){
            if (error) {
                console.log(error);
            } else {
                console.log('email send :' , info.response);
            }
        })

    } catch (error) {
        console.log(error.message);
    }
}

//for send mail forgot

const sendForgotMail = async(name,email,token)=>{
    try {
        
      const transport =   nodeMailer.createTransport({
            host:'smtp.server.com',
            port:2525,
            secure:false,
            service:'gmail',
            //requireTLS:true,            
            auth:{
                user:process.env.MY_EMAIL,
                pass:process.env.MY_PASSWORD
            }
        })

        const mailOption = {
            from:process.env.MY_EMAIL,
            to:email,
            subject:'Reset password',
            html:'<P> Hi '+ name +' , please click here to <a href="http://localhost:1900/forgot-password?token='+ token +'"> Reset </a> your password </p>'
        }
        transport.sendMail(mailOption, function(error,info){
            if (error) {
                console.log(error);
            } else {
                console.log('email send :' , info.response);
            }
        })

    } catch (error) {
        console.log(error.message);
    }
}

//registration

const insertUser =async(req,res)=>{
    try {

        const sPassword = await securePassword(req.body.password);
       
        const user = new User({
            name:req.body.name,
            email:req.body.email,
            mobile:req.body.mno,
            image:req.file.filename,
            password:sPassword,
            is_admin:0
        });

        //return promise
        const userData = await user.save();
        if (userData) {

            sendVerifyMail(req.body.name, req.body.email, userData._id)

            res.render('login',{message:' sign in successfully please verify your email'})
        } else {
            res.render('registration',{message:'registration failed'})
 
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

//verification email

const verifyMail = async (req,res)=>{
    try {
        
      const updateInfo = await User.updateOne({_id:req.query.id},{$set:{is_verified:1}});

      console.log(updateInfo);
      res.render('email-verified')

    } catch (error) {
        console.log(error.message);
    }
}

//login user method
const loginLoad = async (req,res)=>{
    try {
        
        res.render('login')


    } catch (error) {
        console.log(error.message);
    }
}

//verify login user

const verifyloginSystem = async(req,res)=>{
    try {
        const email = req.body.email;
        const password=req.body.password;
        const userData = await User.findOne({email:email})

        if (userData) {
            
            const passwordMatch = await bcrypt.compare(password,userData.password);

            if (passwordMatch) {
               if(userData.is_verified === 0){
                res.render('login',{message:'Please verify your mail'})
               }
               else{
                req.session.user_id=userData._id
                res.redirect('home')
               }
            } else {
                res.render('login',{message:'Email and password incorrect'});

            }

        } else {
            res.render('login',{message:'Email and Password incorrect'})
        }

    } catch (error) {
       console.log(error.message); 
    }
}

//loading home
const loadHome = async(req,res)=>{
    try {
        
       const userData = await User.findById({_id:req.session.user_id})
        res.render('home',{user:userData})

    } catch (error) {
        console.log(error.message);
    }
}

//forgot password

const forgotLoad = async (req,res)=>{
    try {
        
        res.render('forgot')

    } catch (error) {
        console.log(error.message);
    }
}

//send forgot verify email
const forgotVerify = async (req,res)=>{
    try {
        
        const email = req.body.email;

        const userData  = await  User.findOne({email:email})
        if (userData) {
          
            if(userData.is_verified === 0){
                res.render('forgot', {message:'user email is incorrect'})

            }else{
                const randomString = randomstring.generate();
                const updateData = await User.updateOne({email:email},{$set:{ token:randomString }})

                sendForgotMail(userData.name, userData.email, randomString);
                res.render('forgot', {message:'Please check your email and reset your password'})

            }

        } else {
            res.render('forgot', {message:'user email is incorrect'})
        }
    } catch (error) {
        console.log(error.message);
    }
}

//check token
const forgetPasswordLoad = async (req,res)=>{
    try {
       
        const token = req.query.token;
        const tokenData = await User.findOne({token:token})

        if (tokenData) {
            res.render('forgot-password', {user_id:tokenData._id})

        } else {
            res.render('404', {message:'Token is invalid'})
        }

    } catch (error) {
        console.log(error.message);
    }
}

//reset password

const resetPassword = async(req,res)=>{
    try {
        
        const password = req.body.password;
        const userid = req.body.user_id;

        const secure_password = await securePassword(password);

        const updatedData = await User.findByIdAndUpdate({_id:userid},{$set:{ password:secure_password , token:''}})

        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}

//user profile edit and update

const editLoad= async(req,res)=>{
    try {
        const id = req.query.id;

        const userData =  await User.findById({_id:id});

        if(userData){
            res.render('edit',{user:userData})
        }else{
            res.redirect('/')
        }

    } catch (error) {
        console.log(error.message);
    }
}

//update user profile
const updateUserProfile = async(req,res)=>{
    try {
        if (req.file) {
            const userData= await User.findByIdAndUpdate({_id:req.body.user_id},{$set:{name:req.body.name, email:req.body.email, mobile:req.body.phone, image:req.file.filename}})

        } else {
            const userData= await User.findByIdAndUpdate({_id:req.body.user_id},{$set:{name:req.body.name, email:req.body.email, mobile:req.body.phone}})
        }

        res.redirect('/home')
    } catch (error) {
        console.log(error.message);
    }
}

const logout = async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}

module.exports ={
    loadRegister,
    insertUser,
    verifyMail,
    loginLoad,
    verifyloginSystem,
    loadHome,
    forgotLoad,
    forgotVerify,
    forgetPasswordLoad,
    resetPassword,
    editLoad,
    updateUserProfile,
    logout
}