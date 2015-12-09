// Tests for the PTD search API
//
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../lib");

var jqUnit = require("node-jqunit");

fluid.registerNamespace("gpii.ptd.api.search.tests.caseHolder");

gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse = function (environment, response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(environment, null, response, body);

    jqUnit.assertEquals("The request should have been successful...", response.statusCode, 200);

    var jsonData = JSON.parse(body);
    jqUnit.assertTrue("The total number of rows returned should be greater than zero...", jsonData.total_rows > 0);

    jqUnit.assertTrue("There should be at least one record...", jsonData.records && jsonData.records.length > 0);
    gpii.ptd.api.tests.testUtils.isSaneRecord(environment, jsonData.records && jsonData.records[0] ? jsonData.records[0] : null);
};

gpii.ptd.api.search.tests.caseHolder.verifyEmptySearchResponse = function (environment, response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(environment, null, response, body);

    jqUnit.assertEquals("The request should not have been successful...", response.statusCode, 400);

    var data = (typeof body === "string") ? JSON.parse(body) : body;
    jqUnit.assertEquals("The response should not have been 'ok'...", false, data.ok);
    jqUnit.assertNotUndefined("There should have been an error message...", data.message);
    jqUnit.assertUndefined("There should not have been any records returns...", data.records);
};

gpii.ptd.api.search.tests.caseHolder.verifyImpossibleSearchResponse = function (environment, response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(environment, null, response, body);

    jqUnit.assertEquals("The request should have been successful...", response.statusCode, 200);

    var jsonData = JSON.parse(body);
    jqUnit.assertEquals("The total number of rows returned should be zero...", 0, jsonData.total_rows);

    jqUnit.assertDeepEq("There should not be any records...", [], jsonData.records);
};

gpii.ptd.api.search.tests.caseHolder.verifyLimitedResponse = function (environment, response, body) {
    gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse(environment, response, body);

    var jsonData = JSON.parse(body);
    jqUnit.assertEquals("The total number of records should equal the limit...", 5, jsonData.records.length);
};

gpii.ptd.api.search.tests.caseHolder.verifyFirstPagingResponse = function (environment, responseObject, response, body) {
    gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse(environment, response, body);

    var data = typeof body === "string" ? JSON.parse(body) : body;

    // Hold on to the first record we received for later comparison.
    responseObject.record = data.records[0];
};

gpii.ptd.api.search.tests.caseHolder.verifySecondPagingResponse = function (environment, firstResponseObject, response, body) {
    gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse(environment, response, body);

    var data = typeof body === "string" ? JSON.parse(body) : body;
    var secondRecord = data.records[data.records.length - 1];

    // Our last record should match the previously saved record.
    jqUnit.assertDeepEq("Pages of search results that overlap should contain the same record...", firstResponseObject.record, secondRecord);
};

gpii.ptd.api.search.tests.caseHolder.verifyFirstSortingResponse = function (environment, responseObject, response, body) {
    gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse(environment, response, body);

    var data = typeof body === "string" ? JSON.parse(body) : body;

    // Hold on to the first record we received for later comparison.
    responseObject.record = data.records[0];
};

gpii.ptd.api.search.tests.caseHolder.verifySecondSortingResponse = function (environment, firstResponseObject, response, body) {
    gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse(environment, response, body);

    var data = typeof body === "string" ? JSON.parse(body) : body;

    // Our first record should not match the previously saved record.
    jqUnit.assertDeepNeq("Records sorted A-Z should not match records sorted Z-A...", firstResponseObject.record, data.records[0]);
};

gpii.ptd.api.search.tests.caseHolder.verifyFirstQualifiedResponse = function (environment, responseObject, response, body) {
    gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse(environment, response, body);

    var data = typeof body === "string" ? JSON.parse(body) : body;

    // Hold on to the first record we received for later comparison.
    responseObject.records = data.records;
};

gpii.ptd.api.search.tests.caseHolder.verifySecondQualifiedResponse = function (environment, firstResponseObject, response, body) {
    gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse(environment, response, body);

    var data = typeof body === "string" ? JSON.parse(body) : body;

    jqUnit.assertTrue("A search limited by field should return less results than a search that is unlimited...", firstResponseObject.records.length > data.records.length);

    data.records.forEach(function (record) {
        // The match could be in the record itself or in a child, but should be in one or the other.
        var hasSearchTerm = record.termLabel && record.termLabel.toLowerCase().indexOf("comp") !== -1;

        if (!hasSearchTerm && record.aliases) {
            fluid.each(record.aliases, function (alias) {
                if (!hasSearchTerm) {
                    hasSearchTerm = alias.termLabel && alias.termLabel.toLowerCase().indexOf("comp") !== -1;
                }
            });
        }

        jqUnit.assertTrue("Either the record or one of its aliases should contain the search term in the right field...", hasSearchTerm);
    });
};

// Wire in an instance of kettle.requests.request.http for each test and wire the check to its onError or onSuccess event
fluid.defaults("gpii.ptd.api.search.tests.caseHolder", {
    gradeNames: ["gpii.ptd.api.tests.apiAndBrowser.caseHolder"],
    rawModules: [
        {
            tests: [
                {
                    name: "Testing simple searching...",
                    type: "test",
                    sequence: [
                        {
                            func: "{searchWithOnlyQuery}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse",
                            event: "{searchWithOnlyQuery}.events.onComplete",
                            args: ["{testEnvironment}", "{searchWithOnlyQuery}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing searching with no query...",
                    type: "test",
                    sequence: [
                        {
                            func: "{searchWithoutQuery}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifyEmptySearchResponse",
                            event: "{searchWithoutQuery}.events.onComplete",
                            args: ["{testEnvironment}", "{searchWithoutQuery}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing searching with a nonsense query that should not match anything...",
                    type: "test",
                    sequence: [
                        {
                            func: "{searchWithImpossibleQuery}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifyImpossibleSearchResponse",
                            event: "{searchWithImpossibleQuery}.events.onComplete",
                            args: ["{testEnvironment}", "{searchWithImpossibleQuery}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing searching with a limited number of responses...",
                    type: "test",
                    sequence: [
                        {
                            func: "{searchWithLimit}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifyLimitedResponse",
                            event: "{searchWithLimit}.events.onComplete",
                            args: ["{testEnvironment}", "{searchWithLimit}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing paging...",
                    type: "test",
                    sequence: [
                        {
                            func: "{firstSearchWithPaging}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifyFirstPagingResponse",
                            event: "{firstSearchWithPaging}.events.onComplete",
                            args: ["{testEnvironment}", "{firstSearchWithPaging}", "{firstSearchWithPaging}.nativeResponse", "{arguments}.0"]
                        },
                        {
                            func: "{secondSearchWithPaging}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifySecondPagingResponse",
                            event: "{secondSearchWithPaging}.events.onComplete",
                            args: ["{testEnvironment}", "{firstSearchWithPaging}", "{secondSearchWithPaging}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing sorting...",
                    type: "test",
                    sequence: [
                        {
                            func: "{firstSearchWithSorting}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifyFirstSortingResponse",
                            event: "{firstSearchWithSorting}.events.onComplete",
                            args: ["{testEnvironment}", "{firstSearchWithSorting}", "{firstSearchWithSorting}.nativeResponse", "{arguments}.0"]
                        },
                        {
                            func: "{secondSearchWithSorting}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifySecondSortingResponse",
                            event: "{secondSearchWithSorting}.events.onComplete",
                            args: ["{testEnvironment}", "{firstSearchWithSorting}", "{secondSearchWithSorting}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing field qualifiers...",
                    type: "test",
                    sequence: [
                        {
                            func: "{firstSearchWithQualifiers}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifyFirstQualifiedResponse",
                            event: "{firstSearchWithQualifiers}.events.onComplete",
                            args: ["{testEnvironment}", "{firstSearchWithQualifiers}", "{firstSearchWithQualifiers}.nativeResponse", "{arguments}.0"]
                        },
                        {
                            func: "{secondSearchWithQualifiers}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifySecondQualifiedResponse",
                            event: "{secondSearchWithQualifiers}.events.onComplete",
                            args: ["{testEnvironment}", "{firstSearchWithQualifiers}", "{secondSearchWithQualifiers}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                }
            ]
        }
    ],
    /*

         We need to have searches with multiple records to test paging and limits.  Here are a few sample record counts
         of common search terms at time of writing:

         android:  5
         braille:  10
         computer: 6
         keyboard: 14

     */
    components: {
        searchWithOnlyQuery: {
            type: "gpii.ptd.api.tests.request",
            options: {
                endpoint: "search?q=android"
            }
        },
        searchWithoutQuery: {
            type: "gpii.ptd.api.tests.request",
            options: {
                endpoint: "search"
            }
        },
        searchWithImpossibleQuery: {
            type: "gpii.ptd.api.tests.request",
            options: {
                endpoint: "search?q=flibbertygibbit"
            }
        },
        searchWithLimit: {
            type: "gpii.ptd.api.tests.request",
            options: {
                endpoint: "search?q=braille&limit=5"
            }
        },
        firstSearchWithPaging: {
            type: "gpii.ptd.api.tests.request",
            options: {
                endpoint: "/search?q=keyboard&offset=9&limit=1"
            }
        },
        secondSearchWithPaging: {
            type: "gpii.ptd.api.tests.request",
            options: {
                endpoint: "search?q=keyboard&limit=10"
            }
        },
        firstSearchWithSorting: {
            type: "gpii.ptd.api.tests.request",
            options: {
                endpoint: "search?q=keyboard&sort=definition"
            }
        },
        secondSearchWithSorting: {
            type: "gpii.ptd.api.tests.request",
            options: {
                endpoint: "search?q=keyboard&sort=%5cdefinition"
            }
        },
        firstSearchWithQualifiers: {
            type: "gpii.ptd.api.tests.request",
            options: {
                endpoint: "search?q=computer"
            }
        },
        secondSearchWithQualifiers: {
            type: "gpii.ptd.api.tests.request",
            options: {
                endpoint: "search?q=termLabel:computer"
            }
        }
    }
});

gpii.ptd.api.tests.apiAndBrowser.testEnvironment({
    ports: {
        express: 9776,
        couch:   6977,
        lucene:  8676,
        mail:    7325
    },
    components: {
        testCaseHolder: {
            type: "gpii.ptd.api.search.tests.caseHolder"
        }
    }
});