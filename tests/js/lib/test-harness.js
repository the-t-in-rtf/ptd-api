/*

  Two sample "harnesses", which are complete sets of test fixtures that can either be loaded directly (via the launchers
  included with this package) or which can be used in a `fluid.testEnvironment`.

 */
"use strict";
var fluid = require("infusion");
var path  = require("path");

require("gpii-express");
require("gpii-handlebars");
require("gpii-mail-test");

require("gpii-test-browser");

require("../../../index.js");

require("./test-express");
require("./test-pouch");

var schemaDir      = path.resolve(__dirname, "../../../src/schemas");

// The base harness launches express with no API.
fluid.defaults("gpii.ptd.api.tests.harness", {
    gradeNames: ["fluid.component"],
    ports: {
        express: "3959"
    },
    events: {
        onExpressReady: null,
        onBrowserReady: null,
        onHarnessReady: {
            events: {
                onExpressReady: "onExpressReady",
                onBrowserReady: "onBrowserReady"
            }
        }
    },
    components: {
        express: {
            type: "gpii.ptd.api.tests.express.base",
            options: {
                ports: "{gpii.ptd.api.tests.harness}.options.ports",
                listeners: {
                    "onStarted.notifyParent": {
                        func: "{gpii.ptd.api.tests.harness}.events.onExpressReady.fire"
                    }
                }
            }
        },
        browser: {
            type: "gpii.tests.browser",
            options: {
                // Uncomment the next line (or add your own options in a derived grade) if you want to see the browser output on your screen.
                //nightmareOptions: { show: true},
                listeners: {
                    "onReady.notifyParent": {
                        func: "{gpii.ptd.api.tests.harness}.events.onBrowserReady.fire"
                    }
                }
            }
        }
    },
    listeners: {
        "onHarnessReady.log": { funcName: "fluid.log", args: ["Test harness ready..."]}
    }
});

fluid.defaults("gpii.ptd.api.tests.harness.apiAndBrowser", {
    gradeNames: ["gpii.ptd.api.tests.harness"],
    ports: {
        express: "3959",
        couch:   "9599",
        lucene:  "9959",
        mail:    "2525"
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
        onPouchReady:             null,
        onHarnessReady: {
            events: {
                onApiReady:     "onApiReady",
                onBrowserReady: "onBrowserReady",
                onLuceneReady:  "onLuceneReady",
                onMailReady:    "onMailReady",
                onPouchReady:   "onPouchReady"
            }
        }
    },
    components: {
        express: {
            type: "gpii.ptd.api.tests.express.api",
            options: {
                dbName: "{gpii.ptd.api.tests.harness.apiAndBrowser}.options.dbName",
                ports:  "{gpii.ptd.api.tests.harness.apiAndBrowser}.options.ports",
                listeners: {
                    onStarted: "{gpii.ptd.api.tests.harness.apiAndBrowser}.events.onApiReady.fire"
                }
            }
        },
        pouch: {
            type: "gpii.ptd.api.tests.pouch",
            options: {
                dbName: "{gpii.ptd.api.tests.harness.apiAndBrowser}.options.dbName",
                ports:  "{gpii.ptd.api.tests.harness.apiAndBrowser}.options.ports",
                listeners: {
                    onReady: "{gpii.ptd.api.tests.harness.apiAndBrowser}.events.onPouchReady.fire"
                }
            }
        },
        lucene: {
            type: "gpii.pouch.lucene",
            options: {
                port:  "{gpii.ptd.api.tests.harness.apiAndBrowser}.options.ports.lucene",
                dbUrl: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args:     ["http://localhost:%port/", { port: "{gpii.ptd.api.tests.harness.apiAndBrowser}.options.ports.couch"}]
                    }
                },
                listeners: {
                    "onStarted.notifyParent": {
                        func: "{gpii.ptd.api.tests.harness.apiAndBrowser}.events.onLuceneReady.fire"
                    },
                    "onShutdownComplete.notifyParent": {
                        func: "{gpii.ptd.api.tests.harness.apiAndBrowser}.events.onLuceneShutdownComplete.fire"
                    }
                }
            }
        },
        mail: {
            type: "gpii.test.mail.smtp",
            options: {
                port: "{gpii.ptd.api.tests.harness.apiAndBrowser}.options.ports.mail",
                listeners: {
                    "onReady": [
                        {
                            func: "{gpii.ptd.api.tests.harness.apiAndBrowser}.events.onMailReady.fire"
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
        "onApiReady.log":     { funcName: "fluid.log", args: ["API ready..."]},
        "onLuceneReady.log":  { funcName: "fluid.log", args: ["Lucene ready..."]},
        "onMailReady.log":    { funcName: "fluid.log", args: ["Mail server ready..."]},
        "onPouchReady.log":   { funcName: "fluid.log", args: ["Pouch ready..."]},
        "onHarnessReady.log": { funcName: "fluid.log", args: ["Test harness ready..."]},
        "onLuceneReadyForShutdown.shutdownLucene": {
            func: "{lucene}.events.onReadyForShutdown.fire"
        }
    }
});

fluid.defaults("gpii.ptd.api.tests.harness.loadsViewsOnStartup", {
    gradeNames: ["gpii.ptd.api.tests.harness.apiAndBrowser"],
    components: {
        pouch: {
            type: "gpii.ptd.api.tests.pouch.loadsViewsOnStartup"
        }
    }
});
