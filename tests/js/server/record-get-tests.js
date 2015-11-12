// Tests for GET /api/record
//
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.setLogging(true);

require("./lib");

var jqUnit = require("node-jqunit");

fluid.registerNamespace("gpii.ptd.api.record.get.tests.caseHolder");

// Verify that we receive an appropriate response when no record is available.
gpii.ptd.api.record.get.tests.caseHolder.verifyNotFound = function (environment, response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(environment, null, response, body, 404);
};
// Verify that we receive an appropriate response when we omit the `uniqueId`.
gpii.ptd.api.record.get.tests.caseHolder.verifyBadSyntax = function (environment, response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(environment, null, response, body, 400);
};

// We will use this to verify that appropriate is returned for all cases that return a record.
gpii.ptd.api.record.get.tests.caseHolder.verifyRecord = function (environment, response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(environment, null, response, body);

    jqUnit.assertEquals("The request should have been successful...", 200, response.statusCode);

    var jsonData = JSON.parse(body);
    jqUnit.assertNotNull("There should be record data returned...", jsonData.record);

    if (jsonData.record) {
        gpii.ptd.api.tests.testUtils.isSaneRecord(environment, jsonData.record);
    }
};

gpii.ptd.api.record.get.tests.caseHolder.verifyHasChildren = function (environment, response, body) {
    gpii.ptd.api.record.get.tests.caseHolder.verifyRecord(response, body);

    var jsonData = JSON.parse(body);
    jqUnit.assertTrue("The record returned should have child data...", jsonData.record.aliases.length > 0);
};

gpii.ptd.api.record.get.tests.caseHolder.verifyHasNoChildren = function (environment, response, body) {
    gpii.ptd.api.record.get.tests.caseHolder.verifyRecord(environment, response, body);

    var jsonData = JSON.parse(body);
    jqUnit.assertNoValue("The record returned should not have child data...", jsonData.record.aliases);
};

fluid.defaults("gpii.ptd.api.record.get.tests.caseHolder", {
    gradeNames: ["gpii.ptd.api.tests.caseHolder"],
    rawModules: [
        {
            tests: [
                {
                    name: "Testing leaving out the uniqueId...",
                    type: "test",
                    sequence: [
                        {
                            func: "{missingDataRequest}.send"
                        },
                        {
                            listener: "gpii.ptd.api.record.get.tests.caseHolder.verifyBadSyntax",
                            event: "{missingDataRequest}.events.onComplete",
                            args: ["{testEnvironment}", "{missingDataRequest}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing retrieving a record by its uniqueId...",
                    type: "test",
                    sequence: [
                        {
                            func: "{simpleRecordRequest}.send"
                        },
                        {
                            listener: "gpii.ptd.api.record.get.tests.caseHolder.verifyRecord",
                            event: "{simpleRecordRequest}.events.onComplete",
                            args: ["{testEnvironment}", "{simpleRecordRequest}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing using a uniqueId that doesn't exist...",
                    type: "test",
                    sequence: [
                        {
                            func: "{missingRecordRequest}.send"
                        },
                        {
                            listener: "gpii.ptd.api.record.get.tests.caseHolder.verifyNotFound",
                            event: "{missingRecordRequest}.events.onComplete",
                            args: ["{testEnvironment}", "{missingRecordRequest}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing retrieving a record with a space in its uniqueId...",
                    type: "test",
                    sequence: [
                        {
                            func: "{spaceRequest}.send"
                        },
                        {
                            listener: "gpii.ptd.api.record.get.tests.caseHolder.verifyRecord",
                            event: "{spaceRequest}.events.onComplete",
                            args: ["{testEnvironment}", "{spaceRequest}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing retrieving an alias with the `children` option set to true...",
                    type: "test",
                    sequence: [
                        {
                            func: "{aliasWithChildrenRequest}.send"
                        },
                        {
                            listener: "gpii.ptd.api.record.get.tests.caseHolder.verifyHasNoChildren",
                            event: "{aliasWithChildrenRequest}.events.onComplete",
                            args: ["{testEnvironment}", "{aliasWithChildrenRequest}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing retrieving a term with the `children` option set to true...",
                    type: "test",
                    sequence: [
                        {
                            func: "{termWithChildrenRequest}.send"
                        },
                        {
                            listener: "gpii.ptd.api.record.get.tests.caseHolder.verifyHasChildren",
                            event: "{termWithChildrenRequest}.events.onComplete",
                            args: ["{testEnvironment}", "{termWithChildrenRequest}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing retrieving a term with the `children` option set to false...",
                    type: "test",
                    sequence: [
                        {
                            func: "{termWithoutChildrenRequest}.send"
                        },
                        {
                            listener: "gpii.ptd.api.record.get.tests.caseHolder.verifyHasNoChildren",
                            event: "{termWithoutChildrenRequest}.events.onComplete",
                            args: ["{testEnvironment}", "{termWithoutChildrenRequest}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        missingDataRequest: {
            type: "gpii.ptd.api.tests.request",
            options: {
                endpoint: ""
            }
        },
        simpleRecordRequest: {
            type: "gpii.ptd.api.tests.request",
            options: {
                endpoint: "6DotComputerBrailleTable"
            }
        },
        missingRecordRequest: {
            type: "gpii.ptd.api.tests.request",
            options: {
                endpoint: "notGonnaFindThisOne"
            }
        },
        termWithChildrenRequest: {
            type: "gpii.ptd.api.tests.request",
            options: {
                endpoint: "6DotComputerBrailleTable?children=true"
            }
        },
        termWithoutChildrenRequest: {
            type: "gpii.ptd.api.tests.request",
            options: {
                endpoint: "6DotComputerBrailleTable?children=false"
            }
        },
        aliasWithChildrenRequest: {
            type: "gpii.ptd.api.tests.request",
            options: {
                endpoint: "AbsolutePointing?children=true"
            }
        },
        spaceRequest: {
            type: "gpii.ptd.api.tests.request",
            options: {
                endpoint: "absolute%20pointing"
            }
        }
    }
});

// Some tests can get away without taking the time to preload views.  These will time out if you don't use the alternate grade.
//
gpii.ptd.api.tests.testEnvironment.loadsViewsOnStartup({
    ports: {
        api:    9686,
        couch:  6787,
        lucene: 6363,
        mail:   7725
    },
    components: {
        testCaseHolder: {
            type: "gpii.ptd.api.record.get.tests.caseHolder"
        }
    }
});