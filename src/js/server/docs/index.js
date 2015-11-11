// Display API docs written in Markdown
"use strict";
var fluid  = require("infusion");
var gpii   = fluid.registerNamespace("gpii");

var marked = require("marked");
var fs     = require("fs");
var path   = require("path");

var mdFile = path.resolve(__dirname, "./api.md");

fluid.registerNamespace("gpii.ptd.api.docs");

gpii.ptd.api.docs.route = function (that, req, res) {
    var markdown = fs.readFileSync(that.options.mdFile, {encoding: "utf8"});
    res.render(that.options.template, { "title": that.options.title, "body": marked(markdown, that.options.markedOptions), "layout": that.options.layout});
};

fluid.defaults("gpii.ptd.api.docs", {
    gradeNames: ["gpii.express.router"],
    path:       "/",
    method:     "get",
    template:   "pages/docs",
    layout:     "docs",
    title:      "PTD API Documentation",
    mdFile:     mdFile,
    markedOptions: {
    },
    invokers: {
        route: {
            funcName: "gpii.ptd.api.docs.route",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"]
        }
    }
});