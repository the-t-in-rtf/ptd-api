/*

    Test the "picker" component in isolation from the full API.  Requires the "lightweight" express harness.

    There are two pickers on the test page to confirm that:

    1. It's possible to have multiple pickers at the same time.
    2. The picker works whether or not it has data when it is created.

 */
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-test-browser");
gpii.tests.browser.loadTestingSupport();

require("../lib/test-environment");
require("../lib/test-harness");
require("../lib/test-caseholder");

fluid.defaults("gpii.ul.api.frontend.tests.picker", {
    gradeNames: ["gpii.ptd.api.tests.expressAndBrowser.caseHolder"],
    testUrl: {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["%baseUrl%path", { baseUrl: "{testEnvironment}.options.urls.express", path: "dispatcher/picker"}]
        }
    },
    rawModules: [{
        tests: [
            {
                name: "The picker's bits should have the right visibility on startup...",
                sequence: [
                    {
                        func: "{testEnvironment}.harness.browser.goto",
                        args: ["{that}.options.testUrl"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onLoaded",
                        listener: "{testEnvironment}.harness.browser.visible",
                        args:     [".new-picker-viewport .picker-view"]
                    },
                    {
                        event:     "{testEnvironment}.harness.browser.events.onVisibleComplete",
                        listener: "jqUnit.assertEquals",
                        args:      ["The view pane should be visible...", true, "{arguments}.0"]
                    },
                    {
                        func: "{testEnvironment}.harness.browser.visible",
                        args:     [".new-picker-viewport .picker-edit"]
                    },
                    {
                        event:     "{testEnvironment}.harness.browser.events.onVisibleComplete",
                        listener: "jqUnit.assertEquals",
                        args:      ["The edit pane should not be visible...", false, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "The edit button should reveal the picker form...",
                sequence: [
                    {
                        func: "{testEnvironment}.harness.browser.goto",
                        args: ["{that}.options.testUrl"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onLoaded",
                        listener: "{testEnvironment}.harness.browser.click",
                        args:     [".new-picker-viewport .ptd-icon-edit"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onClickComplete",
                        listener: "{testEnvironment}.harness.browser.visible",
                        args:     [".new-picker-viewport .picker-view"]
                    },
                    {
                        event:     "{testEnvironment}.harness.browser.events.onVisibleComplete",
                        listener: "jqUnit.assertEquals",
                        args:      ["The view pane should no longer be visible...", false, "{arguments}.0"]
                    },
                    {
                        func: "{testEnvironment}.harness.browser.visible",
                        args:     [".new-picker-viewport .picker-edit"]
                    },
                    {
                        event:     "{testEnvironment}.harness.browser.events.onVisibleComplete",
                        listener: "jqUnit.assertEquals",
                        args:      ["The edit pane should now be visible...", true, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "The cancel button should close the picker form...",
                sequence: [
                    {
                        func: "{testEnvironment}.harness.browser.goto",
                        args: ["{that}.options.testUrl"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onGotoComplete",
                        listener: "{testEnvironment}.harness.browser.click",
                        args:     [".new-picker-viewport .ptd-icon-edit"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onClickComplete",
                        listener: "{testEnvironment}.harness.browser.click",
                        args:     [".new-picker-viewport .ptd-icon-cross"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onClickComplete",
                        listener: "{testEnvironment}.harness.browser.visible",
                        args:     [".new-picker-viewport .picker-view"]
                    },
                    {
                        event:     "{testEnvironment}.harness.browser.events.onVisibleComplete",
                        listener: "jqUnit.assertEquals",
                        args:      ["The view pane should be visible again...", true, "{arguments}.0"]
                    },
                    {
                        func: "{testEnvironment}.harness.browser.visible",
                        args:     [".new-picker-viewport .picker-edit"]
                    },
                    {
                        event:     "{testEnvironment}.harness.browser.events.onVisibleComplete",
                        listener: "jqUnit.assertEquals",
                        args:      ["The edit pane should no longer be visible...", false, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Auto suggestions should appear...",
                sequence: [
                    {
                        func: "{testEnvironment}.harness.browser.goto",
                        args: ["{that}.options.testUrl"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onGotoComplete",
                        listener: "{testEnvironment}.harness.browser.click",
                        args:     [".new-picker-viewport .ptd-icon-edit"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onClickComplete",
                        listener: "{testEnvironment}.harness.browser.type",
                        args:     [".new-picker-viewport .picker-search-query", "test"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onTypeComplete",
                        listener: "{testEnvironment}.harness.browser.wait",
                        args:     [2000]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onWaitComplete",
                        listener: "{testEnvironment}.harness.browser.evaluate",
                        args:     [gpii.tests.browser.tests.lookupFunction, "ul.picker-suggestions li", "innerText"]
                    },
                    {
                        event:     "{testEnvironment}.harness.browser.events.onEvaluateComplete",
                        listener: "jqUnit.assertDeepEq",
                        args:      ["The suggestions should be as expected...", ["foo:This is the definition for the 'foo' element.", "bar:This is the definition for the 'bar' element.", "baz:This is the definition for the 'baz' element."], "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Clicking an auto-suggestion should 'pick' it...",
                sequence: [
                    {
                        func: "{testEnvironment}.harness.browser.goto",
                        args: ["{that}.options.testUrl"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onGotoComplete",
                        listener: "{testEnvironment}.harness.browser.click",
                        args:     [".new-picker-viewport .ptd-icon-edit"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onClickComplete",
                        listener: "{testEnvironment}.harness.browser.type",
                        args:     [".new-picker-viewport .picker-search-query", "test"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onTypeComplete",
                        listener: "{testEnvironment}.harness.browser.wait",
                        args:     [2000]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onWaitComplete",
                        listener: "{testEnvironment}.harness.browser.click",
                        args:     [".new-picker-viewport .picker-suggestion[position='1']"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onClickComplete",
                        listener: "{testEnvironment}.harness.browser.evaluate",
                        args:     [gpii.tests.browser.tests.lookupFunction, ".new-picker-viewport .picker-picked", "innerText"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onEvaluateComplete",
                        listener: "jqUnit.assertEquals",
                        args:     ["The picked suggestion should be correct...", "Bar", "{arguments}.0"]
                    }
                ]
            },
            {
                name: "A picker created with existing data should display its data...",
                sequence: [
                    {
                        func: "{testEnvironment}.harness.browser.goto",
                        args: ["{that}.options.testUrl"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onLoaded",
                        listener: "{testEnvironment}.harness.browser.wait",
                        args:     [ 250 ]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onWaitComplete",
                        listener: "{testEnvironment}.harness.browser.evaluate",
                        args:     [gpii.tests.browser.tests.lookupFunction, ".existing-picker-viewport .picker-picked", "innerText"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onEvaluateComplete",
                        listener: "jqUnit.assertEquals",
                        args:     ["The picked suggestion should be correct...", "Bar", "{arguments}.0"]
                    }
                ]
            }
        ]
    }]
});

gpii.ptd.api.tests.expressAndBrowser.testEnvironment({
    ports: {
        express: 3993
    },
    components: {
        caseHolder: {
            type: "gpii.ul.api.frontend.tests.picker"
        }
    }
});