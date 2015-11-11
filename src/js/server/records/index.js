"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ptd.api.records");

// Bring in our helper components
require("gpii-express");
require("gpii-json-schema");

require("../lib/sorting/index");
require("../lib/filters/index");
require("../lib/paging/index");
require("../lib/children/index");
require("../lib/params/index");

var request  = require("request");

fluid.registerNamespace("gpii.ptd.api.records.handler");
gpii.ptd.api.records.handler.checkRequirements = function (that) {
    if (!that.options.ports || !that.options.ports.couch) {
        fluid.fail("you must set options.ports.couch in order to use this component.");
    }
    if (!that.options.type) {
        fluid.fail("You must set options.type in order to use this component.");
    }
    if (!that.options.viewPath) {
        fluid.fail("You must set options.viewPath in order to use this component.");
    }
    if (that.options.viewPath[that.options.type] === -1) {
        fluid.fail("You must register a couch view for the specified record type.  Can't continue.");
    }
};

gpii.ptd.api.records.handler.handleRequest = function (that) {
    gpii.ptd.api.records.handler.extractParams(that);

    // We prepend a ./ to the second half of the URL to ensure that the database name is not stripped out.
    var requestUrl = fluid.stringTemplate("%baseUrl%viewPath", {baseUrl: that.options.couchBaseUrl, viewPath: that.options.viewPath[that.options.type]});
    var requestOptions = {
        url:     requestUrl,
        json:    true,
        timeout: 10000 // In practice, we probably only need a second, but the defaults are definitely too low.
    };

    request(requestOptions, that.processCouchResponse);
};

// Convert the couch data to our local format and continue processing, either by looking up children, or by sending the
// results to the end user.
gpii.ptd.api.records.handler.processCouchResponse = function (that, error, _, body) {
    if (error) {
        var errorBody = {
            "ok": false,
            "message": error
        };

        that.sendResponse("500", errorBody);
        return;
    }

    if (body.rows) {
        // Couch includes a `docs` field in its response, and each field hides its data in a `value` field.  This line flattens that out.
        var records = body.rows.map(function (doc) {
            return doc.value;
        });

        var filterParams    = gpii.ptd.api.lib.params.getFilterParams(that.params, that.options.queryFields);
        var filteredRecords = gpii.ptd.api.lib.filter.filter(records, filterParams);

        // Now that we have retrieved the main payload and filtered it, we can save the total number of rows.
        that.total_rows = filteredRecords.length;

        // Sort the filtered results if needed.
        if (that.params.sort) {
            gpii.ptd.api.lib.sorting.sort(filteredRecords, that.params.sort);
        }

        try {
            // Page the results
            var pagerParams  = gpii.ptd.api.records.handler.getPagingParams(that);
            var pagedRecords = that.pager.pageArray(filteredRecords, pagerParams);

            // Only lookup children if we are configured to work with them, and if we have "parent" records to start with.
            if (that.params.children && pagedRecords.length > 0) {
                // Wait for the `children` component to get the child records and then process the results (see listener below).
                that.children.applier.change("originalRecords", pagedRecords);
            }
            else {
                gpii.ptd.api.records.handler.sendRecords(that, pagedRecords);
            }
        }
        catch (e) {
            that.sendResponse("500", { ok: false, message: "Error paging records." });
        }
    }
    else {
        // We somehow did not receive records from couch.  Pass on whatever we did receive.
        that.sendResponse("500", { ok: false, message: body });
    }
};

gpii.ptd.api.records.handler.getPagingParams = function (that) {
    return gpii.ptd.api.lib.params.getRelevantParams(that.params, that.options.queryFields, "pagingField");
};

// Use the standard `params` functions to convert `req.params` into the data we will display to end users.
gpii.ptd.api.records.handler.extractParams = function (that) {
    // Use the standard `params` function to do most of the heavy lifting.
    that.params = gpii.ptd.api.lib.params.extractParams(that.request.query, that.options.queryFields);

    // If we are asked to provide "children", we have to override whatever record types we were passed and make sure we are dealing with "term" records.
    if (that.params.children) {
        that.params.type = "term";
    }
};

gpii.ptd.api.records.handler.sendRecords = function (that, records) {
    var responseBody = {
        "ok":          true,
        "total_rows" : that.total_rows,
        "records":     records,
        "params":      that.params,
        "retrievedAt": new Date()
    };

    that.sendResponse(200, responseBody);
};

fluid.defaults("gpii.ptd.api.records.handler", {
    gradeNames:        ["gpii.schema.handler"],
    querySchemaKey:    "{gpii.ptd.api.records}.options.querySchemaKey",
    schemaKey:         "{gpii.ptd.api.records}.options.schemaKey",
    schemaUrl:         "{gpii.ptd.api.records}.options.schemaUrl",
    type:              "{gpii.ptd.api.records}.options.type",
    children:          "{gpii.ptd.api.records}.options.children",
    ports:             "{gpii.ptd.api.records}.options.ports",
    dbName:            "{gpii.ptd.api.records}.options.dbName",
    typesWithChildren: ["term", "record"],
    couchBaseUrl: {
        expander: {
            funcName: "fluid.stringTemplate",
            args: ["http://localhost:%port/%db/", { port: "{that}.options.ports.couch", db: "{that}.options.dbName" }]
        }
    },
    components: {
        "pager": {
            type: "gpii.ptd.api.lib.paging"
        },
        "children": {
            type: "gpii.ptd.api.lib.children",
            options: {
                ports:  "{gpii.ptd.api.records.handler}.options.ports",
                dbName: "{gpii.ptd.api.records.handler}.options.dbName",
                listeners: {
                    "onChildrenLoaded": {
                        funcName: "gpii.ptd.api.records.handler.sendRecords",
                        args: [ "{gpii.ptd.api.records.handler}", "{children}.model.processedRecords" ]
                    }
                }
            }
        }
    },
    members: {
        params:     {},
        total_rows: 0
    },
    // The list of query fields we support, with hints about their defaults (if any) and their default value (if any)
    //
    // All actual query input validation is handled using a JSON schema.
    queryFields: {
        "sort": {
            sortingField: true
        },
        "offset": {
            type:         "number",
            pagingField:  true,
            defaultValue: 0
        },
        "limit": {
            type:         "number",
            pagingField:  true,
            defaultValue: 25
        },
        "status": {
            filterField:  true,
            forceLower:   true,
            defaultValue: ["unreviewed", "draft", "candidate", "active"]
        },
        "children": {
            type:         "boolean",
            defaultValue: "{that}.options.children"
        },
        "updated": {
            type:        "date",
            comparison:  "ge",  // We want records whose date is equal to or newer than the `updated` field
            filterField: true
        },
        "type": {
            filterField: true,
            forceLower:  true
        }
    },
    viewPath: {
        alias:       "_design/api/_view/aliases",
        condition:   "_design/api/_view/conditions",
        record:      "_design/api/_view/entries",
        term:        "_design/api/_view/terms",
        transform:   "_design/api/_view/transforms",
        translation: "_design/api/_view/translations"
    },
    listeners: {
        "onCreate.checkRequirements": {
            funcName: "gpii.ptd.api.records.handler.checkRequirements",
            args:     ["{that}"]
        }
    },
    invokers: {
        processCouchResponse: {
            funcName: "gpii.ptd.api.records.handler.processCouchResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        handleRequest: {
            funcName: "gpii.ptd.api.records.handler.handleRequest",
            args:     ["{that}"]
        }
    }
});

fluid.defaults("gpii.ptd.api.records", {
    gradeNames:     ["gpii.express.requestAware.router"],
    path:           "/records",
    querySchemaKey: "records-query.json",
    schemaKey:      "records.json",
    schemaUrl:      "https://terms.raisingthefloor.org/api/schemas/records.json",
    type:           "record",
    children:       false,
    components: {
        schemaMiddleware: {
            type: "gpii.schema.middleware.hasParser",
            options: {
                schemaKey: "{gpii.ptd.api.records}.options.querySchemaKey",
                schemaDir: "{gpii.ptd.api.records}.options.schemaDir",
                rules: {
                    requestContentToValidate: {
                        "": "query"
                    }
                }
            }
        },
        mainRouter: {
            type: "gpii.express.requestAware.router",
            options: {
                path:           "/",
                handlerGrades:  ["gpii.ptd.api.records.handler"]
            }
        }
    }
});


