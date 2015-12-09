"use strict";
var fluid = fluid || require("infusion");

fluid.defaults("gpii.ul.api.frontend.tests.list", {
    gradeNames: ["fluid.viewComponent"],
    model: {
        existingItems: ["peas", "porridge", "hot"]
    },
    components: {
        listWithoutData: {
            type:      "gpii.ptd.api.frontend.list",
            container: ".new-list-viewport",
            options: {
                model: {
                    items: "{gpii.ul.api.frontend.tests.list}.model.newItems"
                }
            }
        },
        listWithData: {
            type:      "gpii.ptd.api.frontend.list",
            container: ".existing-list-viewport",
            options: {
                model: {
                    items: "{gpii.ul.api.frontend.tests.list}.model.existingItems"
                }
            }
        }
    }
});