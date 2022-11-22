require('dotenv').config();
const User = require('../models/usermodel');
const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const nodeMailer = require('nodemailer')
//const config = require('../config/config')


const securePassword = async(password)=>{
    try {
        
     const passwordHash= await   bcrypt.hash(password, 10);
     return passwordHash;

    } catch (error) {
        console.log(error.message);
    }
}

//send email verify
const addUserMail = async(name,email,password,user_id)=>{
    try {
        
      const transport =   nodeMailer.createTransport({
            host:'smtp.server.com',
           // port:2525,
           // secure:false,
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
            subject:'Admin add new user and verification mail',
            html:'<P> Hi '+ name +' , please click here <a href="http://localhost:1900/verify?id='+ user_id+'">verify</a> your mail </p> <br> <br> <b> Name: </b>'+ email + '<br> <b>Password:</b>'+ password +''
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


const sendForgotMail = async(name,email,token)=>{
    try {
        
      const transport =   nodeMailer.createTransport({
            host:'smtp.server.com',
            //port:2525,
            //secure:false,
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
            html:'<P> Hi '+ name +' , please click here to <a href="http://localhost:1900/admin/forget-password?token='+ token +'"> Reset </a> your password </p>'
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


const loadLogin = async(req,res)=>{
    try {
        res.render('login')
    } catch (error) {
       console.log(error.message); 
    }
}

const verifyLogin = async(req,res)=>{
    try {
        
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({email:email});

        if (userData) {
            
            const matchPass = await bcrypt.compare(password,userData.password);
            if (matchPass) {
                
                if(userData.is_admin === 0){
                    res.render('login',{message:'email and password incorrect'})

                }else{
                    req.session.user_id = userData._id;
                    res.redirect('/admin/home')
                }


            } else {
                res.render('login',{message:'email and password incorrect'})

            }


        } else {
            res.render('login',{message:'email and password incorrect'})
        }


    } catch (error) {
       console.log(error.message); 
    }
}


const loadDashboard = async(req,res)=>{
    try {
        const userData = await User.findById({_id:req.session.user_id})
        res.render('home',{admin:userData})
    } catch (error) {
        console.log(error.message);
    }
}

const logout = async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/admin')
    } catch (error) {
        console.log(error.message);
    }
}

const forgetLoad = async(req,res)=>{
    try {
        res.render('forget')
    } catch (error) {
        console.log(error.message);
    }
}

const forgetSend = async(req,res)=>{
    try {
        
        const email = req.body.email;

        const userData = await User.findOne({email:email});
        if (userData) {
            
            if(userData.is_admin === 0){
                res.render('forget',{message:'email incorrect'})
            }else{
                const randomString = randomstring.generate();
                 const updatedData = await  User.updateOne({email:email},{$set:{token:randomString}});
                 sendForgotMail(userData.name, userData.email, randomString);
                 res.render('forget',{message:'please get your mail reset your password'})
            }

        } else {
            res.render('forget',{message:'email incorrect'})
        }

    } catch (error) {
        console.log(error.message);
    }
}

const forgetPasswordLoad = async(req,res)=>{
    try {
        const token =req.query.token;
       const tokenData = await User.findOne({token:token})

       if (tokenData) {
            res.render('forget-password',{user_id:tokenData._id})
       } else {
        res.render('404',{message:'invalid link'})
       }
    } catch (error) {
        console.log(error.message);
    }
}

const forgetPasswordSend = async(req,res)=>{
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;

        const secure_password = await securePassword(password);

         const updatedData =  await User.findByIdAndUpdate({_id:user_id},{$set:{password:secure_password, token:''}})

            res.redirect('/admin')
    } catch (error) {
        console.log(error.message);
    }
}

const adminDashboard = async(req,res)=>{
    try {

         const userData =  await  User.find({is_admin:0})

        res.render('dashboard',{users:userData})
    } catch (error) {
        console.log(error.message);
    }
}

const newUserLoad = async(req,res)=>{
    try {
        res.render('new-user')
    } catch (error) {
       console.log(error.message); 
    }
}

const addNewUser = async(req,res)=>{
    try {
        const name = req.body.name;
        const email = req.body.email;
        const mno = req.body.mno;
        const image= req.file.filename;
        const password = randomstring.generate(8);

        const sPassword = await securePassword(password)

        const user = new User({
            name:name,
            email:email,
            mobile:mno,
            image:image,
            password:sPassword,
            is_admin:0
        });

        const userData = await user.save();

        if (userData) {
            //send email
            addUserMail(name, email, password, userData._id);
            res.redirect('/admin/dashboard')
        } else {
            res.render('new-user',{message:'something wrong'})
        }


    } catch (error) {
        console.log(error.message);
    }
}

const editUserLoad = async(req,res)=>{
    try {
        const id = req.query.id;

       const userData = await User.findById({_id:id})
       if(userData){
        res.render('edit-user',{user:userData})

       }else{
        res.redirect('/admin/dashboard')
       }
    } catch (error) {
        console.log(error.message);
    }
}

//admin edit and update user
const updateUser = async(req,res)=>{
    try {
      const updatedData =  await User.findByIdAndUpdate({_id:req.body.id},{$set:{name:req.body.name, email:req.body.email, mobile:req.body.mno, is_verified:req.body.verify}})
      res.redirect('/admin/dashboard')
    } catch (error) {
        console.log(error.message);
    }
}

//admin delete user
const deleteUser= async(req,res)=>{
    try {
        const id = req.query.id;
       await User.deleteOne({_id:id});
       res.redirect('/admin/dashboard')
    } catch (error) {
        console.log(error.message);
    }
}

module.exports={
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    forgetLoad,
    forgetSend,
    forgetPasswordLoad,
    forgetPasswordSend,
    adminDashboard,
    newUserLoad,
    addNewUser,
    editUserLoad,
    updateUser,
    deleteUser
}