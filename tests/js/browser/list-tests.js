/*

    Test the "list" component in isolation.  Requires the "lightweight" express harness.

 */
var fluid = require("infusion");
fluid.setLogging(true);
var gpii  = fluid.registerNamespace("gpii");

require("gpii-test-browser");
gpii.tests.browser.loadTestingSupport();

require("../lib/evaluate-functions");
require("../lib/test-environment");
require("../lib/test-harness");
require("../lib/test-caseholder");

fluid.registerNamespace("gpii.ul.api.frontend.tests.list");

fluid.defaults("gpii.ul.api.frontend.tests.list", {
    gradeNames: ["gpii.ptd.api.tests.expressAndBrowser.caseHolder"],
    testUrl: {
        expander: {
            funcName: "fluid.stringTemplate",
            args:     ["%baseUrl%path", { baseUrl: "{testEnvironment}.options.urls.express", path: "dispatcher/list"}]
        }
    },
    rawModules: [{
        tests: [
            {
                name: "Should be able to see existing list content...",
                sequence: [
                    {
                        func: "{testEnvironment}.harness.browser.goto",
                        args: ["{that}.options.testUrl"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onLoaded",
                        listener: "{testEnvironment}.harness.browser.evaluate",
                        args:     [gpii.tests.browser.tests.lookupFunction, ".existing-list-viewport li", "innerText"]
                    },
                    {
                        event:     "{testEnvironment}.harness.browser.events.onEvaluateComplete",
                        listener:  "jqUnit.assertDeepEq",
                        args:      ["Existing list content should be rendered...", ["peas delete", "porridge delete", "hot delete"], "{arguments}.0"]
                    }
                ]
            },
            // TODO:  We cannot test this until we have a meaningful way to hit "enter" after typing in new text...
            //{
            //    name: "Should be able to add a list item...",
            //    sequence: [
            //        {
            //            func: "{testEnvironment}.harness.browser.goto",
            //            args: ["{that}.options.testUrl"]
            //        },
            //        {
            //            event:    "{testEnvironment}.harness.browser.events.onLoaded",
            //            listener: "{testEnvironment}.harness.browser.type",
            //            args:     [ ".new-list-viewport input[name='addItem']", "new item\n\n"]
            //        },
            //        {
            //            event:    "{testEnvironment}.harness.browser.events.onTypeComplete",
            //            listener: "{testEnvironment}.harness.browser.pdf"
            //        },
            //        {
            //            event:    "{testEnvironment}.harness.browser.events.onPdfComplete",
            //            listener: "{testEnvironment}.harness.browser.evaluate",
            //            args:     [gpii.tests.browser.tests.lookupFunction, ".new-list-viewport li", "innerText"]
            //        },
            //        {
            //            event:     "{testEnvironment}.harness.browser.events.onEvaluateComplete",
            //            listener:  "jqUnit.assertEquals",
            //            args:      ["Existing list content should be rendered...", "new item delete", "{arguments}.0"]
            //        }
            //    ]
            //}
            // TODO:  Confirm that new data is passed back from the component to the page component
            {
                name: "Should be able to remove existing items...",
                sequence: [
                    {
                        func: "{testEnvironment}.harness.browser.goto",
                        args: ["{that}.options.testUrl"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onLoaded",
                        listener: "{testEnvironment}.harness.browser.click",
                        args:     [".existing-list-viewport .remove-item[position='0']"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onClickComplete",
                        listener: "{testEnvironment}.harness.browser.evaluate",
                        args:     [gpii.tests.browser.tests.lookupFunction, ".existing-list-viewport li", "innerText"]
                    },
                    {
                        event:     "{testEnvironment}.harness.browser.events.onEvaluateComplete",
                        listener:  "jqUnit.assertDeepEq",
                        args:      ["The list should not contain the deleted item...", ["porridge delete", "hot delete"], "{arguments}.0"]
                    },
                    {
                        func: "{testEnvironment}.harness.browser.click",
                        args: [".existing-list-viewport .remove-item[position='1']"]
                    },
                    {
                        event:    "{testEnvironment}.harness.browser.events.onClickComplete",
                        listener: "{testEnvironment}.harness.browser.evaluate",
                        args:     [gpii.tests.browser.tests.lookupFunction, ".existing-list-viewport li", "innerText"]
                    },
                    {
                        event:     "{testEnvironment}.harness.browser.events.onEvaluateComplete",
                        listener:  "jqUnit.assertEquals",
                        args:      ["The list should not contain the deleted items...", "porridge delete", "{arguments}.0"]
                    }
                ]
            }
            // TODO:  Once we can add a new item, confirm that we can remove a new item (round tripping)...
            // TODO:  Once we can simulate keyboard events, we should have tests for both clicking and tabbing and entering.
        ]
    }]
});

gpii.ptd.api.tests.expressAndBrowser.testEnvironment({
    ports: {
        express: 3958
    },
    components: {
        caseHolder: {
            type: "gpii.ul.api.frontend.tests.list"
        }
    }
});