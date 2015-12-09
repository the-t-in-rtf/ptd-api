"use strict";
var fluid = fluid || require("infusion");

fluid.defaults("gpii.ul.api.frontend.tests.picker", {
    gradeNames: ["fluid.viewComponent"],
    components: {
        picker: {
            type:      "gpii.ptd.api.frontend.picker",
            container: "{gpii.ul.api.frontend.tests.picker}.container",
            options: {
                baseUrl: "/testContent/json/picker.json"
            }
        }
    }
});