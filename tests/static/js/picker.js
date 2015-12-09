/*

    Testing the "picker" in isolation.  The URLs used here are static JSON content.  The live APIs are tested via the
    "record" component tests.

 */
"use strict";
var fluid = fluid || require("infusion");

fluid.defaults("gpii.ul.api.frontend.tests.picker.mocked", {
    gradeNames: ["gpii.ptd.api.frontend.picker"],
    urls: {
        suggestions: "/testContent/json/picker.json",
        lookup:      "/testContent/json/pickerLookup.json"
    }
});

fluid.defaults("gpii.ul.api.frontend.tests.picker", {
    gradeNames: ["fluid.viewComponent"],
    components: {
        newMockedPicker: {
            type:      "gpii.ul.api.frontend.tests.picker.mocked",
            container: ".new-picker-viewport"
        },
        existingMockedPicker: {
            type:      "gpii.ul.api.frontend.tests.picker.mocked",
            container: ".existing-picker-viewport",
            options: {
                model: {
                    pickedId: "bar"
                }
            }
        }
    }
});