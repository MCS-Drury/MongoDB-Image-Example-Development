// RESTful API for user manipulation
// Version: 0.11 (2/13/2020)
// Author: S. Sigman
// Notes: 
// 1. Sprint 2 - added POST route to create a user account,
//               api/users - Success return: 201 Created 
//                           Fail returns: 409 Conflict (Duplicate Resource)
// 2. Sprint 2 - added route to authenticate a user,
//               api/auth  - Success returns: jwt token
//                           Fail returns: 401 bad username/password
// 3. Sprint 3 - api/user POST modified to create directory for the
//                             new user's images.
//                 Return: 201 Created - user created
//                         400 Failed to create subdirectory for user
//                         409 Duplicate resource - user exists
//                         500 Server error - Try later.

const jwt = require ("jwt-simple");
const User = require("../models/user");
const router = require("express").Router();
const bcrypt = require("bcrypt-nodejs");
const config = require("../configuration/config.json");
const bodyParser = require("body-parser");
const fs = require('fs');
const crypto = require('crypto');

const DEBUG = false;

var secret = config.secret;
router.use(bodyParser.json());

// route to create a user, api/user
router.post("/user",(req,res)=> {
    // check to see if the user exists
    User.findOne({uid: {$eq: req.body.username}}, (err, user)=> {
      if(err) {
        return res.status(500).json({error: "Server Error. Try later."});
      };
      if(user !== null) {
        if (DEBUG) {
          console.log("Duplicate Check - Duplicate user found: " + req.body.username);
        }
          res.sendStatus(409);  // send duplicate resource error
      }
      else {
        if (DEBUG) {
          console.log("User: " + req.body.username);
          console.log("Password: " + req.body.password);
          console.log("Name: " + req.body.full_name);
        }
        // get a hash for the password
        bcrypt.hash(req.body.password, null, null, (err, hash)=> {
          var newUser = new User ( {
            uid: req.body.username,
            password: hash,
            full_name: req.body.full_name,
            date_created: new Date()
          });
          // create the users image storage
          if (DEBUG)
            console.log('New user: ' + newUser.uid);
          let usrDir = crypto.createHash('sha256').update(newUser.uid).digest("hex");
          
          if (DEBUG)
            console.log("making dir: " + usrDir + " for user " + newUser.uid);
          
            let newDir = "public/images/" + usrDir;
          fs.mkdir(newDir, (err)=>{
              if  (err) {
                if (DEBUG)
                  console.log('new directory not created');
                return res.status(400).json({error: "Directory for " + newUser.uid + " not created"});
              }
              if (DEBUG)
                console.log("Directory created");
              // save the user
              newUser.save(function (err) {
                if (err) {
                  return res.status(500).json({error: "Server Error. Try later."});
                }
                res.status(201).json({success: "User created."});
              });
          });
        });
      }
    });
   
});

// route to authenticate a user
router.post("/auth", (req, res)=>{
  // is the user in the database
  User.findOne({uid: {$eq: req.body.username}}, (err, user)=> {
    if (err) throw err;

    if (!user) {
      console.log("Auth: User not found");
      // user not found
      res.status(401).json({ error: "Bad username/password."});
    }
    else {
      console.log("User Found " + user);
      bcrypt.compare(req.body.password, user.password, (err, valid)=>{
        if (err) {
          res.status(400).json({ error: err});
        }
        else if (valid) {
          let commaPos = user.full_name.indexOf(',');
          let firstName = user.full_name.substring(commaPos+1);
          let token = jwt.encode({username: user.uid}, secret);
          res.json({token: token,
                    firstName: firstName});
        }
        else {
          res.status(401).json({ error: "Bad username/password."});
        }
      });
      
    }
  });
});

module.exports = router;