// RESTful API for image manipulation
// Version: 0.11 (2/1/2020)
// Author: S. Sigman
// Notes: 
// 1. Sprint 1: First implementation RESTful api for
//    manipulating images. Provides routes for: 
//    a) retrieving all images in the database (api/images - GET),
//    b) saving an image in the database & uploading the image
//       to the public/images directory with a unique name.
// 2. Image upload is handled by the Multer node module.
// 3. Sprint 3: api changed as specified
//    api/images POST - Saves image after authorizing 
//                      user.  Requires x-auth header.
//                      Stores images in subdirectory of 
//                      public/images, which is named as the 
//                      sha256 of the uid.
//             Returns: 201: Created if image is uploaded
//                      401: Unauthorized if invalid token
//                      400: If the image copy fails
//                      507: Image could not be stored
//     api/images?u=<user token> - Retrieves all images for 
//                       user with specified token.
//             Returns: 201: Created & image array, if token 
//                           authorized.
//                      401: Unauthorized - user not authorized
//                      404: Not Found - user not found
//                      500: Server error - try later   
// 4. Sprint 3: api/images POST changed to create thumbnail and
//    store the thumbnail with filename in
//    images/<sha256 user's uid>/thumbs (3/30/2020)                

const Image = require('../models/image');
const User = require('../models/user');
const router = require('express').Router();
const multer = require('multer');
const mthumb = require('media-thumbnail');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require ("jwt-simple");
const config = require("../configuration/config.json");

const DEBUG = true;

var secret = config.secret;

// Set storage for Multer 
// Sprint 3 - changed to upload directory
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'upload')
    },
    filename: function (req, file, cb) {
      // make a unique filename
      cb(null,  file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
  });

// set upload object to store pictures to correct location
var upload = multer({ storage: storage });

// API to get all images (api/images)
router.get('/', (req,res) =>{

    // 1. get the user's token
    let token = req.query.u;

    // 2. decode the token & validate the user
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
                console.log("Server error trying to find user.");
            return res.status(500).json({error: "Server error. Try later."});
        }
        if (DEBUG) 
                console.log('Get all images for user: ' + user.uid);

        if (user) {
            // 3. Find the user's images
            Image.find({owner: user.uid},(err,img) => {
                if (err) {
                    res.status(500).json({error: "Server error: Try later."});
                }
                else {
                    res.status(201).json(img);
                }
            });
        } 
        else {
            res.status(404).json({error: "User not found."});
        }    
    });      
});

// api/image
router.post('/', upload.single('photo'), (req, res) => {
    // log the file upload to console
    if(req.file) {
        console.log("File: " + req.body.photoName + " saved to upload.");
    }
    else {
        if (DEBUG)
            console.log({error: "Could not store Image."});
        return res.status(507).json({error: "Could not store image."});
    }
    
    //  1. get auth token from X-Auth header
    // See if the X-Auth header is set
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
    //  2. decode token to get user name (usr)
    // Note: This apporach presents a security problem. All that is 
    //       needed to upload an image is a valid user token contining
    //       the uid for an existing user.  Checking that the user 
    //       exists in the db is not sufficient.  The server should
    //       keep track of the authenticated user and compare the 
    //       token id with that of the logged in user.  This can
    //       be done using session variables.
    if (DEBUG)
        console.log("Image upload User is: " + decoded.username);

    let usr = decoded.username;
    User.findOne({uid: usr}, (err, user)=>{
        if (err) {
            if (DEBUG)
                console.log("Invalid JWT: user not found");
            return res.status(400).json({error: "Invalid JWT"});
        }
        if (DEBUG)
            console.log("Generating the image subdir for: " + user.uid);

        //  3. generate the path as imgPath = sha256 of usr.uid
        let userSubdir = crypto.createHash('sha256').update(user.uid).digest("hex");
        if (DEBUG)
            console.log("User Image Path: " + userSubdir);

        //  4. copy the file from uploads to images/imgPath/filename

        let from = "upload/" + req.file.filename;
        let to = "public/images/" + userSubdir +"/"+req.file.filename;
        fs.copyFile(from, to, (err)=> {
            if (err) {
                if (DEBUG)
                    console.log("Image copy from upload to " + to + " failed.");
                return res.status(507).json({error: "Image upload failed",
                                             errMsg: err});
            }     
        });
        
        if (DEBUG)
            console.log("making the thumbnail image");

        // make a thumbnail of the image
        let thumb = "public/images/" + userSubdir + "/thumbs/"+ req.file.filename;
        
        if (DEBUG)
            console.log("thumbnail image:" + thumb);

        mthumb.forImage(
            to,
            thumb,
            {
              width: 125
            })
            .then(() => console.log('Thumbnail made'), err => console.error(err));
        
        if (DEBUG)
            console.log("Uploaded File copied to images subdirectory");

        // check to see if file was copied
        // if (!fs.existsSync(to)) {
        //     if (DEBUG)
        //         console.log("Image copy from upload to " + to + " failed.");
        //     return res.status(507).json({error: "Image upload failed"});
        // };

        //  5. delete the file from uploads
        fs.unlink(from, (err)=>{
            if (err) {
                console.log("File " + from + " was not deleted.");
            }
            console.log("File " + from + " was not deleted.");
        });

        //  6. make new image doc & save the image information in db
        // make a new Image object from the input data
        var img = new Image({
            filename: req.file.filename,
            photo_name: req.body.photoName,
            path: userSubdir,
            album: req.body.album,
            description: req.body.description,
            f_stop: req.body.f_stop,
            s_speed: req.body.s_speed,
            iso: req.body.iso,
            camera: req.body.camera,
            upload_date: new Date(),
            owner: user.uid
        });

        // save the image to the database
        img.save((err, img)=> {
            if (err) {
                res.status(400).send(err);
            } else {
                //res.send("Image was saved.");
                res.status(201).json({success: "Image uploaded."});
            }
        });

    });    
});

module.exports = router;