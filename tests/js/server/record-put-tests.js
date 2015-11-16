/*

    Tests for the PUT /api/record/:uniqueId endpoint

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

// TODO:  When we add support for versioning, we should disable it for these tests and test the version code separately

// TODO:  When we add support for attribution, we should test it

require("./lib");

fluid.defaults("gpii.ptd.api.tests.record.put.request", {
    gradeNames: ["gpii.ptd.api.tests.request"],
    endpoint:   "record",
    method:     "PUT"
});


fluid.defaults("gpii.ptd.api.tests.record.put.request.login", {
    gradeNames: ["gpii.ptd.api.tests.request"],
    endpoint:   "user/login",
    method:     "POST"
});

fluid.defaults("gpii.ptd.api.record.put.tests.caseHolder", {
    gradeNames:  ["gpii.ptd.api.tests.caseHolder"],
    userDetails: { username: "admin", password: "admin"},
    records: {
        existing: {
            "uniqueId":   "validRecord",
            "type":       "alias",
            "aliasOf":    "parent",
            "status":     "active",
            "updated":    "2014-05-22T10:01:33.655Z",
            "termLabel":  "A test term",
            "definition": "This is a sample term created for test purposes."
        },
        "new": {
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
                    name: "Try to PUT a record without logging in...",
                    type: "test",
                    sequence: [
                        {
                            func: "{anonymousPutRequest}.send",
                            args: ["{that}.options.records.existing"]
                        },
                        {
                            listener: "gpii.ptd.api.tests.testUtils.isExpectedResponse",
                            event: "{anonymousPutRequest}.events.onComplete",
                            // environment, error, response, body, statusCode, expected, notExpected
                            args: ["{testEnvironment}", null, "{anonymousPutRequest}.nativeResponse", "{arguments}.0", 401, { ok: false }]
                        }
                    ]
                },
                {
                    name: "Try to create a new record while logged in...",
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
                            func: "{loggedInPutRequest}.send",
                            args: ["{that}.options.records.new"]
                        },
                        {
                            listener: "gpii.ptd.api.tests.testUtils.isExpectedResponse",
                            event: "{loggedInPutRequest}.events.onComplete",
                            // environment, error, response, body, statusCode, expected, notExpected
                            args: ["{testEnvironment}", null, "{loggedInPutRequest}.nativeResponse", "{arguments}.0", 201, { ok: true }]
                        }
                    ]
                },
                {
                    name: "Try to update an existing record while logged in...",
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
                            func: "{loggedInPutRequest}.send",
                            args: ["{that}.options.records.valid"]
                        },
                        {
                            listener: "gpii.ptd.api.tests.testUtils.isExpectedResponse",
                            event: "{loggedInPutRequest}.events.onComplete",
                            // environment, error, response, body, statusCode, expected, notExpected
                            args: ["{testEnvironment}", null, "{loggedInPutRequest}.nativeResponse", "{arguments}.0", 201, { ok: true }]
                        }
                    ]
                },
                {
                    name: "Try to PUT an invalid record while logged in...",
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
                            func: "{invalidPutRequest}.send",
                            args: ["{that}.options.records.invalid"]
                        },
                        {
                            listener: "gpii.ptd.api.tests.testUtils.isExpectedResponse",
                            event: "{invalidPutRequest}.events.onComplete",
                            // environment, error, response, body, statusCode, expected, notExpected
                            args: ["{testEnvironment}", null, "{invalidPutRequest}.nativeResponse", "{arguments}.0", 400, { ok: false, fieldErrors: { "status": ["The review status of this record."], "updated": ["The date at which the record was last updated."]} }]
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
        anonymousPutRequest: {
            type: "gpii.ptd.api.tests.record.put.request"
        },
        loginRequest: {
            type: "gpii.ptd.api.tests.record.put.request.login"
        },
        loggedInPutRequest: {
            type: "gpii.ptd.api.tests.record.put.request"
        },
        invalidLoginRequest: {
            type: "gpii.ptd.api.tests.record.put.request.login"
        },
        invalidPutRequest: {
            type: "gpii.ptd.api.tests.record.put.request"
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
            type: "gpii.ptd.api.record.put.tests.caseHolder"
        }
    }
});
