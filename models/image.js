// models/image.js
// This defines the MongoDB structure of an image
// document.
// Author: S. Sigman
// Version: 1.1 
// Modified: 3/25/2020
var db = require("../db");

var Image = db.model("Image", {
    filename:  String,  // storage name of the file
    photo_name: String, // user name for the image
    path: String,       // subdirectory name
    album: String,      // album the image is stored in
    description: String, // description of the image
    f_stop: String,      // for a photo, the apperature opening
    s_speed: String,     // for a photo, the shutter speed
    iso: String,         // for a photo, the iso value
    focus_len: String,   // for a photo, the focal lenght in mm
    camera: String,      // for a photo, the type of the camera
    upload_date: { type: Date, default: Date.now},
    owner: String        // the uid of the image owner
});

module.exports = Image;