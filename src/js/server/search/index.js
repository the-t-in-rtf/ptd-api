"use strict";

var fluid = require("infusion");

// TODO:  Wrap in a content aware router and serve up:
//
// 1. The form to browsers if no query data is provided.
// 2. The form with results if query data is provided.

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ptd.api.search");

// Bring in our helper components
require("gpii-express");
require("../lib/sorting/index");
require("../lib/filters/index");
require("../lib/paging/index");
require("../lib/children/index");
require("../lib/params/index");

var request = require("request");

fluid.registerNamespace("gpii.ptd.api.search.handler");

// We cannot URI encode colons, as Lucene will not decode them. Everything else we must encode to avoid problems with bad characters.
gpii.ptd.api.search.encodeSkippingColons = function (value) {
    if (!value || typeof value !== "string") {
        return value;
    }

    var segments = value.split(":");
    var encodedSegments = segments.map(encodeURIComponent);

    return encodedSegments.join(":");
};

gpii.ptd.api.search.handler.handleRequest = function (that) {
    that.results.params = gpii.ptd.api.lib.params.extractParams(that.request.query, that.options.queryFields);

    var queryData = gpii.ptd.api.search.handler.generateLuceneQueryString(that);
    
    var requestConfig = {
        "url" :    that.options.urls.lucene,
        "qs":      queryData,
        "json":    true,
        "timeout": 10000 // In practice, we probably only need a second, but this is set high to give lucene time to respond.
    };

    request(requestConfig, that.processLuceneResponse);
};

// Add select fields to lucene's query string.  Used to reduce the number of circumstances in which we will hit the
// character limit in retrieving our full list of records.
gpii.ptd.api.search.handler.generateLuceneQueryString = function (that) {
    var statusQueryString    = "";
    if (that.results.params.status) {
        if (Array.isArray(that.results.params.status)) {
            var qualifiedStatusValues = that.results.params.status.map(function (value) {
                return "status:" + value;
            });
            statusQueryString = "(" + qualifiedStatusValues.join(" OR ") + ")";
        }
        else {
            statusQueryString = "(status:" + that.results.params.status + ")";
        }
    }

    var searchQueryString = Array.isArray(that.results.params.q) ? that.results.params.q.join(" ") : that.results.params.q;

    var queryString = "(" + searchQueryString + ")";
    if (that.results.params.status) {
        queryString += " AND " + statusQueryString;
    }

    var queryData = {
        //"q":     gpii.ptd.api.search.encodeSkippingColons(queryString),
        "q":     queryString,
        "limit": 1000000 // Hard-coded limit to disable limiting by Lucene.  Required because of CTR-148
    };

    return queryData;
};

// Process the raw search results returned by Lucene and derive the list of distinct terms.
gpii.ptd.api.search.handler.processLuceneResponse = function (that, error, response, body) {
    if (error) {
        var errorBody = {
            "ok": false,
            "message": error
        };

        that.sendResponse("500", errorBody);
        return;
    }

    var distinctUniqueIdMap = {};
    if (body && body.rows) {
        // build a list of unique term IDs, skipping duplicates.
        for (var i = 0; i < body.rows.length; i++) {
            var record = body.rows[i].fields;
            var uniqueId = record.uniqueId;

            if (record.type === "alias" || record.type === "transform") {
                uniqueId = record.aliasOf;
            }
            else if (record.type === "translation") {
                uniqueId = record.translationOf;
            }

            distinctUniqueIdMap[uniqueId] = true;
        }
    }
    var distinctUniqueIds = Object.keys(distinctUniqueIdMap);

    that.results.total_rows = distinctUniqueIds.length;
    if (distinctUniqueIds.length === 0) {
        return that.sendResponse("200", that.results);
    }

    var distinctKeyString = JSON.stringify(distinctUniqueIds);
    if (distinctKeyString.length > 7500) {
        return that.sendResponse(500,   {ok: false, message: "Your query returned too many search results to display.  Please add additional search terms or filters."});
    }
    else {
        var parentRecordOptions = {
            "url" : that.options.urls.db,
            "qs": { keys: distinctKeyString },
            "json": true
        };

        request.get(parentRecordOptions, that.processCouchResponse);
    }
};

gpii.ptd.api.search.handler.processCouchResponse = function (that, error, _, body) {
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

        var filterParams    = gpii.ptd.api.lib.params.getFilterParams(that.results.params, that.options.queryFields);
        var filteredRecords = gpii.ptd.api.lib.filter.filter(records, filterParams);

        // Update the total number of search results
        that.results.total_rows = filteredRecords.length;

        // Sort the filtered results if needed.
        if (that.results.params.sort) {
            gpii.ptd.api.lib.sorting.sort(filteredRecords, that.results.params.sort);
        }

        // Page the results.
        try {
            var pagerParams  = gpii.ptd.api.search.handler.getPagingParams(that);
            var pagedRecords = that.pager.pageArray(filteredRecords, pagerParams);

            // Let the "children" module look up any child records and wait for it.
            that.children.applier.change("originalRecords", pagedRecords);
        }
        catch (e) {
            that.sendResponse("500", { ok: false, message: "Error paging search results." });
        }
    }
    else {
        // We somehow did not receive records from couch.  Pass on whatever we did receive.
        that.sendResponse("500", { ok: false, message: body });
    }
};

gpii.ptd.api.search.handler.sendResults = function (that) {
    that.results.records = that.children.model.processedRecords;
    that.sendResponse(200, that.results);
};

gpii.ptd.api.search.handler.checkRequirements = function (that) {
    if (!that.options.ports.couch || !that.options.ports.lucene) {
        fluid.fail("The search API must have both a couch and lucene ports configured.");
    }
};

// Expander function that can be used to set a variable to today's date (in ISO 9660 format).
gpii.ptd.api.search.handler.setDate = function () {
    return (new Date()).toISOString();
};

gpii.ptd.api.search.handler.getPagingParams = function (that) {
    return gpii.ptd.api.lib.params.getRelevantParams(that.results.params, that.options.queryFields, "pagingField");
};

fluid.defaults("gpii.ptd.api.search.handler", {
    gradeNames:        ["gpii.schema.handler"],
    children:          false,
    typesWithChildren: ["term", "record"], // As in, "types of records that can have child records".  Not as in "dances with wolves".
    maxKeyData:        "{gpii.ptd.api.search}.options.maxKeyData",
    schemaDir:         "{gpii.ptd.api.search}.options.schemaDir",
    schemaKey:         "{gpii.ptd.api.search}.options.schemaKey",
    schemaUrl:         "{gpii.ptd.api.search}.options.schemaUrl",
    dbName:            "{gpii.ptd.api.search}.options.dbName",
    ports:             "{gpii.ptd.api.search}.options.ports",
    viewPath:          "_design/api/_view/entries",
    urls: {
        lucene:     {
            expander: {
                funcName: "fluid.stringTemplate",
                args:     ["http://localhost:%port/local/%db/_design/lucene/by_content", { port: "{that}.options.ports.lucene", db: "{that}.options.dbName"}]
            }
        },
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
        "q": {
        },
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
        "updated": {
            type:        "date",
            comparison:  "ge",  // We want records whose date is equal to or newer than the `updated` field
            filterField: true
        }
    },
    components: {
        "pager": {
            type: "gpii.ptd.api.lib.paging"
        },
        "children": {
            type: "gpii.ptd.api.lib.children",
            options: {
                ports:  "{gpii.ptd.api.search.handler}.options.ports",
                dbName: "{gpii.ptd.api.search.handler}.options.dbName",
                listeners: {
                    "onChildrenLoaded": {
                        funcName: "gpii.ptd.api.search.handler.sendResults",
                        args:     ["{gpii.ptd.api.search.handler}"]
                    }
                }
            }
        }
    },
    members: {
        results:   {
            ok:         true,
            total_rows: 0,
            params:     "{that}.params",
            records:    [],
            retrievedAt: {
                expander: {
                    funcName: "gpii.ptd.api.search.handler.setDate"
                }
            }
        }
    },
    listeners: {
        "onCreate.checkRequirements": {
            funcName: "gpii.ptd.api.search.handler.checkRequirements",
            args:     ["{that}"]
        }
    },
    invokers: {
        processLuceneResponse: {
            funcName: "gpii.ptd.api.search.handler.processLuceneResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        processCouchResponse: {
            funcName: "gpii.ptd.api.search.handler.processCouchResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        handleRequest: {
            funcName: "gpii.ptd.api.search.handler.handleRequest",
            args:     ["{that}"]
        }
    }
});

fluid.defaults("gpii.ptd.api.search", {
    gradeNames:     ["gpii.express.router.passthrough"],
    path:           "/search",
    querySchemaKey: "search-query.json",
    schemaKey:      "search.json",
    schemaUrl:      "https://terms.raisingthefloor.org/api/schemas/search.json",
    dbName:         "tr",
    maxKeyData:     7500,
    ports: {
        lucene: 5985
    },
    components: {
        schemaMiddleware: {
            type: "gpii.schema.middleware.hasParser",
            options: {
                schemaDir: "{gpii.ptd.api.search}.options.schemaDir",
                schemaKey: "{gpii.ptd.api.search}.options.querySchemaKey",
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
                handlerGrades:  ["gpii.ptd.api.search.handler"]
            }
        }
    }
});