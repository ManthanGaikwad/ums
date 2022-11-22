const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique: true
    },
    email:{
        type:String,
        unique : true,
        required:true
    },
    mobile:{
        type:String,
        required:true,
        unique : true
    },
    image:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    is_admin:{
        type:Number,
        required:true
    },
    is_verified:{
        type:Number,
        default:0
    },
    token:{
        type:String,
        default:''
    }
});


module.exports = mongoose.model('User', userSchema)