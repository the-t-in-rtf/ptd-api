"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./server/test-harness.js");

gpii.ptd.api.tests.harness({
    apiPort:    4985,
    lucenePort: 9485,
    pouchPort:  5894,
    mailPort:   9854
});