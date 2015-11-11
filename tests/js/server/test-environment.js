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
    apiPort:    "3959",
    apiUrl: {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["http://localhost:%port/api/", { port: "{that}.options.apiPort"}]
        }
    },
    pouchPort:  "9599",
    pouchUrl: {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["http://localhost:%port/", { port: "{that}.options.pouchPort"}]
        }
    },
    lucenePort: "9959",
    luceneUrl: {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["http://localhost:%port/", { port: "{that}.options.lucenePort"}]
        }
    },
    mailPort:   "2525",
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
                apiPort:    "{testEnvironment}.options.apiPort",
                apiUrl:     "{testEnvironment}.options.apiUrl",
                lucenePort: "{testEnvironment}.options.lucenePort",
                luceneUrl:  "{testEnvironment}.options.luceneUrl",
                pouchPort:  "{testEnvironment}.options.pouchPort",
                pouchUrl:   "{testEnvironment}.options.pouchUrl",
                mailPort:   "{testEnvironment}.options.mailPort",
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
