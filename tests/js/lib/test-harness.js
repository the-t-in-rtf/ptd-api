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

require("gpii-pouch");
require("gpii-pouchdb-lucene");

require("./test-express");
require("./test-pouch");

var schemaDir      = path.resolve(__dirname, "../../../src/schemas");

// The base harness launches express with no API or browser.
fluid.defaults("gpii.ptd.api.tests.harness", {
    gradeNames: ["fluid.component"],
    ports: {
        express: "3959"
    },
    events: {
        onExpressReady: null,
        onHarnessReady: {
            events: {
                onExpressReady: "onExpressReady"
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
        }
    },
    listeners: {
        "onHarnessReady.log": { funcName: "fluid.log", args: ["Test harness ready..."]}
    }
});

// A mix-in grade to add a test browser.
fluid.defaults("gpii.ptd.api.tests.harness.hasBrowser", {
    gradeNames: ["fluid.component"],
    events: {
        onBrowserReady: null
    },
    components: {
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
    }
});

// The base plus just express and the API
fluid.defaults("gpii.ptd.api.tests.harness.api", {
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
                dbName: "{gpii.ptd.api.tests.harness.api}.options.dbName",
                ports:  "{gpii.ptd.api.tests.harness.api}.options.ports",
                listeners: {
                    onStarted: "{gpii.ptd.api.tests.harness.api}.events.onApiReady.fire"
                }
            }
        },
        pouch: {
            type: "gpii.ptd.api.tests.pouch",
            options: {
                dbName: "{gpii.ptd.api.tests.harness.api}.options.dbName",
                ports:  "{gpii.ptd.api.tests.harness.api}.options.ports",
                listeners: {
                    onReady: "{gpii.ptd.api.tests.harness.api}.events.onPouchReady.fire"
                }
            }
        },
        lucene: {
            type: "gpii.pouch.lucene",
            options: {
                port:  "{gpii.ptd.api.tests.harness.api}.options.ports.lucene",
                dbUrl: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args:     ["http://localhost:%port/", { port: "{gpii.ptd.api.tests.harness.api}.options.ports.couch"}]
                    }
                },
                listeners: {
                    "onStarted.notifyParent": {
                        func: "{gpii.ptd.api.tests.harness.api}.events.onLuceneReady.fire"
                    },
                    "onShutdownComplete.notifyParent": {
                        func: "{gpii.ptd.api.tests.harness.api}.events.onLuceneShutdownComplete.fire"
                    }
                }
            }
        },
        mail: {
            type: "gpii.test.mail.smtp",
            options: {
                port: "{gpii.ptd.api.tests.harness.api}.options.ports.mail",
                listeners: {
                    "onReady": [
                        {
                            func: "{gpii.ptd.api.tests.harness.api}.events.onMailReady.fire"
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

// The API and a browser instance.
fluid.defaults("gpii.ptd.api.tests.harness.apiAndBrowser", {
    gradeNames: ["gpii.ptd.api.tests.harness.api", "gpii.ptd.api.tests.harness.hasBrowser"],
    events: {
        onHarnessReady: {
            events: {
                onApiReady:     "onApiReady",
                onBrowserReady: "onBrowserReady",
                onLuceneReady:  "onLuceneReady",
                onMailReady:    "onMailReady",
                onPouchReady:   "onPouchReady"
            }
        }
    }
});

// The API and a browser, but with a version of pouch that queries its views up front.
fluid.defaults("gpii.ptd.api.tests.harness.loadsViewsOnStartup", {
    gradeNames: ["gpii.ptd.api.tests.harness.apiAndBrowser"],
    components: {
        pouch: {
            type: "gpii.ptd.api.tests.pouch.loadsViewsOnStartup"
        }
    }
});
