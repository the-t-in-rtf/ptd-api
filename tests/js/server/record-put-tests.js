/*

    Tests for the PUT /api/record/:uniqueId endpoint

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

// TODO:  When we add support for versioning, we should disable it for these tests and test the version code separately

// TODO:  When we add support for attribution, we should test it

require("../lib");

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
    gradeNames:  ["gpii.ptd.api.tests.apiAndBrowser.caseHolder"],
    userDetails: { username: "admin", password: "admin"},
    records: {
        validExisting: {
            uniqueId:   "AbsolutePointing",
            type:       "alias",
            aliasOf:    "parent",
            status:     "active",
            termLabel:  "A test term",
            definition: "This is a sample term created for test purposes."
        },
        validNew: {
            uniqueId:   "validNew",
            type:       "alias",
            aliasOf:    "parent",
            status:     "active",
            termLabel:  "A test term",
            definition: "This is a sample term created for test purposes."
        },
        invalidNew: {
            uniqueId:   "invalidNew",
            type:       "alias",
            termLabel:  "A test alias with missing data.",
            definition: "This record is missing an aliasOf field."
        },
        invalidExisting: {
            uniqueId:   "AbsolutePointing",
            type:       "alias",
            termLabel:  "A test alias with missing data.",
            definition: "This record is missing an aliasOf field."
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
                            args: ["{that}.options.records.validExisting"]
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
                    name: "Try to create a valid new record while logged in...",
                    type: "test",
                    sequence: [
                        {
                            func: "{validNewLoginRequest}.send",
                            args: ["{that}.options.userDetails"]
                        },
                        {
                            listener: "fluid.identity",
                            event:    "{validNewLoginRequest}.events.onComplete"
                        },
                        {
                            func: "{validNewPutRequest}.send",
                            args: ["{that}.options.records.validNew"]
                        },
                        {
                            listener: "gpii.ptd.api.tests.testUtils.isExpectedResponse",
                            event: "{validNewPutRequest}.events.onComplete",
                            // environment, error, response, body, statusCode, expected, notExpected
                            args: ["{testEnvironment}", null, "{validNewPutRequest}.nativeResponse", "{arguments}.0", 201, { ok: true }]
                        }
                    ]
                },
                {
                    name: "Try to update an valid existing record while logged in...",
                    type: "test",
                    sequence: [
                        {
                            func: "{validExistingLoginRequest}.send",
                            args: ["{that}.options.userDetails"]
                        },
                        {
                            listener: "fluid.identity",
                            event:    "{validExistingLoginRequest}.events.onComplete"
                        },
                        {
                            func: "{validExistingPutRequest}.send",
                            args: ["{that}.options.records.validExisting"]
                        },
                        {
                            listener: "gpii.ptd.api.tests.testUtils.isExpectedResponse",
                            event: "{validExistingPutRequest}.events.onComplete",
                            // environment, error, response, body, statusCode, expected, notExpected
                            args: ["{testEnvironment}", null, "{validExistingPutRequest}.nativeResponse", "{arguments}.0", 201, { ok: true }]
                        }
                    ]
                },
                {
                    name: "Try to PUT an invalid new record while logged in...",
                    type: "test",
                    sequence: [
                        {
                            func: "{invalidNewLoginRequest}.send",
                            args: ["{that}.options.userDetails"]
                        },
                        {
                            listener: "fluid.identity",
                            event:    "{invalidNewLoginRequest}.events.onComplete"
                        },
                        {
                            func: "{invalidNewPutRequest}.send",
                            args: ["{that}.options.records.invalidNew"]
                        },
                        {
                            listener: "gpii.ptd.api.tests.testUtils.isExpectedResponse",
                            event: "{invalidNewPutRequest}.events.onComplete",
                            // environment, error, response, body, statusCode, expected, notExpected
                            args: ["{testEnvironment}", null, "{invalidNewPutRequest}.nativeResponse", "{arguments}.0", 400, { ok: false, fieldErrors: { status: ["The review status of this record must be unreviewed, candidate, active, draft, or deleted."]} }]
                        }
                    ]
                },
                {
                    name: "Try to PUT an invalid existing record while logged in...",
                    type: "test",
                    sequence: [
                        {
                            func: "{invalidExistingLoginRequest}.send",
                            args: ["{that}.options.userDetails"]
                        },
                        {
                            listener: "fluid.identity",
                            event:    "{invalidExistingLoginRequest}.events.onComplete"
                        },
                        {
                            func: "{invalidExistingPutRequest}.send",
                            args: ["{that}.options.records.invalidExisting"]
                        },
                        {
                            listener: "gpii.ptd.api.tests.testUtils.isExpectedResponse",
                            event: "{invalidExistingPutRequest}.events.onComplete",
                            // environment, error, response, body, statusCode, expected, notExpected
                            args: ["{testEnvironment}", null, "{invalidExistingPutRequest}.nativeResponse", "{arguments}.0", 400, { ok: false, fieldErrors: { status: ["The review status of this record must be unreviewed, candidate, active, draft, or deleted."]} }]
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
        validNewLoginRequest: {
            type: "gpii.ptd.api.tests.record.put.request.login"
        },
        validNewPutRequest: {
            type: "gpii.ptd.api.tests.record.put.request",
            options: {
                endpoint: "record/validNew"
            }
        },
        validExistingLoginRequest: {
            type: "gpii.ptd.api.tests.record.put.request.login"
        },
        validExistingPutRequest: {
            type: "gpii.ptd.api.tests.record.put.request",
            options: {
                endpoint: "record/AbsolutePointing"
            }
        },
        invalidNewLoginRequest: {
            type: "gpii.ptd.api.tests.record.put.request.login"
        },
        invalidNewPutRequest: {
            type: "gpii.ptd.api.tests.record.put.request",
            options: {
                endpoint: "record/invalidNew"
            }
        },
        invalidExistingLoginRequest: {
            type: "gpii.ptd.api.tests.record.put.request.login"
        },
        invalidExistingPutRequest: {
            type: "gpii.ptd.api.tests.record.put.request",
            options: {
                endpoint: "record/AbsolutePointing"
            }
        }
    }
});

gpii.ptd.api.tests.apiAndBrowser.testEnvironment({
    ports: {
        express: 9686,
        couch:   6787,
        lucene:  6363,
        mail:    7725
    },
    components: {
        testCaseHolder: {
            type: "gpii.ptd.api.record.put.tests.caseHolder"
        }
    }
});
