/*

    A set of functions for use with Nightmare's `evaluate` function and the `initBlock` helper.  These are designed to
    be wired into a test case as in the following examples.  For a function that doesn't take an argument, the sequence
    would look something like:

    {
        func: "{gpii.tests.browser.environment}.browser.evaluate",
        args: [gpii.ul.api.tests.getPageComponentModel]
    },
    {
        listener: "jqUnit.assertEquals",
        event:    "{gpii.tests.browser.environment}.browser.events.onEvaluateComplete",
        args:     ["The model should be as expected...", { foo: "bar" }, "{arguments}.0"]
    }

    For a function that takes an argument, the sequence would look something like:

    {
        func: "{gpii.tests.browser.environment}.browser.evaluate",
        args: [gpii.ul.api.tests.getChildModel, "child1"]
    },
    {
        listener: "jqUnit.assertEquals",
        event:    "{gpii.tests.browser.environment}.browser.events.onEvaluateComplete",
        args:     ["The model should be as expected...", { foo: "bar" }, "{arguments}.0"]
    }

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.ul.api.tests");

// Function to return the current model for the main page component created by the `initBlock` helper..
gpii.ul.api.tests.getPageComponentModel = function () {
    return pageComponent.requireRenderer.pageComponent.model;
};

// Function to return the model for the named child of the main page component created by the `initBlock` helper..
gpii.ul.api.tests.getChildModel = function (name) {
    return pageComponent.requireRenderer.pageComponent[name].model;
};

gpii.ul.api.tests.applyChangeToPageComponent = function (path, value) {
    return pageComponent.applier.change(path, value);
};