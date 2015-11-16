// An express router module that wraps all API functions together.  The root of the router serves up the API
// documentation, which you can also read in the `docs` subdirectory.
//
"use strict";
var fluid = require("infusion");

require("gpii-express-user");

require("./docs");
require("./record");
require("./records");
require("./search");

var path = require("path");
var schemaDir = path.resolve(__dirname, "../../schemas");

fluid.defaults("gpii.ptd.api.router", {
    gradeNames: ["gpii.ptd.api.docs"],
    path:       "/api",
    dbName:     "tr",
    schemaDir:  schemaDir,
    distributeOptions: [
        {
            source: "{that}.options.schemaDir",
            target: "{that gpii.express.router}.options.schemaDir"
        },
        {
            source: "{that}.options.ports",
            target: "{that gpii.express.router}.options.ports"
        },
        {
            source: "{that}.options.ports",
            target: "{that gpii.express.handler}.options.ports"
        }
    ],
    components: {
        // Required middleware
        json: {
            type: "gpii.express.middleware.bodyparser.json"
        },
        urlencoded: {
            type: "gpii.express.middleware.bodyparser.urlencoded"
        },
        cookieparser: {
            type: "gpii.express.middleware.cookieparser"
        },
        session: {
            type: "gpii.express.middleware.session",
            options: {
                config: {
                    express: {
                        session: {
                            secret: "Printer, printer take a hint-ter."
                        }
                    }
                }
            }
        },

        docs: {
            type: "gpii.ptd.api.docs"
        },

        record: {
            type: "gpii.ptd.api.record",
            options: {
                dbName: "{gpii.ptd.api.router}.options.dbName"
            }
        },
        records: {
            type: "gpii.ptd.api.records",
            options: {
                dbName: "{gpii.ptd.api.router}.options.dbName"
            }
        },
        terms: {
            type: "gpii.ptd.api.records",
            options: {
                dbName:    "{gpii.ptd.api.router}.options.dbName",
                path:      "/terms",
                type:      "term",
                children:  true
            }
        },
        aliases: {
            type: "gpii.ptd.api.records",
            options: {
                dbName:    "{gpii.ptd.api.router}.options.dbName",
                path:      "/aliases",
                type:      "alias",
                children:  false
            }
        },
        conditions: {
            type: "gpii.ptd.api.records",
            options: {
                dbName:   "{gpii.ptd.api.router}.options.dbName",
                path:      "/conditions",
                type:      "condition",
                children:  false
            }
        },
        translations: {
            type: "gpii.ptd.api.records",
            options: {
                dbName:   "{gpii.ptd.api.router}.options.dbName",
                path:      "/translations",
                type:      "translation",
                children:  false
            }
        },
        transforms: {
            type: "gpii.ptd.api.records",
            options: {
                dbName:   "{gpii.ptd.api.router}.options.dbName",
                path:      "/transforms",
                type:      "transform",
                children:  false
            }
        },
        search: {
            type: "gpii.ptd.api.search",
            options: {
                dbName: "{gpii.ptd.api.router}.options.dbName"
            }
        },
        user: {
            type: "gpii.express.user.api",
            options: {
                path: "/user",
                couch: {
                    port: "{harness}.options.ports.couch",
                    userDbName: "users",
                    userDbUrl: {
                        expander: {
                            funcName: "fluid.stringTemplate",
                            args: ["http://localhost:%port/%userDbName", "{that}.options.couch"]
                        }
                    }
                }
            }
        },
        schemas: {
            type: "gpii.express.router.static",
            options: {
                path:    "/schemas",
                content: schemaDir
            }
        }
    }
});