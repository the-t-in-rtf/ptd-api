"use strict";
var fluid = require("infusion");
fluid.setLogging(true);

var gpii  = fluid.registerNamespace("gpii");

require("./lib/test-harness.js");

gpii.ptd.api.tests.harness.api({
    ports: {
        express: 4985
    }
});