"use strict";
var fluid = require("infusion");

require("gpii-express");
require("./delete");
require("./get");
require("./post");
require("./put");

fluid.defaults("gpii.ptd.api.record", {
    gradeNames:    ["gpii.express.router.passthrough"],
    path:          "/record",
    method:        "use",
    components: {
        get: {
            type: "gpii.ptd.api.record.get",
            options: {
                dbName: "{gpii.ptd.api.record}.options.dbName"
            }
        },
        "delete": {
            type: "gpii.ptd.api.record.delete",
            options: {
                dbName: "{gpii.ptd.api.record}.options.dbName"
            }
        },
        put: {
            type: "gpii.ptd.api.record.put",
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