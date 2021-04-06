// database connection file for MySQL
//
// author: S. Sigman
// version: 1.0 (4/16/2020)
var mysql = require("mysql");
const config = require("./configuration/config.json");

var conn = mysql.createConnection ( {
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});
module.exports = conn;