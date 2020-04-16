// RESTful API for manipulating application pages.
// Pages are stored in the non-public folder, pages and
// are loaded, manipulated, and returned by this api.
// Version: 0.11 (3/27/2020)
// Author: S. Sigman
// Notes: 
//   1. api/page?pageid=#### was added in Sprit 3.

const Page = require('../models/page');
const User = require('../models/user');
const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require ("jwt-simple");
const config = require("../configuration/config.json");

const DEBUG = false;

const secret = config.secret;

// create a route to return a page specified by a page number
// API:  api/page?pageid=#####
//          where ##### is the number of the page
// Prerequisite: The use must be authenticated in order to access
//               the page.
// Return: The page corresponding to ##### and status code 200 or
//         Error status code:
//           401 unauthorized access
//           404 page not found
//           500 server error: try later
router.get('/', (req,res) =>{
    // 1. authenticate the user token
    if (DEBUG)
        console.log("entered api/page");

    if (!req.headers["x-auth"]) {
        if (DEBUG)
            console.log("Auth error from api/images: no x-Auth header")
        return res.status(401).json({error: "Missing X-Auth header"});
    }

    // X-Auth should contain the token 
    let token = req.headers["x-auth"];
    if (DEBUG)
        console.log("token is: " + token);

    let decoded; 
    try {
        if (DEBUG)
            console.log("trying to decode token");
        decoded = jwt.decode(token, secret);
    }
    catch (ex) {
        if (DEBUG)
            console.log("Invalid JWT: token did not decode");
        return res.status(401).json({ error: "Invalid JWT" });
    }

    let usr = decoded.username;

    
    User.findOne({uid: usr}, (err, user)=>{
        if (err) {
            if (DEBUG)
                console.log("Server could not fulfill request. Try later.");
            return res.status(500).json({error: "Server error: Try later."});
        }

        if (DEBUG) 
                console.log('Get page: ' + req.query.pageid + " for " +user.uid);

        if (user) {
            // assert user authenticated
            // 2. if authenticated:
            // 2.1 find pageId in database
            Page.findOne({pageId: req.query.pageid}, (err, page)=>{
                if (err) {
                    if (DEBUG)
                        console.log("Page: " + req.query.pageid + " not found");
                    //If server error, return 500: Try again
                    return res.status(500).json({error: "Server error: Try later."});;
                }
                // assert page found
                // 2.2 if pageId exists:
                
                if (page) {
                    // assert page was found
                    // 2.2.1 return status 200 & 2.2.2 return page with pageName
                    let path2Page = path.resolve("pages/" + page.pageName);
                    return res.status(200).sendFile(path2Page);
                }
                else {
                    // page was not found
                    // 2.3 If pageId does not exist, return 404
                    return res.status("404").json({error: "Page not found."});
                }
            });
        }
        else {
            // 3 is not authenticated return status 401
            res.status(401).json({error: "Not authenticated."});
        }
    });

    

});

module.exports = router;