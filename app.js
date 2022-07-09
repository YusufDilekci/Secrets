//jshint esversion:6
require('dotenv').config()
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const md5 = require('md5');



app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));


mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})


const User = new mongoose.model("User", userSchema);


app.get("/", function(req, res){
    res.render("home");
})


app.get("/register", function(req, res){
    res.render("register");
})

app.post("/register", function(req, res){

    const user = new User({
        email: req.body.username,
        password: md5(req.body.password)
    })
    user.save(function(err){
        if(!err){
            res.render("secrets");
        }else{
            console.log(err);
        }
    })

   
})


app.get("/login", function(req, res){
    res.render("login");
})

app.post("/login", function(req, res){
    const username = req.body.username;
    const password = md5(req.body.password);

    // testing
    console.log(password);
    
    User.findOne({email: username}, function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                if(foundUser.password === password){
                    res.render("secrets");
                }else{
                    console.log("Email or password is not correct");
                }
            }
        }
    })
})


app.listen(3000, function(){
    console.log("Server is started on port 3000");
})