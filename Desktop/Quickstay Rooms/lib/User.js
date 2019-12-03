var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    username : String,
    password : String,
    email : String,
    phonenumber : Number
});

var User = mongoose.model('myuser',userSchema);
module.exports = User;
