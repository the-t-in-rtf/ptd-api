/*

    Test the "toggle" component in isolation.  Does not require express.

 */
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-test-browser");
gpii.tests.browser.loadTestingSupport();

var path        = require("path");
var url         = require("url");
var filePath    = path.resolve(__dirname, "../../static/toggle.html");
var testUrl     = url.resolve("file://", filePath);

fluid.defaults("gpii.ul.api.frontend.tests.toggle", {
    gradeNames: ["gpii.tests.browser.caseHolder.static"],
    rawModules: [{
        tests: [
            {
                name: "Confirm that the content is visible by default...",
                sequence: [
                    {
                        func: "{testEnvironment}.browser.goto",
                        args: [testUrl]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onGotoComplete",
                        listener: "{testEnvironment}.browser.visible",
                        args:     [".toToggle"]
                    },
                    {
                        event:     "{testEnvironment}.browser.events.onVisibleComplete",
                        listener: "jqUnit.assertEquals",
                        args:      ["The content should be visible...", true, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Hide content using a link...",
                sequence: [
                    {
                        func: "{testEnvironment}.browser.goto",
                        args: [testUrl]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onGotoComplete",
                        listener: "{testEnvironment}.browser.click",
                        args:     ["a.toggle"]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onClickComplete",
                        listener: "{testEnvironment}.browser.visible",
                        args:     [".toToggle"]
                    },
                    {
                        event:     "{testEnvironment}.browser.events.onVisibleComplete",
                        listener: "jqUnit.assertEquals",
                        args:      ["The content should not be visible...", false, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Hide content using a div...",
                sequence: [
                    {
                        func: "{testEnvironment}.browser.goto",
                        args: [testUrl]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onGotoComplete",
                        listener: "{testEnvironment}.browser.click",
                        args:     ["div.toggle"]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onClickComplete",
                        listener: "{testEnvironment}.browser.visible",
                        args:     [".toToggle"]
                    },
                    {
                        event:     "{testEnvironment}.browser.events.onVisibleComplete",
                        listener: "jqUnit.assertEquals",
                        args:      ["The content should not be visible...", false, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Hide content using a button...",
                sequence: [
                    {
                        func: "{testEnvironment}.browser.goto",
                        args: [testUrl]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onGotoComplete",
                        listener: "{testEnvironment}.browser.click",
                        args:     ["button.toggle"]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onClickComplete",
                        listener: "{testEnvironment}.browser.visible",
                        args:     [".toToggle"]
                    },
                    {
                        event:     "{testEnvironment}.browser.events.onVisibleComplete",
                        listener: "jqUnit.assertEquals",
                        args:      ["The content should not be visible...", false, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Hide content using a span...",
                sequence: [
                    {
                        func: "{testEnvironment}.browser.goto",
                        args: [testUrl]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onGotoComplete",
                        listener: "{testEnvironment}.browser.click",
                        args:     ["span.toggle"]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onClickComplete",
                        listener: "{testEnvironment}.browser.visible",
                        args:     [".toToggle"]
                    },
                    {
                        event:     "{testEnvironment}.browser.events.onVisibleComplete",
                        listener: "jqUnit.assertEquals",
                        args:      ["The content should not be visible...", false, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Hide content using a submit button...",
                sequence: [
                    {
                        func: "{testEnvironment}.browser.goto",
                        args: [testUrl]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onGotoComplete",
                        listener: "{testEnvironment}.browser.click",
                        args:     ["input.toggle"]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onClickComplete",
                        listener: "{testEnvironment}.browser.visible",
                        args:     [".toToggle"]
                    },
                    {
                        event:     "{testEnvironment}.browser.events.onVisibleComplete",
                        listener: "jqUnit.assertEquals",
                        args:      ["The content should not be visible...", false, "{arguments}.0"]
                    }
                ]
            },
            {
                name: "Toggle content twice in a row...",
                sequence: [
                    {
                        func: "{testEnvironment}.browser.goto",
                        args: [testUrl]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onGotoComplete",
                        listener: "{testEnvironment}.browser.click",
                        args:     ["a.toggle"]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onClickComplete",
                        listener: "{testEnvironment}.browser.visible",
                        args:     [".toToggle"]
                    },
                    {
                        event:     "{testEnvironment}.browser.events.onVisibleComplete",
                        listener: "jqUnit.assertEquals",
                        args:      ["The content should not be visible...", false, "{arguments}.0"]
                    },
                    {
                        func: "{testEnvironment}.browser.click",
                        args: ["a.toggle"]
                    },
                    {
                        event:    "{testEnvironment}.browser.events.onClickComplete",
                        listener: "{testEnvironment}.browser.visible",
                        args:     [".toToggle"]
                    },
                    {
                        event:     "{testEnvironment}.browser.events.onVisibleComplete",
                        listener: "jqUnit.assertEquals",
                        args:      ["The content should be visible...", true, "{arguments}.0"]
                    }
                ]
            }
        ]
    }]
});

gpii.tests.browser.environment({
    ports: {
        express: 3957
    },
    components: {
        caseHolder: {
            type: "gpii.ul.api.frontend.tests.toggle"
        }
    }
});