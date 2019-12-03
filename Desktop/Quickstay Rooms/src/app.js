const express = require('express');
const path = require('path');
var mongoose = require('mongoose');
const Joi = require('@hapi/joi');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const verify = require('./Token.js');

mongoose.connect('mongodb://127.0.0.1:27017/intenship',{
    useNewUrlParser : true,
    useCreateIndex : true
})


const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 8000;
const hbs = require('hbs');



//Paths

var pulbicDirectoryPath = path.join(__dirname,'../public')
var viewPath = path.join(__dirname,'../templates/views');
var partialPath = path.join(__dirname,'../templates/partials')

//use and set
app.use(express.urlencoded({ extended:false }))
app.use(bodyParser.json());
app.use(express.static(pulbicDirectoryPath));
app.use(express.json({limit:'1mb'}));
app.set('view engine','hbs');
app.set('views',viewPath);
hbs.registerPartials(partialPath);


//Defining a model
const userSchema = new mongoose.Schema({
    username : {
        type: String,
        required:true,
        min:6,
        max:255
    },
    password : {
        type : String,
        required:true,
        min:6,
        max:1024
    },
    email : {
        type : String,
        required : true,
        max:255,
        min:6
    },
    phonenumber : {
        type : Number,
    }
});

const schema = Joi.object().keys({
    username : Joi.string().required(),
    email : Joi.string().min(6).required().email(),
    pass : Joi.string().required(),
    phone : Joi.number().required()
});

const login_validation = Joi.object().keys({
    email : Joi.string().min(6).required().email(),
    pass : Joi.string(),
});


const User = mongoose.model('User',userSchema);


app.get('/signup',(req,res) => {
    res.render('signup')
});

app.post('/signup',async(req,res) => {
    //validation
    const valid =await schema.validate(req.body);
    if(!valid.error){
        //Email Already Exist    
        const emailExist = await User.findOne({
            email : req.body.email
        })
        if (emailExist){
            return res.render('signup',{error1 : "Email already exist"})
        } 
        // Hash Passwords
        const salt = await bcrypt.genSalt(10);
        const hashpassword = await bcrypt.hash(req.body.pass,salt);
        var user = new User();
        user.username = req.body.username;
        user.password = hashpassword;
        user.email = req.body.email;
        user.phonenumber = req.body.phone;
            //saving
             user.save().then(() =>{
                console.log(user)
            }).catch((err) => {
                console.log("ERROR",err)
            })
            res.redirect('/login')
    }
    else{
        return console.log(valid)
    }
});

app.get('/login',(req,res) => {
    res.render('signin')

});

app.post('/login',async(req,res) => {
    //login validation
    const login_valid =await login_validation.validate(req.body);
    if(!login_valid.error){
            //checking email exist
        const user = await User.findOne({ email : req.body.email});
        if(!user){
            return res.render('signin',{error2 : "Email is not found"});
        }
        //Password is correct
        const validPass = await bcrypt.compare(req.body.pass,user.password)
        if(!validPass){
            return res.render('signin',{error3 : "Password is incorrect"});
        }

        //create and assign a token
        const token = jwt.sign({_id : user._id},process.env.TOKEN_SECRET);
        res.header('auth-token',token).send(token);
        res.redirect('/uploads');
    }
    else{
        return console.log(login_error);
    }

})

app.get('/uploads',verify,(req,res) => {
    res.render('fileUpload');
})


//page Error
app.get('*',(req,res) => {
    res.render('Page_error');
})

app.listen(port,() => {
    console.log(`Port started at port number ${ port }`)
})

