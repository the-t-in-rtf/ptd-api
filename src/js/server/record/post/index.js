/*

    Handle POST /api/record endpoint.

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var request = require("request");

fluid.registerNamespace("gpii.ptd.api.record.post.handler");

gpii.ptd.api.record.post.handler.handleInitialRequest = function (that) {
    // TODO:  Confirm that the parent record exists when adding a child record.

    var lookupOptions = {
        url: that.options.urls.lookup,
        qs: {
            key: that.request.body.uniqueId
        }
    };
    request.get(lookupOptions, that.processLookupResponse);
};

gpii.ptd.api.record.post.handler.processLookupResponse = function (that, error, response, body) {
    if (error && error !== null) {
        return that.sendResponse(500, {"ok": false, "message": "error confirming whether uniqueId is already used:" + JSON.stringify(error)});
    }

    var jsonData = JSON.parse(body);
    if (jsonData.rows && jsonData.rows.length > 0) {
        return that.sendResponse(409, {"ok": false, "message": "Could not post record because another record with the same uniqueId already exists."});
    }

    var updatedRecord = JSON.parse(JSON.stringify(that.request.body));
    updatedRecord.updated = new Date().toISOString();

    that.updatedRecord = updatedRecord;

    // TODO: Set the "author" field to the current user (use req.session.user)

    var writeOptions = {
        "url":     that.options.urls.db,
        "body":    JSON.stringify(updatedRecord),
        "headers": {"Content-Type": "application/json"}
    };
    request.post(writeOptions, that.processWriteResponse);
};

gpii.ptd.api.record.post.handler.processWriteResponse = function (that, error, response, body) {
    if (error) {
        return that.sendResponse(500, {"ok": false, "message": "There was an error saving data to couch:" + JSON.stringify(error)});
    }

    if (response.statusCode === 201) {
        return that.sendResponse(response.statusCode, {"ok": true, "message": "Record added.", "record": that.updatedRecord});
    }
    else {
        var jsonData = JSON.parse(body);
        return that.sendResponse(response.statusCode, {"ok": false, "message": "There were one or more problems that prevented your update from taking place.", "errors": JSON.stringify(jsonData.reason.errors) });
    }

    // TODO:  Add support for versioning
};

fluid.defaults("gpii.ptd.api.record.post.handler", {
    gradeNames: ["gpii.schema.handler"],
    schemaKey:  "message.json",
    schemaUrl:  "http://ul.gpii.net/api/schemas/message.json",
    viewPath:   "_design/api/_view/entries",
    urls: {
        db: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port/%dbName", { port: "{that}.options.ports.couch", dbName: "{gpii.ptd.api.record.post}.options.dbName"}]
            }
        },
        lookup: {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port/%dbName/%viewPath", { port: "{that}.options.ports.couch", dbName: "{gpii.ptd.api.record.post}.options.dbName", viewPath: "{that}.options.viewPath"}]
            }
        }
    },
    invokers: {
        handleRequest: {
            funcName: "gpii.ptd.api.record.post.handler.handleInitialRequest",
            args:     ["{that}"]
        },
        processLookupResponse: {
            funcName: "gpii.ptd.api.record.post.handler.processLookupResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        processWriteResponse: {
            funcName: "gpii.ptd.api.record.post.handler.processWriteResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        }
    }
});

fluid.defaults("gpii.ptd.api.record.post", {
    gradeNames:     ["gpii.express.router.passthrough"],
    path:           "/",
    method:         "post",
    dbName:         "tr",
    components: {
        gatekeeper: {
            type: "gpii.express.user.middleware.loginRequired"
        },
        schemaMiddleware: {
            type: "gpii.schema.middleware.hasParser",
            options: {
                // TODO:  disentangle the validation schema from the response schema.
                schemaDir: "{gpii.ptd.api.record.post}.options.schemaDir",
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
                path:           "/",
                method:         "post",
                handlerGrades:  ["gpii.ptd.api.record.post.handler"]
            }
        }
    }
});