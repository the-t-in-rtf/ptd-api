/*

    An instance of `kettle.request.http` that starts with a common baseURL and an endpoint.  This is designed to
    be used with a properly configured `testEnvironment` see this directory for an example.

 */
"use strict";
var fluid = require("infusion");

var kettle = require("kettle");
kettle.loadTestingSupport();

fluid.defaults("gpii.ptd.api.tests.request", {
    gradeNames: ["kettle.test.request.httpCookie"],
    path: {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["%baseUrl%endpoint", { baseUrl: "{testEnvironment}.options.urls.api", endpoint: "{that}.options.endpoint"}]
        }
    },
    headers: {
        accept: "application/json"
    },
    port: "{testEnvironment}.options.ports.express",
    method: "GET"
});