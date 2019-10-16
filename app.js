const express = require("express"),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    app = express(),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    User = require("./models/user"),
	async = require("async"),
	nodemailer = require("nodemailer"),
    methodOverride =  require("method-override");

var crypto = require("crypto");

//DATABASE Config
mongoose.connect("mongodb://localhost:27017/superstore",{useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true});


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

//FORGOT PASSEORD
app.get("/forgot", (req, res)=>{
	res.render("forgot")
})

app.post("/forgot", (req, res)=>{
	async.waterfall([
		function(done){
			crypto.randomBytes(20, function(err, buf){
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		function(token, done){
			User.findOne({username:req.body.username}, function(err, user){
				if(!user){
					console.log("No account with that email address exists");
					return res.redirect("/forgot");
				}
				
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000;// 1hourin millisecs
				
				user.save(function(err){
					done(err, token, user);
				})
			})
		},
		function(token, user, done){
			var smtpTransport = nodemailer.createTransport({
				service: 'Gmail',
				auth:{
					user: 'codewithchronic@gmail.com',
					pass: process.env.GMAILPW
			}
			});
			var mailOptions = {
				to: user.username,
				from: 'codewithchronic@gmail.com',
				subject: 'Password Reset',
				text: 'You are receiving this because you (or someone else) have requested the reset of your password.\n\n'+
				'Please click on the link below to reset password, or copy and paste this link onto your browser to complete this process.\n\n'+
				'http://'+ req.headers.host + '/reset/'+token+'\n\n If you did not request this. please ignore this email and you email will remain unchanged.'
			};
			smtpTransport.sendMail(mailOptions, function(err){
				console.log("message sent");
				done(err, 'done');
			});
		}
	], function(err){
		if (err) return next(err);
		res.redirect('/forgot');
	});
});

app.get("/reset/:token", function(req, res){
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now() } }, function(err, user){
		if(!user){
			return res.redirect("/forgot")
		}
		
		res.render("reset",{token: res.params.token})
		
	});
});

app.post("/reset/:token", function(req, res){
	async.waterfall([
		function(done){
			User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now() } }, function(err, user){
				if(!user){
					console.log("token expired")
					return res.redirect('back');
				}
				if(req.body.password === req.body.confirm){
					user.setPassword(req.body.password, function(err){
						user.resetPasswordToken = undefined;
						user.resetPasswordExpires = undefined;
						
						user.save(function(err){
							req.logIn(user, function(err){
								done(err, user);
							});
						});
					})
				}else{
					console.log("Passwords don't match")
					return res.redirect('back');
				}
			});
		},
		function(user, done){
			var smtpTransport = nodemailer.createTransport({
				service: 'Gmail',
				auth:{
					user: 'codewithchronic@gmail.com',
					pass: process.env.GMAILPW
			}
			});
			var mailOptions = {
				to: user.username,
				from: 'codewithchronic@gmail.com',
				subject: 'Password Reset Successful',
				text: 'Hello '+user.firstName+'\n\n'+
				'This is confirmation that the password for your account '+user.username+' was successfully updated'
			};
			smtpTransport.sendMail(mailOptions, function(err){
				console.log("Password changed");
				done(err);
			});
		}
	], function(err){
		res.redirect('/')
	});
});

app.listen(3000, process.env.IP, function(){
   console.log("The Global Store Has Started!");
});
