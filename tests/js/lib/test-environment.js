// The common test harness wired up as a `fluid.test.testEnvironment` instance.  You are expected to extend this and
// supply a specific test case holder component.
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

// A test environment for browser tests that need a lightweight express instance (for example, to use the `initBlock`
// helper).
//
fluid.defaults("gpii.ptd.api.tests.expressAndBrowser.testEnvironment", {
    gradeNames: ["fluid.test.testEnvironment"],
    urls: {
        express: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port/", { port: "{that}.options.ports.express"}]
            }
        }
    },
    events: {
        onHarnessReady:   null,
        constructHarness: null
    },
    components: {
        harness: {
            type:          "gpii.ptd.api.tests.harness",
            createOnEvent: "constructHarness",
            options: {
                ports: "{testEnvironment}.options.ports",
                urls:  "{testEnvironment}.options.urls",
                listeners: {
                    "onHarnessReady.notifyParent": {
                        func: "{testEnvironment}.events.onHarnessReady.fire"
                    }
                }
            }
        }
    }
});




// A test environment for browser tests that need the full API, pouchDB, etc.
//

fluid.registerNamespace("gpii.ptd.api.tests.apiAndBrowser");

// TODO:  I am probably circumventing a real safeguard by wrapping a disallowed call in my own function.  Review with Antranig.
gpii.ptd.api.tests.apiAndBrowser.shutdownLucene = function (that) {
    if (that.harness && that.harness.lucene) {
        that.harness.lucene.events.onReadyForShutdown.fire(that.harness.lucene);
    }
};

fluid.defaults("gpii.ptd.api.tests.apiAndBrowser.testEnvironment", {
    gradeNames: ["gpii.ptd.api.tests.expressAndBrowser.testEnvironment"],
    urls: {
        api: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port/api/", { port: "{that}.options.ports.express"}]
            }
        },
        couch: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port/", { port: "{that}.options.ports.couch"}]
            }
        },
        lucene: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port/", { port: "{that}.options.ports.lucene"}]
            }
        }
    },
    events: {
        onLuceneShutdownComplete: null,
        onLuceneReadyForShutdown: null
    },
    invokers: {
        "shutdownLucene": {
            funcName: "gpii.ptd.api.tests.apiAndBrowser.shutdownLucene",
            args:     "{that}"
        }
    },
    components: {
        harness: {
            type:          "gpii.ptd.api.tests.harness.apiAndBrowser",
            createOnEvent: "constructHarness",
            options: {
                ports: "{testEnvironment}.options.ports",
                urls:  "{testEnvironment}.options.urls",
                listeners: {
                    "onLuceneShutdownComplete.notifyParent": {
                        func: "{testEnvironment}.events.onLuceneShutdownComplete.fire"
                    }
                }
            }
        }
    }
});


