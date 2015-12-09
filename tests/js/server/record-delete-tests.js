/*

    Tests for the DELETE /api/record/:uniqueId endpoint

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../lib");

// TODO:  When we add support for attribution, we should test it here as well

fluid.defaults("gpii.ptd.api.tests.record.delete.request", {
    gradeNames: ["gpii.ptd.api.tests.request"],
    method:     "DELETE"
});


fluid.defaults("gpii.ptd.api.tests.record.delete.request.login", {
    gradeNames: ["gpii.ptd.api.tests.request"],
    endpoint:   "user/login",
    method:     "POST"
});

fluid.defaults("gpii.ptd.api.record.delete.tests.caseHolder", {
    gradeNames:  ["gpii.ptd.api.tests.apiAndBrowser.caseHolder"],
    userDetails: { username: "admin", password: "admin"},
    rawModules: [
        {
            tests: [
                {
                    name: "Try to DELETE a record without logging in...",
                    type: "test",
                    sequence: [
                        {
                            func: "{anonymousDeleteRequest}.send"
                        },
                        {
                            listener: "gpii.ptd.api.tests.testUtils.isExpectedResponse",
                            event: "{anonymousDeleteRequest}.events.onComplete",
                            // environment, error, response, body, statusCode, expected, notExpected
                            args: ["{testEnvironment}", null, "{anonymousDeleteRequest}.nativeResponse", "{arguments}.0", 401, { ok: false }]
                        }
                    ]
                },
                {
                    name: "Try to DELETE an existing record while logged in...",
                    type: "test",
                    sequence: [
                        {
                            func: "{loginRequest}.send",
                            args: ["{that}.options.userDetails"]
                        },
                        {
                            listener: "fluid.identity",
                            event:    "{loginRequest}.events.onComplete"
                        },
                        {
                            func: "{loggedInDeleteRequest}.send"
                        },
                        {
                            listener: "gpii.ptd.api.tests.testUtils.isExpectedResponse",
                            event: "{loggedInDeleteRequest}.events.onComplete",
                            // environment, error, response, body, statusCode, expected, notExpected
                            args: ["{testEnvironment}", null, "{loggedInDeleteRequest}.nativeResponse", "{arguments}.0", 201, { ok: true }]
                        }
                    ]
                },
                {
                    name: "Try to DELETE a record that doesn't exist while logged in...",
                    type: "test",
                    sequence: [
                        {
                            func: "{missingLoginRequest}.send",
                            args: ["{that}.options.userDetails"]
                        },
                        {
                            listener: "fluid.identity",
                            event:    "{missingLoginRequest}.events.onComplete"
                        },
                        {
                            func: "{missingDeleteRequest}.send"
                        },
                        {
                            listener: "gpii.ptd.api.tests.testUtils.isExpectedResponse",
                            event: "{missingDeleteRequest}.events.onComplete",
                            // environment, error, response, body, statusCode, expected, notExpected
                            args: ["{testEnvironment}", null, "{missingDeleteRequest}.nativeResponse", "{arguments}.0", 404, { ok: false }]
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        cookieJar: {
            type: "kettle.test.cookieJar"
        },
        anonymousDeleteRequest: {
            type: "gpii.ptd.api.tests.record.delete.request",
            options: {
                endpoint: "record/6DotComputerBrailleTable"
            }
        },
        loginRequest: {
            type: "gpii.ptd.api.tests.record.delete.request.login"
        },
        loggedInDeleteRequest: {
            type: "gpii.ptd.api.tests.record.delete.request",
            options: {
                endpoint: "record/6DotComputerBrailleTable"
            }
        },
        missingLoginRequest: {
            type: "gpii.ptd.api.tests.record.delete.request.login"
        },
        missingDeleteRequest: {
            type: "gpii.ptd.api.tests.record.delete.request",
            options: {
                endpoint: "record/notFoundAtAll"
            }
        }
    }
});

gpii.ptd.api.tests.apiAndBrowser.testEnvironment({
    ports: {
        express: 9685,
        couch:   6786,
        lucene:  6362,
        mail:    7025
    },
    components: {
        testCaseHolder: {
            type: "gpii.ptd.api.record.delete.tests.caseHolder"
        }
    }
});
