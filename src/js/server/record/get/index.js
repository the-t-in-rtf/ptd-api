/*

    Handle calls to `GET /api/record/:uniqueId`, including returning an appropriate error if no `uniqueId` value is provided.

 */
"use strict";

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-express");
require("../../lib/children");
require("../../lib/params");

var request = require("request");

fluid.registerNamespace("gpii.ptd.api.record.get.handler");

gpii.ptd.api.record.get.handler.handleRequest = function (that) {
    if (!that.options.urls.db) {
        that.sendResponse(500, { ok: false, message: "Cannot continue without a valid database URL. Contact your system administrator."});
        fluid.fail("you must set a database URL in order to use this component.");
    }

    if (!that.request.params || !that.request.params.uniqueId) {
        that.sendResponse(400, { ok: false, message: "You must provide a uniqueId to use this interface."});
        return;
    }


    // Extract the parameters we will use throughout the process from the request.
    that.params = gpii.ptd.api.lib.params.extractParams(that.request.query, that.options.queryFields);
    that.params.uniqueId = that.request.params.uniqueId;

    var requestConfig = {
        url:     that.options.urls.db,
        qs:      { key: "\"" + that.params.uniqueId + "\"" },
        json:    true,
        timeout: 5000 // In practice, we probably only need a second, but the defaults are definitely too low.
    };

    request(requestConfig, that.processCouchResponse);
};


gpii.ptd.api.record.get.handler.processCouchResponse = function (that, error, _, body) {
    if (error) {
        that.sendResponse("500", { "ok": false, "message": error});
        return;
    }

    if (body.rows  && body.rows.length > 0) {
        // Couch includes a `docs` field in its response, and each field hides its data in a `value` field.  This line flattens that out.
        var record = body.rows[0].value;

        // Only lookup children if we are configured to work with them, and if we have "parent" records to start with.
        if (that.params.children && record.type === "term") {
            // Wait for the `children` component to get the child records and then process the results (see listener below).
            that.children.applier.change("originalRecords", [record]);
        }
        else {
            gpii.ptd.api.record.get.handler.sendRecord(that, [record]);
        }
    }
    else {
        that.sendResponse("404", { ok: false, message: "No record was found for the given uniqueId." });
    }
};

gpii.ptd.api.record.get.handler.sendRecord = function (that, records) {
    var responseBody = {
        "retrievedAt": new Date()
    };

    var record = Array.isArray(records) && records.length > 0 ? records[0] : null;

    // The status code should be 404 if no record was returned.
    var statusCode = record ? 200 : 404;
    responseBody.ok = record ? true : false;

    if (record) {
        responseBody.record = record;
    }
    else {
        responseBody.message = "No record was found for this uniqueId.";
    }

    that.sendResponse(statusCode, responseBody);
};

fluid.defaults("gpii.ptd.api.record.get.handler", {
    gradeNames:      ["gpii.schema.handler"],
    schemaName:      "record",
    querySchemaName: "record-query",
    viewPath:        "_design/api/_view/entries",
    maxKeyData:        "{gpii.ptd.api.record.get}.options.maxKeyData",
    schemaDir:         "{gpii.ptd.api.record.get}.options.schemaDir",
    schemaKey:         "{gpii.ptd.api.record.get}.options.schemaKey",
    schemaUrl:         "{gpii.ptd.api.record.get}.options.schemaUrl",
    dbName:            "{gpii.ptd.api.record.get}.options.dbName",
    ports:             "{gpii.ptd.api.record.get}.options.ports",
    urls: {
        db: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port/%dbName/%viewPath", { port: "{that}.options.ports.couch", dbName: "{that}.options.dbName", viewPath: "{that}.options.viewPath"}]
            }
        }
    },
    // The list of query fields we support, with hints about their defaults (if any) and their default value (if any)
    //
    // All actual query input validation is handled using a JSON schema.
    queryFields: {
        "children": {
            type:         "boolean",
            defaultValue: "{that}.options.children"
        }
    },
    components: {
        "children": {
            type: "gpii.ptd.api.lib.children",
            options: {
                ports:  "{gpii.ptd.api.record.get.handler}.options.ports",
                dbName: "{gpii.ptd.api.record.get.handler}.options.dbName",
                listeners: {
                    "onChildrenLoaded": {
                        funcName: "gpii.ptd.api.record.get.handler.sendRecord",
                        args: [ "{gpii.ptd.api.record.get.handler}", "{children}.model.processedRecords" ]
                    }
                }
            }
        }
    },
    invokers: {
        processCouchResponse: {
            funcName: "gpii.ptd.api.record.get.handler.processCouchResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        handleRequest: {
            funcName: "gpii.ptd.api.record.get.handler.handleRequest",
            args:     ["{that}"]
        }
    }
});

fluid.defaults("gpii.ptd.api.record.get.noIdHandler", {
    gradeNames: ["gpii.schema.handler"],
    schemaKey:  "message.json",
    schemaUrl:  "http://ul.gpii.net/api/schemas/message.json",
    invokers: {
        handleRequest: {
            func: "{that}.sendResponse",
            args: [400, { ok: false, message: "You must provide a uniqueId."}]
        }
    }
});

fluid.defaults("gpii.ptd.api.record.get", {
    gradeNames:     ["gpii.express.router.passthrough"],
    path:           "/",
    method:         "get",
    querySchemaKey: "record-query.json",
    schemaKey:      "record.json",
    schemaUrl:      "https://terms.raisingthefloor.org/api/schemas/record.json",
    type:           "record",
    children:       false,
    components: {
        schemaMiddleware: {
            type: "gpii.schema.middleware.hasParser",
            options: {
                schemaKey: "{gpii.ptd.api.record.get}.options.querySchemaKey",
                schemaDir: "{gpii.ptd.api.record.get}.options.schemaDir",
                rules: {
                    requestContentToValidate: {
                        "": "query"
                    }
                }
            }
        },
        recordRouter: {
            type: "gpii.express.requestAware.router",
            options: {
                // Required to preserve the value of /:uniqueId held by the parent.
                routerOptions: {
                    mergeParams: true
                },
                path:           "/:uniqueId",
                method:         "get",
                handlerGrades:  ["gpii.ptd.api.record.get.handler"]
            }
        },
        noIdRouter: {
            type: "gpii.express.requestAware.router",
            options: {
                path:          "/",
                handlerGrades: ["gpii.ptd.api.record.get.noIdHandler"]
            }
        }
    }
});