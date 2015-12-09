/*

 Handle PUT /api/record/:uniqueId endpoint.

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var request = require("request");

fluid.registerNamespace("gpii.ptd.api.record.put.handler");

gpii.ptd.api.record.put.handler.handleInitialRequest = function (that) {
    // TODO:  Confirm that the parent record exists when adding a child record.
    if (!that.request.params || ! that.request.params.uniqueId) {
        return that.sendResponse(400, {"ok": false, "message": "You must provide a uniqueId to PUT a record."});
    }

    var lookupOptions = {
        url: that.options.urls.lookup,
        qs: {
            key: that.request.params.uniqueId
        }
    };
    request.get(lookupOptions, that.processLookupResponse);
};

gpii.ptd.api.record.put.handler.processLookupResponse = function (that, error, response, body) {
    if (error && error !== null) {
        return that.sendResponse(500, {"ok": false, "message": "error looking up validExisting record:" + JSON.stringify(error)});
    }

    var updatedRecord = JSON.parse(JSON.stringify(that.request.body));

    var jsonData = JSON.parse(body);
    var writeUrl = fluid.stringTemplate("%dbUrl/%uniqueId", { dbUrl: that.options.urls.db, uniqueId: that.request.params.uniqueId});

    if (jsonData.rows && jsonData.rows.length > 0) {
        var existingRecord = jsonData.rows[0].value;
        updatedRecord._id  = existingRecord._id;
        updatedRecord._rev = existingRecord._rev;
    }

    if (!updatedRecord.updated) {
        updatedRecord.updated = new Date().toISOString();
    }

    that.updatedRecord = updatedRecord;

    // TODO: Set the "author" field to the current user (use req.session.user)

    var writeOptions = {
        "url":     writeUrl,
        "method":  "PUT",
        "body":    JSON.stringify(updatedRecord),
        "headers": {"Content-Type": "application/json"}
    };
    request(writeOptions, that.processWriteResponse);
};

gpii.ptd.api.record.put.handler.processWriteResponse = function (that, error, response, body) {
    if (error) {
        return that.sendResponse(500, {"ok": false, "message": "There was an error saving data to couch:" + JSON.stringify(error)});
    }

    if ([201, 200].indexOf(response.statusCode) !== -1) {
        return that.sendResponse(response.statusCode, {"ok": true, "message": "Record saved.", "record": that.updatedRecord});
    }
    else {
        var jsonData = JSON.parse(body);
        return that.sendResponse(response.statusCode, {"ok": false, "message": "There were one or more problems that prevented your update from taking place.", "errors": JSON.stringify(jsonData.reason.errors) });
    }

    // TODO:  Add support for versioning
};

fluid.defaults("gpii.ptd.api.record.put.handler", {
    gradeNames: ["gpii.schema.handler"],
    schemaKey:  "message.json",
    schemaUrl:  "http://ul.gpii.net/api/schemas/message.json",
    viewPath:   "_design/api/_view/entries",
    urls: {
        db: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port/%dbName", { port: "{that}.options.ports.couch", dbName: "{gpii.ptd.api.record.put}.options.dbName"}]
            }
        },
        lookup: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port/%dbName/%viewPath", { port: "{that}.options.ports.couch", dbName: "{gpii.ptd.api.record.put}.options.dbName", viewPath: "{that}.options.viewPath"}]
            }
        }
    },
    invokers: {
        handleRequest: {
            funcName: "gpii.ptd.api.record.put.handler.handleInitialRequest",
            args:     ["{that}"]
        },
        processLookupResponse: {
            funcName: "gpii.ptd.api.record.put.handler.processLookupResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        processWriteResponse: {
            funcName: "gpii.ptd.api.record.put.handler.processWriteResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        }
    }
});

fluid.defaults("gpii.ptd.api.record.put", {
    gradeNames:     ["gpii.express.router.passthrough"],
    path:           "/",
    method:         "put",
    dbName:         "tr",
    components: {
        gatekeeper: {
            type: "gpii.express.user.middleware.loginRequired",
            options: {
                method: "put"
            }
        },
        schemaMiddleware: {
            type: "gpii.schema.middleware.hasParser",
            options: {
                // TODO:  disentangle the validation schema from the response schema.
                schemaDir: "{gpii.ptd.api.record.put}.options.schemaDir",
                schemaUrl: "https://ul.gpii.net/api/schemas/record.json",
                schemaKey: "record.json",
                rules: {
                    requestContentToValidate: {
                        "": "body"
                    }
                }
            }
        },
        mainRouter: {
            type: "gpii.express.requestAware.router",
            options: {
                path:           "/:uniqueId",
                method:         "put",
                handlerGrades:  ["gpii.ptd.api.record.put.handler"]
            }
        }
    }
});