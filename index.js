require('dotenv').config()
const mongoose = require('mongoose')


const mongoUrl = process.env.MY_MONGO_URL 
//mongoose.connect(mongoUrl);
mongoose.connect(mongoUrl,{
    useNewUrlParser:true,
    useUnifiedTopology:true
}).then((res)=>{
    console.log('connect database');
})


const express = require('express');
const app = express();

const PORT = process.env.PORT || 1900








//for user routes
const userRoute = require('./routs/userRoutes')
app.use('/',userRoute)


//for admin routes
const adminRoute = require('./routs/adminRoutes')
app.use('/admin',adminRoute)



app.listen (PORT, function(){
    console.log(`server is running : ${PORT}`);
})