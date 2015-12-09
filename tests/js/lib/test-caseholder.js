/*

    Case holder grades for use in more complex tests.  For simpler tests, we use similar case holders from
    `gpii-express` and `gpii-test-browser` directly.

    Prepends sequence steps to fire up a test browser and also an instance of express.

    Appends sequence steps to destroy the browser once the test is complete.

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-test-browser");
gpii.tests.browser.loadTestingSupport();

// Caseholder for "lightweight" express and browser...
fluid.defaults("gpii.ptd.api.tests.expressAndBrowser.caseHolder", {
    gradeNames: ["gpii.express.tests.caseHolder.base"],
    sequenceStart: [
        {
            func: "{testEnvironment}.events.constructHarness.fire"
        },
        {
            listener: "fluid.identity",
            event:    "{testEnvironment}.events.onHarnessReady"
        }
    ],
    // Manually kill off our browser instances when the tests are finished.
    sequenceEnd: [
        {
            func: "{testEnvironment}.harness.browser.end"
        },
        {
            listener: "fluid.identity",
            event:    "{testEnvironment}.harness.browser.events.onEndComplete"
        }
    ]
});

// Caseholder for tests that include the API, lucene, etc.
fluid.defaults("gpii.ptd.api.tests.apiAndBrowser.caseHolder", {
    gradeNames: ["gpii.express.tests.caseHolder.base"],
    sequenceStart: [
        {
            func: "{testEnvironment}.events.constructHarness.fire"
        },
        {
            listener: "fluid.identity",
            event:    "{testEnvironment}.events.onHarnessReady"
        }
    ],
    sequenceEnd: [
        // Manually kill off our browser instances when the tests are finished.
        {
            func: "{testEnvironment}.harness.browser.end"
        },
        {
            listener: "fluid.identity",
            event: "{testEnvironment}.harness.browser.events.onEndComplete"
        },
        // Shutdown lucene as well
        {
            func: "{testEnvironment}.shutdownLucene"
        },
        {
            listener: "fluid.identity",
            event: "{testEnvironment}.events.onLuceneShutdownComplete"
        }
    ]
});