/*

    Our `gpii-pouch` test fixtures.

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var path    = require("path");
var request = require("request");
var when    = require("when");

require("gpii-express");
require("gpii-pouch");
require("gpii-pouchdb-lucene");

require("../../../index.js");


var recordData     = path.resolve(__dirname, "../../data/pouchdb/records.json");
var apiView        = path.resolve(__dirname, "../../data/views/api.json");
var luceneView     = path.resolve(__dirname, "../../data/views/lucene.json");

var userData       = path.resolve(__dirname, "../../data/pouchdb/users.json");

// An instance of pouch that is configured with the standard test data and CouchDB views.
fluid.defaults("gpii.ptd.api.tests.pouch", {
    gradeNames: ["gpii.express"],
    config: {
        express: {
            "port" : "{that}.options.ports.couch"
        },
        app: {
            name: "Pouch Test Server"
        }
    },
    events: {
        onPouchStarted:   null,
        // `onStarted` is already used by express, so we emit `onReady` when all startups are complete.
        onReady: {
            events: {
                onStarted:      "onStarted",
                onPouchStarted: "onPouchStarted"
            }
        }
    },
    components: {
        pouch: {
            type: "gpii.pouch",
            options: {
                path: "/",
                databases: {
                    records: { data: [recordData, apiView, luceneView]},
                    users:   { data: userData}
                },
                listeners: {
                    "onStarted.notifyParent": {
                        func: "{gpii.ptd.api.tests.pouch}.events.onPouchStarted.fire"
                    }
                }
            }
        }
    }
});


// A function to optionally load each view before running the tests.  See below.
fluid.registerNamespace("gpii.ptd.api.tests.pouch.loadsViewsOnStartup");
gpii.ptd.api.tests.pouch.loadsViewsOnStartup.loadViews = function (that) {
    fluid.log("starting view caching...");

    var promises = [];
    fluid.each(that.options.viewsToLoad, function (viewPath) {
        var promise = new fluid.promise();
        var viewUrl = fluid.stringTemplate("http://localhost:%port/%db/%viewPath", { port: that.options.ports.couch, db: that.options.dbName, viewPath: viewPath});
        var options = {
            url: viewUrl,
            timeout: 120000
        };
        request(options, function (error) {
            fluid.log("received results from cache request...");
            if (error) {
                promise.reject();
            }
            else {
                promise.resolve();
            }
        });
        promises.push(promise);
    });

    when.all(promises).then(function () {
        fluid.log("Finished with all cache requests...");
        that.events.onViewsLoaded.fire(that);
    });
};

// A separate instance of pouch that loads particular views before claiming it's ready.
//
// In earlier tests, this appeared to be necessary to prevent individual requests from timing out.  It does not
// appear to be necessary now, but is left as a reference and in case performance is poorer in other environments.
//
fluid.defaults("gpii.ptd.api.tests.pouch.loadsViewsOnStartup", {
    gradeNames: ["gpii.ptd.api.tests.pouch"],
    viewsToLoad: [
        "_design/api/_view/children",
        "_design/api/_view/aliases",
        "_design/api/_view/conditions",
        "_design/api/_view/entries",
        "_design/api/_view/terms",
        "_design/api/_view/transforms",
        "_design/api/_view/translations"
    ],
    events: {
        onViewsLoaded:            null,
        onPouchReady: {
            events: {
                onStarted:      "onStarted",
                onPouchStarted: "onPouchStarted"
            }
        },
        onReady: {
            events: {
                onViewsLoaded: "onViewsLoaded"
            }
        }
    },
    listeners: {
        "onPouchReady.loadViews": {
            funcName: "gpii.ptd.api.tests.pouch.loadsViewsOnStartup.loadViews",
            args:     ["{that}"]
        },
        "onViewsLoaded.log": { funcName: "fluid.log", args: ["Pouch views loaded..."]}
    }
});