// Utility functions for common sanity checks in unit tests
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

fluid.registerNamespace("gpii.ptd.api.tests.testUtils");
gpii.ptd.api.tests.testUtils.isSaneRecord = function isSaneRecord(environment, record) {
    jqUnit.assertNotNull("Record should not be null...", record);

    if (record) {
        jqUnit.assertNotNull("Record type should not be null...", record.type);

        if (record.type) {

            var errors = environment.harness.validator.validate(record.type + ".json", record);
            jqUnit.assertUndefined("There should not be any validation errors:" + JSON.stringify(errors), errors);
        }
    }
};

gpii.ptd.api.tests.testUtils.isSaneResponse = function isSaneResponse(environment, error, response, body) {
    jqUnit.assertNull("No errors should be returned...", error);
    jqUnit.assertNotNull("A response should be returned...", response);
    jqUnit.assertNotNull("The request should include a return code...", response.statusCode);
    jqUnit.assertNotNull("A body should be returned...", body);

    // Additions in support of associating JSON Schemas with all results
    var contentTypeHeader = response.headers["content-type"];
    jqUnit.assertNotNull("A response should have a 'Content-Type' header...", contentTypeHeader);
    if (contentTypeHeader) {
        jqUnit.assertTrue("The 'Content-Type' header should contain a 'profile' link...", contentTypeHeader.indexOf("profile") !== -1);
        jqUnit.assertTrue("The 'Content-Type' header should follow the 'type+json' pattern...", contentTypeHeader.indexOf("+json") !== -1);
    }

    var linkHeader = response.headers.link;
    jqUnit.assertNotNull("A response should have a 'Link' header...", linkHeader);
    if (linkHeader) {
        jqUnit.assertTrue("The 'Link' header should contain a URL...", linkHeader.indexOf("http") !== -1);
        jqUnit.assertTrue("The 'Link' header should indicate that the link describes the record format...", linkHeader.indexOf("describedBy") !== -1);
    }

    var jsonData = JSON.parse(body);
    jqUnit.assertNotNull("The 'ok' variable should always be set...", jsonData.ok);
};
