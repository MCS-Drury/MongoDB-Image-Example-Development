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

const jwt = require ("jwt-simple");
const User = require("../models/user");
const router = require("express").Router();
const bcrypt = require("bcrypt-nodejs");
const config = require("../configuration/config.json");
const bodyParser = require("body-parser");
var secret = config.secret;
router.use(bodyParser.json());

// route to create a user, api/user
router.post("/user",(req,res)=> {
    // check to see if the user exists
    User.findOne({uid: {$eq: req.body.username}}, (err, user)=> {
      if(err) throw err;
      if(user !== null) {
        console.log("Duplicate Check - Duplicate user found: " + req.body.username);
        res.sendStatus(409);  // send duplicate resource error
      }
      else {
        console.log("User: " + req.body.username);
        console.log("Password: " + req.body.password);
        console.log("Name: " + req.body.full_name);
        // get a hash for the password
        bcrypt.hash(req.body.password, null, null, (err, hash)=> {
          var newUser = new User ( {
            uid: req.body.username,
            password: hash,
            full_name: req.body.full_name,
            date_created: new Date()
          });

          // save the user
          newUser.save(function (err) {
              if (err) return next(err);
              res.sendStatus(201);
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