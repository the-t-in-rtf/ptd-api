"use strict";
var fluid = require("infusion");
fluid.setLogging(true);

var gpii  = fluid.registerNamespace("gpii");

require("./server/lib/test-harness.js");

gpii.ptd.api.tests.harness.loadsViewsOnStartup({
    ports: {
        api:    4985,
        lucene: 9485,
        couch:  5894,
        mail:   9854
    }
});