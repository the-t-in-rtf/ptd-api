/*

  A test server with all the trimmings.  See `test-environment.js` if you want to wire this into a Fluid IoC test.

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var path    = require("path");
var request = require("request");
var when    = require("when");

require("gpii-express");
require("gpii-handlebars");
require("gpii-mail-test");
require("gpii-pouch");
require("gpii-pouchdb-lucene");

require("../../../index.js");

var viewDirs  = [
    path.resolve(__dirname, "../../../src/templates"),
    path.resolve(__dirname, "../../../node_modules/gpii-express-user/src/templates")
];

var recordData = path.resolve(__dirname, "../../data/pouchdb/records.json");
var apiView    = path.resolve(__dirname, "../../data/views/api.json");
var luceneView = path.resolve(__dirname, "../../data/views/lucene.json");

var userData   = path.resolve(__dirname, "../../data/pouchdb/users.json");

var bowerDir   = path.resolve(__dirname, "../../../bower_components");
var modulesDir = path.resolve(__dirname, "../../../node_modules");
var srcDir     = path.resolve(__dirname, "../../../src");
var schemaDir  = path.resolve(__dirname, "../../../src/schemas");

// The performance of our pouch views is terrible unless we take the time to hit them once.
fluid.registerNamespace("gpii.ptd.api.tests.harness");
gpii.ptd.api.tests.harness.loadViews = function (that) {
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

fluid.defaults("gpii.ptd.api.tests.harness", {
    gradeNames: ["fluid.component"],
    ports: {
        api:    "3959",
        couch:  "9599",
        lucene: "9959",
        mail:   "2525"
    },
    timeout: 987654321,
    distributeOptions: [
        {
            source: "{that}.options.timeout",
            target: "{that gpii.express.requestAware.router}.options.timeout"
        },
        {
            source: "{that}.options.timeout",
            target: "{that gpii.express.contentAware.router}.options.timeout"
        },
        {
            source: "{that}.options.timeout",
            target: "{that gpii.express.handler}.options.timeout"
        },
        {
            source: "{that}.options.timeout",
            target: "{that gpii.pouch.lucene}.options.processTimeout"
        }
    ],
    dbName: "records",
    events: {
        onApiReady:               null,
        onLuceneReady:            null,
        onLuceneReadyForShutdown: null,
        onLuceneShutdownComplete: null,
        onMailReady:              null,
        onPouchDbReady:           null,
        onPouchExpressReady:      null,
        onPouchReady: {
            events: {
                onPouchDbReady:      "onPouchDbReady",
                onPouchExpressReady: "onPouchExpressReady"
            }
        },
        onReady: {
            events: {
                onApiReady:    "onApiReady",
                onLuceneReady: "onLuceneReady",
                onMailReady:   "onMailReady",
                onPouchReady:  "onPouchReady"
            }
        }
    },
    components: {
        apiExpress: {
            type: "gpii.express",
            options: {
                listeners: {
                    onStarted: "{harness}.events.onApiReady.fire"
                },
                config: {
                    express: {
                        port: "{harness}.options.ports.api",
                        views: viewDirs,
                        app: {
                            name: "PTD API Test Harness",
                            url:  {
                                expander: {
                                    funcName: "fluid.stringTemplate",
                                    args:     ["http://localhost:%port/", { port: "{harness}.options.ports.api"}]
                                }
                            }
                        }
                    }
                },
                components: {
                    api: {
                        type: "gpii.ptd.api.router",
                        options: {
                            ports:  "{harness}.options.ports",
                            dbName: "{harness}.options.dbName"
                        }
                    },
                    // Bower Components
                    bc: {
                        type: "gpii.express.router.static",
                        options: {
                            path:    "/bc",
                            content: bowerDir
                        }
                    },
                    // Node Modules
                    nm: {
                        type: "gpii.express.router.static",
                        options: {
                            path:    "/nm",
                            content: modulesDir
                        }
                    },
                    // The static content from this package itself
                    src: {
                        type: "gpii.express.router.static",
                        options: {
                            path:    "/src",
                            content: srcDir
                        }
                    },
                    handlebars: {
                        type: "gpii.express.hb"
                    }
                }
            }
        },
        pouch: {
            type: "gpii.express",
            options: {
                config: {
                    express: {
                        "port" : "{harness}.options.ports.couch"
                    },
                    app: {
                        name: "Pouch Test Server"
                    }
                },
                listeners: {
                    onStarted: "{harness}.events.onPouchExpressReady.fire"
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
                                "onStarted.notifyHarness": {
                                    func: "{harness}.events.onPouchDbReady.fire"
                                }
                            }
                        }
                    }
                }
            }
        },
        lucene: {
            type: "gpii.pouch.lucene",
            options: {
                port:  "{harness}.options.ports.lucene",
                dbUrl: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args:     ["http://localhost:%port/", { port: "{harness}.options.ports.couch"}]
                    }
                },
                listeners: {
                    "onStarted.notifyParent": {
                        func: "{harness}.events.onLuceneReady.fire"
                    },
                    "onShutdownComplete.notifyParent": {
                        func: "{harness}.events.onLuceneShutdownComplete.fire"
                    }
                }
            }
        },
        mail: {
            type: "gpii.test.mail.smtp",
            options: {
                port: "{harness}.options.ports.mail",
                listeners: {
                    "onReady": [
                        {
                            func: "{harness}.events.onMailReady.fire"
                        }
                    ]
                }
            }
        },
        validator: {
            type: "gpii.schema.validator.server",
            options: {
                schemaDir: schemaDir
            }
        }
    },
    listeners: {
        "onApiReady.log": { funcName: "fluid.log", args: ["API ready..."]},
        "onLuceneReady.log": { funcName: "fluid.log", args: ["Lucene ready..."]},
        "onMailReady.log": { funcName: "fluid.log", args: ["Mail server ready..."]},
        "onPouchReady.log": { funcName: "fluid.log", args: ["Pouch ready..."]},
        "onReady.log": { funcName: "fluid.log", args: ["Test harness ready..."]},
        "onLuceneReadyForShutdown.shutdownLucene": {
            func: "{lucene}.events.onReadyForShutdown.fire"
        }
    }
});

// A separate instance of the test harness that loads particular views before claiming it's ready.
//
// In earlier tests, this appeared to be necessary to prevent individual requests from timing out.  It does not
// appear to be necessary now, but is left as a reference and in case performance is poorer in other environments.
//
fluid.defaults("gpii.ptd.api.tests.harness.loadViews", {
    gradeNames: ["gpii.ptd.api.tests.harness"],
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
                onPouchDbReady:      "onPouchDbReady",
                onPouchExpressReady: "onPouchExpressReady"
            }
        },
        onReady: {
            events: {
                onApiReady:    "onApiReady",
                onLuceneReady: "onLuceneReady",
                onMailReady:   "onMailReady",
                onPouchReady:  "onPouchReady",
                onViewsLoaded: "onViewsLoaded"
            }
        }
    },
    listeners: {
        "onPouchReady.loadViews": {
            funcName: "gpii.ptd.api.tests.harness.loadViews",
            args:     ["{that}"]
        },
        "onViewsLoaded.log": { funcName: "fluid.log", args: ["Pouch views loaded..."]}
    }
});