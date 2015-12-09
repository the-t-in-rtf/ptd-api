"use strict";
var fluid = require("infusion");
fluid.setLogging(true);

var gpii  = fluid.registerNamespace("gpii");

require("./lib/test-harness");

gpii.ptd.api.tests.harness.loadsViewsOnStartup({
    ports: {
        api:    4985,
        lucene: 9485,
        couch:  5894,
        mail:   9854
    }
});