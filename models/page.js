var db = require("../db");

var Page = db.model("Page", {
    pageiId:  String,    // The id of the page.
    pageName: String,   // The name of the page
    date_created: { type: Date, default: Date.now },
});

module.exports = Page;