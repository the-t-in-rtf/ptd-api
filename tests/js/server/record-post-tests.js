/*

    Test POST /api/record endpoint.

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ctr.record.tests.post");

require("./lib");

// TODO:  When we add support for versions, we should disable it for these tests and test the version code separately

// TODO:  When we add support for attribution, we should test it

fluid.defaults("gpii.ptd.api.tests.record.post.request", {
    gradeNames: ["gpii.ptd.api.tests.request"],
    endpoint:   "record",
    method:     "POST"
});


fluid.defaults("gpii.ptd.api.tests.record.post.request.login", {
    gradeNames: ["gpii.ptd.api.tests.request"],
    endpoint:   "user/login",
    method:     "POST"
});

fluid.defaults("gpii.ptd.api.record.post.tests.caseHolder", {
    gradeNames:  ["gpii.ptd.api.tests.caseHolder"],
    userDetails: { username: "admin", password: "admin"},
    records: {
        valid:   {
            "uniqueId":   "validRecord",
            "type":       "alias",
            "aliasOf":    "parent",
            "status":     "active",
            "updated":    "2014-05-22T10:01:33.655Z",
            "termLabel":  "A test term",
            "definition": "This is a sample term created for test purposes."
        },
        invalid: {
            "uniqueId": " invalidRecord",
            "type":       "alias",
            "termLabel":  "A test alias with missing data.",
            "definition": "This record is missing an aliasOf field."
        },
        duplicate: {
            "uniqueId":   "6DotComputerBrailleTable",
            "updated":    "2014-05-22T10:01:33.655Z",
            "status":     "active",
            "type":       "term",
            "termLabel":  "This part doesn't matter, as the uniqueId is already in use.",
            "definition": "This part also doesn't matter."
        }
    },
    rawModules: [
        {
            tests: [
                {
                    name: "Try to POST a new record without logging in...",
                    type: "test",
                    sequence: [
                        {
                            func: "{anonymousPostRequest}.send",
                            args: ["{that}.options.records.valid"]
                        },
                        {
                            listener: "gpii.ptd.api.tests.testUtils.isExpectedResponse",
                            event: "{anonymousPostRequest}.events.onComplete",
                            // environment, error, response, body, statusCode, expected, notExpected
                            args: ["{testEnvironment}", null, "{anonymousPostRequest}.nativeResponse", "{arguments}.0", 401, { ok: false }]
                        }
                    ]
                },
                {
                    name: "Try to POST a valid record while logged in...",
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
                            func: "{loggedInPostRequest}.send",
                            args: ["{that}.options.records.valid"]
                        },
                        {
                            listener: "gpii.ptd.api.tests.testUtils.isExpectedResponse",
                            event: "{loggedInPostRequest}.events.onComplete",
                            // environment, error, response, body, statusCode, expected, notExpected
                            args: ["{testEnvironment}", null, "{loggedInPostRequest}.nativeResponse", "{arguments}.0", 201, { ok: true }]
                        }
                    ]
                },
                {
                    name: "Try to POST a duplicate record while logged in...",
                    type: "test",
                    sequence: [
                        {
                            func: "{duplicateLoginRequest}.send",
                            args: ["{that}.options.userDetails"]
                        },
                        {
                            listener: "fluid.identity",
                            event:    "{duplicateLoginRequest}.events.onComplete"
                        },
                        {
                            func: "{duplicatePostRequest}.send",
                            args: ["{that}.options.records.duplicate"]
                        },
                        {
                            listener: "gpii.ptd.api.tests.testUtils.isExpectedResponse",
                            event: "{duplicatePostRequest}.events.onComplete",
                            // environment, error, response, body, statusCode, expected, notExpected
                            args: ["{testEnvironment}", null, "{duplicatePostRequest}.nativeResponse", "{arguments}.0", 409, { ok: false }]
                        }
                    ]
                },
                {
                    name: "Try to POST an invalid record while logged in...",
                    type: "test",
                    sequence: [
                        {
                            func: "{invalidLoginRequest}.send",
                            args: ["{that}.options.userDetails"]
                        },
                        {
                            listener: "fluid.identity",
                            event:    "{invalidLoginRequest}.events.onComplete"
                        },
                        {
                            func: "{invalidPostRequest}.send",
                            args: ["{that}.options.records.invalid"]
                        },
                        {
                            listener: "gpii.ptd.api.tests.testUtils.isExpectedResponse",
                            event: "{invalidPostRequest}.events.onComplete",
                            // environment, error, response, body, statusCode, expected, notExpected
                            args: ["{testEnvironment}", null, "{invalidPostRequest}.nativeResponse", "{arguments}.0", 400, { ok: false, fieldErrors: { "status": ["The review status of this record."], "updated": ["The date at which the record was last updated."]} }]
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
        anonymousPostRequest: {
            type: "gpii.ptd.api.tests.record.post.request"
        },
        loginRequest: {
            type: "gpii.ptd.api.tests.record.post.request.login"
        },
        loggedInPostRequest: {
            type: "gpii.ptd.api.tests.record.post.request"
        },
        duplicateLoginRequest: {
            type: "gpii.ptd.api.tests.record.post.request.login"
        },
        duplicatePostRequest: {
            type: "gpii.ptd.api.tests.record.post.request"
        },
        invalidLoginRequest: {
            type: "gpii.ptd.api.tests.record.post.request.login"
        },
        invalidPostRequest: {
            type: "gpii.ptd.api.tests.record.post.request"
        }
    }
});

gpii.ptd.api.tests.testEnvironment.loadsViewsOnStartup({
    ports: {
        api:    9686,
        couch:  6787,
        lucene: 6363,
        mail:   7725
    },
    components: {
        testCaseHolder: {
            type: "gpii.ptd.api.record.post.tests.caseHolder"
        }
    }
});
