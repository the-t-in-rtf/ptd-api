"use strict";
var fluid = fluid || require("infusion");

fluid.defaults("gpii.ul.api.frontend.tests.toggle", {
    gradeNames: ["fluid.viewComponent"],
    components: {
        toggle: {
            type:      "gpii.ptd.toggle",
            container: "{gpii.ul.api.frontend.tests.toggle}.container",
            options: {
                toggles: {
                    toToggle: true
                },
                selectors: {
                    toToggle: ".toToggle",
                    toggle:   ".toggle"
                }
            }
        }
    }
});