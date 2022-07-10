//jshint esversion:6
require('dotenv').config()
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session')


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
    password: String
})

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
    res.render("home");
})

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        res.render("secrets");
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

app.listen(3000, function(){
    console.log("Server is started on port 3000");
})
