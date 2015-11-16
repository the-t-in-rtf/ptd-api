"use strict";
var fluid = require("infusion");

require("gpii-express");
require("./delete");
require("./get");
require("./post");

/*

 TODO:  Convert these to Fluid components and integrate.

 var put = require("./put/index")(config);
 router.put("/", put);

 */

fluid.defaults("gpii.ptd.api.record", {
    gradeNames:    ["gpii.express.router.passthrough"],
    path:          "/record",
    method:        "use",
    components: {
        "delete": {
            type: "gpii.ptd.api.record.delete",
            options: {
                dbName: "{gpii.ptd.api.record}.options.dbName"
            }
        },
        get: {
            type: "gpii.ptd.api.record.get",
            options: {
                dbName: "{gpii.ptd.api.record}.options.dbName"
            }
        },
        post: {
            type: "gpii.ptd.api.record.post",
            options: {
                dbName: "{gpii.ptd.api.record}.options.dbName"
            }
        }
    }
});