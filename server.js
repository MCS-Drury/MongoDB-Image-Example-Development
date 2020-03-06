/*
   server.js - This module provides a web server
   for the static web pages and for the web pages
   used by the DUCS Image Album App.  Web services
   are provided by the following RESTful API:

   (Sprint 1)
   Get all Images
   api/images GET  200 on success, 400 and error on failure
   Upload an image
   api/images POST 200 on success, 400 and error on failure

   (Sprint 2)
   Create new user account
   api/user POST 201 on success

   Author: S. Sigman 
   Version: 1.1 (2/3/2020)
 */
const express = require('express');
const bodyParser = require('body-parser');
//const Image = require("./models/image");

const app = express();
const PORT = 3000;

app.use(express.static('public'));

// configure server to use router node
const router = express.Router();
// Use the body parser with urlencoded data
router.use(bodyParser.urlencoded({ extended: true }));
router.use('/api/images', require('./api/images'));
router.use('/api', require('./api/users'));
app.use(router);

app.listen(PORT, () => {
    console.log('Listening at ' + PORT );
});