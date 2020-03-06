var db = require("../db");

var User = db.model("User", {
    uid:  String, 
    password: String,
    full_name: String,
    date_created: { type: Date, default: Date.now },
});

module.exports = User;