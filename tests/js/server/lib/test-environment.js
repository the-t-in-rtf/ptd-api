// The common test harness wired up as a `fluid.test.testEnvironment` instance.  You are expected to extend this and
// supply a specific test case holder component.
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./test-harness");

fluid.registerNamespace("gpii.ptd.api.tests.testEnvironment");

// TODO:  I am probably circumventing a real safeguard by wrapping a disallowed call in my own function.  Review with Antranig.
gpii.ptd.api.tests.testEnvironment.shutdownLucene = function (that) {
    if (that.harness && that.harness.lucene) {
        that.harness.lucene.events.onReadyForShutdown.fire(that.harness.lucene);
    }
};

fluid.defaults("gpii.ptd.api.tests.testEnvironment", {
    gradeNames: ["fluid.test.testEnvironment"],
    hangWait:   30000, // Our views take way too long to cache, so we need to relax the timeouts.
    ports: {
        api:    "3959",
        couch:  "9599",
        lucene: "9959",
        mail:   "2525"
    },
    urls: {
        api: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port/api/", { port: "{that}.options.ports.api"}]
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
        onStarted:                null,
        constructServer:          null,
        onLuceneShutdownComplete: null,
        onLuceneReadyForShutdown: null
    },
    components: {
        harness: {
            type:          "gpii.ptd.api.tests.harness",
            createOnEvent: "constructServer",
            options: {
                ports: "{testEnvironment}.options.ports",
                urls:  "{testEnvironment}.options.ports",
                listeners: {
                    "onReady.notifyParent": {
                        func: "{testEnvironment}.events.onStarted.fire"
                    },
                    "onLuceneShutdownComplete.notifyParent": {
                        func: "{testEnvironment}.events.onLuceneShutdownComplete.fire"
                    }
                }
            }
        }
    },
    invokers: {
        "shutdownLucene": {
            funcName: "gpii.ptd.api.tests.testEnvironment.shutdownLucene",
            args:     "{that}"
        }
    }
});

fluid.defaults("gpii.ptd.api.tests.testEnvironment.loadsViewsOnStartup", {
    gradeNames: ["gpii.ptd.api.tests.testEnvironment"],
    components: {
        harness: {
            type:          "gpii.ptd.api.tests.harness.loadsViewsOnStartup",
            createOnEvent: "constructServer",
            options: {
                ports: "{testEnvironment}.options.ports",
                urls:  "{testEnvironment}.options.ports",
                listeners: {
                    "onReady.notifyParent": {
                        func: "{testEnvironment}.events.onStarted.fire"
                    },
                    "onLuceneShutdownComplete.notifyParent": {
                        func: "{testEnvironment}.events.onLuceneShutdownComplete.fire"
                    }
                }
            }
        }
    }
});