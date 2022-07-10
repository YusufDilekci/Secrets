//jshint esversion:6
require('dotenv').config()
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));


app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'Our little secret',
  resave: false,
  saveUninitialized: true,
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
    res.render("home");
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        User.find({secret: {$ne: null}}, function(err, foundUsers){
            if(err){
                console.log(err);
            }else{
                res.render("secrets", {userWithSecrets: foundUsers});
            }
        })
    }else{
        res.redirect("/login");
    }
  
})
app.get("/register", function(req, res){
    res.render("register");
})

app.post("/register", function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req, res, () =>{
                res.redirect("/secrets");
            })
        }
    })
})


app.get("/login", function(req, res){
    res.render("login");
})

app.post('/login', 
  passport.authenticate('local'),
  function(req, res) {
    res.redirect('/secrets');
});

app.get("/logout", function(req, res){
    req.logOut(function(request, response){
        res.redirect("/");

    });
})

app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
})
app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;


    User.findById(req.user._id.toString(), function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save()
                res.redirect("/secrets");
            }
        }
    })
})
app.listen(3000, function(){
    console.log("Server is started on port 3000");
})
