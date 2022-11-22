require('dotenv').config()
const express = require('express')

const admin_route = express();

const session = require('express-session');

//const config = require('../config/config')

admin_route.use(session({secret:process.env.MY_SESSION_SECRET,  resave:false,
    saveUninitialized:false,}))

const bodyParser = require('body-parser');

admin_route.use(bodyParser.json())
admin_route.use(bodyParser.urlencoded({extended:true}));

admin_route.use(express.static('public/userImages'))
admin_route.use(express.static('public/css'))
admin_route.use(express.static('public/js'))

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

//use multer
const multer = require('multer');
const path = require('path');

admin_route.use(express.static('public/userImages'))
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

const auth = require('../middleware/adminAuth')

const controller = require('../controllers/adminController')

admin_route.get('/',auth.isLogout,controller.loadLogin);

admin_route.post('/',controller.verifyLogin);

admin_route.get('/home',auth.isLogin,controller.loadDashboard)

admin_route.get('/logout',auth.isLogin,controller.logout)

admin_route.get('/forget',auth.isLogout,controller.forgetLoad)

admin_route.post('/forget',controller.forgetSend)

admin_route.get('/forget-password',auth.isLogout,controller.forgetPasswordLoad)

admin_route.post('/forget-password',controller.forgetPasswordSend)

admin_route.get('/dashboard',auth.isLogin,controller.adminDashboard)

admin_route.get('/new-user',auth.isLogin,controller.newUserLoad)

admin_route.post('/new-user',upload.single('image'),controller.addNewUser)

admin_route.get('/edit-user',auth.isLogin,controller.editUserLoad)

admin_route.post('/edit-user',controller.updateUser)

admin_route.get('/delete-user',auth.isLogin,controller.deleteUser)








admin_route.get('*',function(req,res){
    res.redirect('/admin')
})

module.exports= admin_route;

