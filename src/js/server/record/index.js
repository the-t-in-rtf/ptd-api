"use strict";
var fluid = require("infusion");

require("gpii-express");
require("./get/index");

/*

 TODO:  Convert these to Fluid components and integrate.

 var put = require("./put/index")(config);
 router.put("/", put);

 var post = require("./post/index")(config);
 router.post("/", post);

 var del = require("./delete/index")(config);
 router.delete("/", del);

 */

fluid.defaults("gpii.ptd.api.record.noIdHandler", {
    gradeNames: ["gpii.express.handler"],
    invokers: {
        handleRequest: {
            func: "{that}.sendResponse",
            args: [400, { ok: false, message: "You must provide a uniqueId."}]
        }
    }
});

fluid.defaults("gpii.ptd.api.record", {
    gradeNames:    ["gpii.express.router.passthrough"],
    path:          "/record",
    components: {
        get: {
            type: "gpii.ptd.api.record.get",
            options: {
                dbName: "{gpii.ptd.api.record}.options.dbName"
            }
        },
        noId: {
            type: "gpii.express.requestAware.router",
            options: {
                path:          "/",
                handlerGrades: ["gpii.ptd.api.record.noIdHandler"]
            }
        }
    }
});