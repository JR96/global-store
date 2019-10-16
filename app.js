const express = require("express"),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    app = express(),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    User = require("./models/user"),
    methodOverride =  require("method-override");

//DATABASE Config
mongoose.connect("mongodb://localhost/superstore",{useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true});


//APP Essentials
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride('_method'));
//app.use(cookieParser('secret'));

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Chilling at the beach watching the $un$et while sipping on some Gin & Tonic!",
    resave: false,
    saveUninitialized: false
}));

//Other app essentials
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
  // res.locals.success = req.flash('success');
   //res.locals.error = req.flash('error');
   next();
});


app.get("/", function(req, res){
    res.render("index");
});

//REGISTER ROUTE
app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req,res) {
   var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
   });
   
    User.register(newUser,req.body.password, function(err,newlyRegistered) {
    if(err){
        console.log(err);
        res.redirect("/register");
    }else{
        res.redirect("/");
    }
    });
});

//LOGIN ROUTE
app.get("/login", function(req, res) {
    res.render("login");
});

app.post("/login", passport.authenticate("local",{
    successRedirect:"/",
    failureRedirect:"/login"
}), function(req, res) {
    
});


//LOGOUT
app.get("/logout", function(req, res) {
   req.logout();
   res.redirect("/");
});

app.listen(3000, process.env.IP, function(){
   console.log("The Global Store Has Started!");
});
