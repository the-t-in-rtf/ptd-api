// Quick and dirty script to extract sample data from a couch instance and clean it up in a few useful ways. To wit:
//
//  1. Design documents are stripped.
//  2. Records are stripped of their meaningless Couch-isms (_id, _rev, etc.)
//  3. Clusters of related terms appear together in order.
//  4. Only the first 50 clusters are preserved.
//  5. The final structure wraps the records in `{ docs: [ records ] }`.
//
// The final output can be used with both the bulk document interface that CouchDb and Pouch provide.
//
"use strict";
var fluid = require("infusion");

var request = require("request");
var fs      = require("fs");
var path    = require("path");
var os      = require("os");

var options = {
    url: "http://admin:admin@localhost:5984/tr/_all_docs?include_docs=true"
};

var timestamp = (new Date()).getTime();
var output = path.resolve(os.tmpdir(), "records-" + timestamp + ".json");

function getKey(record) {
    if (record.aliasOf) {
        return record.aliasOf;
    }
    if (record.translationOf) {
        return record.aliasOf;
    }
    if (record.uniqueId) {
        return record.uniqueId;
    }
    return record._id;
}

function entryMatchesKeywords(entry) {
    var keywords      = ["android", "computer", "braille", "keyboard"];
    var fieldsToMatch = ["title", "description", "uid", "aliasOf"];

    var matches = false;

    fluid.each(keywords, function (keyword) {
        if (!matches) {
            fluid.each(fieldsToMatch, function (field) {
                if (!matches) {
                    if (entry[field] && entry[field].indexOf(keyword) !== -1) {
                        matches = true;
                    }
                }
            });
        }
    });

    return matches;
}

request(options, function (error, response, body) {
    var data = typeof body === "string" ? JSON.parse(body) : body;
    var processedData = [];

    fluid.each(data.rows, function (row) {
        var record = row.doc;

        if (record._id.indexOf("_design") === -1) {
            var fieldsToDelete = ["_id", "_rev", "source"];
            for (var a = 0; a < fieldsToDelete.length; a++) {
                var field = fieldsToDelete[a];
                if (record[field]) {
                    delete record[field];
                }
            }
            processedData.push(record);
        }
    });

    // Sort so that records are ordered by "cluster" and "type"
    processedData.sort(function (a, b) {
        var aKey = getKey(a);
        var bKey = getKey(b);
        if (aKey === bKey) {
            return 0;
        }
        if (aKey > bKey) {
            return 1;
        }
        if (aKey < bKey) {
            return -1;
        }
    });

    // Create a "whitelist" of clusters that crudely match a few keywords
    var whitelistMap = {};
    fluid.each(processedData, function (entry) {
        if (entryMatchesKeywords(entry)) {
            whitelistMap[getKey(entry)] = true;
        }
    });

    var whiteListUids = Object.keys(whitelistMap);

    // We only want the first few sets of records
    var maxClusters = 100;
    var accumulator = {};
    processedData = processedData.filter(function (entry) {
        if (entry._id) { return true; }
        else if (Object.keys(accumulator).length < maxClusters || whiteListUids.indexOf(getKey(entry)) !== -1) {
            accumulator[getKey(entry)] = true;
            return true;
        }

        return false;
    });

    fs.writeFile(output, JSON.stringify({ docs: processedData}, null, 2), {}, function () {
        console.log("Output saved to '" + output + "'...");
    });
});