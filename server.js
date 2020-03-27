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

   (Sprint 2) 2/3/2020
   Create new user account
   api/user POST 201 on success

   (Sprint 3) 3/27/2020
   Added route to load page for authorized user
     api/page?pageid=<page number>
   Modified api/images POST to:
     - upload image for authorized user
     - requires token in X-Auth header
   Modified api/images GET to:
     api/images?u=<user token>
     - requires token in X-Auth header
     - form data - image 
     - image multipart encoded

   Author: S. Sigman 
   Version: 1.2 (3/27/2020)
 */
const express = require('express');
const bodyParser = require('body-parser');
const DEBUG = false;

const app = express();
const PORT = 3000;

app.use(express.static('public'));

// configure server to use router node
const router = express.Router();
// Use the body parser with urlencoded data
router.use(bodyParser.urlencoded({ extended: true }));
router.use('/api/images', require('./api/images'));
router.use('/api', require('./api/users'));
router.use('/api/page', require('./api/pages'));
app.use(router);

app.listen(PORT, () => {
    if (DEBUG)
      console.log(router.stack)
    console.log('Listening at ' + PORT );
});