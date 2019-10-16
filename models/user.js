var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username  : {type : String, unique : true, require : true },
    firstName : String,
    lastName  : String,
    phone     : String,
    password  : String,
    resetPasswordToken : String,
    resetPasswordExpires : Date
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("user", userSchema);