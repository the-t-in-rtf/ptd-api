// TODO:  Agree on where this should live and move it from both the PTD and UL to that place.
// A generic component that controls and updates a single drop-down field based on a single model variable.
"use strict";
/* global fluid */
(function () {
    fluid.defaults("gpii.ptd.select", {
        gradeNames: ["gpii.templates.templateAware"],
        selectors:  {
            initial: ""
        },
        bindings: {
            select:  "select"
        },
        invokers: {
            renderInitialMarkup: {
                func: "{that}.renderMarkup",
                args: ["initial", "{that}.options.template", "{that}.options.select"]
            }
        },
        modelListeners: {
            select: {
                func:          "{that}.renderInitialMarkup",
                excludeSource: "init"
            }
        }
    });
})();
