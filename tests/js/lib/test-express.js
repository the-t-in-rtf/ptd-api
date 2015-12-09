/*

    The `gpii.express` instances we use in our tests, one with the API, one without.

 */
"use strict";
var fluid = require("infusion");
var path  = require("path");

require("gpii-express");
require("gpii-handlebars");
require("../../../index.js");

// Expose the test templates, the package templates, and the `gpii-express-user` templates, in that order.
var viewDirs  = [
    path.resolve(__dirname, "../../templates"),
    path.resolve(__dirname, "../../../src/templates"),
    path.resolve(__dirname, "../../../node_modules/gpii-express-user/src/templates")
];

var bowerDir       = path.resolve(__dirname, "../../../bower_components");
var modulesDir     = path.resolve(__dirname, "../../../node_modules");
var srcDir         = path.resolve(__dirname, "../../../src");
var testContentDir = path.resolve(__dirname, "../../static");

// The base instance of express that we will use in our tests.  Does not come with the API by default.
fluid.defaults("gpii.ptd.api.tests.express.base", {
    gradeNames: ["gpii.express"],
    config: {
        express: {
            port: "{gpii.ptd.api.tests.express.base}.options.ports.express",
            views: viewDirs,
            app: {
                name: "PTD API Lightweight Test Harness",
                url:  {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args:     ["http://localhost:%port/", { port: "{gpii.ptd.api.tests.express.base}.options.ports.express"}]
                    }
                }
            }
        }
    },
    components: {
        // Bower Components
        bc: {
            type: "gpii.express.router.static",
            options: {
                path:    "/bc",
                content: bowerDir
            }
        },
        // Node Modules
        nm: {
            type: "gpii.express.router.static",
            options: {
                path:    "/nm",
                content: modulesDir
            }
        },
        // The static content from the package (sources, etc.)
        src: {
            type: "gpii.express.router.static",
            options: {
                path:    "/src",
                content: srcDir
            }
        },
        // Our static test content
        // The static content from the package (sources, etc.)
        root: {
            type: "gpii.express.router.static",
            options: {
                path:    "/testContent",
                content: testContentDir
            }
        },
        inline: {
            type: "gpii.express.hb.inline",
            options: {
                path: "/hbs"
            }
        },
        dispatcher: {
            type: "gpii.express.dispatcher",
            options: {
                path: ["/dispatcher/:template"]
            }
        },
        handlebars: {
            type: "gpii.express.hb"
        }
    }
});

// An express instance that includes the full API.
fluid.defaults("gpii.ptd.api.tests.express.api", {
    gradeNames: ["gpii.ptd.api.tests.express.base"],
    components: {
        api: {
            type: "gpii.ptd.api.router",
            options: {
                ports:  "{gpii.ptd.api.tests.express.api}.options.ports",
                dbName: "{gpii.ptd.api.tests.express.api}.options.dbName"
            }
        }
    }
});