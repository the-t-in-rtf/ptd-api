/*

 Handle DELETE /api/record/:uniqueId endpoint.

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var request = require("request");

fluid.registerNamespace("gpii.ptd.api.record.delete.handler");

gpii.ptd.api.record["delete"].handler.handleInitialRequest = function (that) {
    if (!that.request.params || ! that.request.params.uniqueId) {
        return that.sendResponse(400, {"ok": false, "message": "You must provide a uniqueId of the record you wish to delete."});
    }

    var lookupOptions = {
        url: that.options.urls.lookup,
        qs: {
            key: that.request.params.uniqueId
        }
    };
    request.get(lookupOptions, that.processLookupResponse);
};

gpii.ptd.api.record["delete"].handler.processLookupResponse = function (that, error, response, body) {
    if (error && error !== null) {
        return that.sendResponse(500, {"ok": false, "message": "error looking up existing record:" + JSON.stringify(error)});
    }

    var jsonData = JSON.parse(body);
    if (jsonData.rows && jsonData.rows.length > 0) {
        var updatedRecord = JSON.parse(JSON.stringify(that.request.body));
        updatedRecord.status = that.options.deletedStatus;
        updatedRecord.updated = new Date().toISOString();

        that.updatedRecord = updatedRecord;

        // TODO: Set the "author" field to the current user (use req.session.user)

        var writeOptions = {
            "url":     that.options.urls.db,
            "body":    JSON.stringify(updatedRecord),
            "headers": {"Content-Type": "application/json"}
        };
        request.post(writeOptions, that.processWriteResponse);
    }
    else {
        return that.sendResponse(404, {"ok": false, "message": "Can't delete record because no record with the given unique ID was found."});
    }
};

gpii.ptd.api.record["delete"].handler.processWriteResponse = function (that, error, response, body) {
    if (error) {
        return that.sendResponse(500, {"ok": false, "message": "There was an error saving data to couch:" + JSON.stringify(error)});
    }

    if (response.statusCode === 201) {
        return that.sendResponse(response.statusCode, {"ok": true, "message": "Record flagged as deleted.", "record": that.updatedRecord});
    }
    else {
        var jsonData = JSON.parse(body);
        return that.sendResponse(response.statusCode, {"ok": false, "message": "There were one or more problems that prevented your update from taking place.", "errors": JSON.stringify(jsonData.reason.errors) });
    }

    // TODO:  Add support for versioning
};


fluid.defaults("gpii.ptd.api.record.delete.handler", {
    gradeNames:    ["gpii.schema.handler"],
    schemaKey:     "message.json",
    schemaUrl:     "http://ul.gpii.net/api/schemas/message.json",
    viewPath:      "_design/api/_view/entries",
    deletedStatus: "deleted",
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
            funcName: "gpii.ptd.api.record.delete.handler.handleInitialRequest",
            args:     ["{that}"]
        },
        processLookupResponse: {
            funcName: "gpii.ptd.api.record.delete.handler.processLookupResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        processWriteResponse: {
            funcName: "gpii.ptd.api.record.delete.handler.processWriteResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        }
    }
});

fluid.defaults("gpii.ptd.api.record.delete", {
    gradeNames:     ["gpii.express.requestAware.router"],
    dbName:         "tr",
    method:         "delete",
    path:           "/:uniqueId",
    handlerGrades:  ["gpii.ptd.api.record.delete.handler"],
    components: {
        gatekeeper: {
            type: "gpii.express.user.middleware.loginRequired",
            options: {
                method: "delete"
            }
        }
    }
});
