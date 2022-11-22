require('dotenv').config()
const express = require('express');
const user_route = express();
const cookieParser = require('cookie-parser')
const passport = require('passport')


const session = require('express-session')
//const config = require('../config/config')

user_route.use(
    session({
        secret:process.env.MY_SESSION_SECRET,
        resave:false,
        saveUninitialized:false,
        
})
);

require('../passport-setup')

//passport
user_route.use(passport.initialize())

user_route.use(passport.session())

user_route.use(cookieParser())

const auth = require('../middleware/userAuth')
//template engine
user_route.set('view engine', 'ejs');
user_route.set('views', './views/users');

//body-parser
const bodyParser = require('body-parser')
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}))

//use multer
const multer = require('multer');
const path = require('path');

user_route.use(express.static('public/userImages'))
user_route.use(express.static('public/css'))
user_route.use(express.static('public/js'))
user_route.use(express.static('public/images'))


const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/userImages'))
    },
    filename:function(req,file,cb){
        const name = file.originalname;
        cb(null,name)
    }
});

const upload = multer({storage:storage})



const userController = require('../controllers/userController');

user_route.get('/register',auth.isLogout,userController.loadRegister);

user_route.post('/register',upload.single('image'),userController.insertUser);

user_route.get('/verify',userController.verifyMail);

user_route.get('/',auth.isLogout,userController.loginLoad);

user_route.get('/login',auth.isLogout,userController.loginLoad);
user_route.post('/login',userController.verifyloginSystem);

user_route.get('/home',auth.isLogin,userController.loadHome);

//google login
/*user_route.get ('/google/home',(req,res)=>{
    const user = {
        name:req.user.displayName, 
        email:req.user.emails[0].value,
        image:req.user.photos[0].value
    }
    res.render('googleHome',{user:user})

}); */

//after google login this page show
//user_route.get('/google', passport.authenticate('google',{scope:['profile','email']}))

//if user not valid then 
//user_route.get('/google/callback',passport.authenticate('google',{failureRedirect:'/failed'}),function(req,res){
    //successful auth then redirect home.
   // res.redirect('/google/home')
//})

//user_route.get('/google/logout',userController.logout)




user_route.get('/logout',auth.isLogin,userController.logout)

user_route.get('/forgot',auth.isLogout,userController.forgotLoad);

user_route.post('/forgot',userController.forgotVerify);

user_route.get('/forgot-password',auth.isLogout,userController.forgetPasswordLoad)

user_route.post('/forgot-password',userController.resetPassword)

user_route.get('/edit',auth.isLogin,userController.editLoad);

user_route.post('/edit',upload.single('image'),userController.updateUserProfile)








module.exports = user_route;