// Tests for the "children" module.
"use strict";
var fluid = require("infusion");

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ptd.api.tests.childrenTests");

require("../../../src/js/server/lib/children");

require("./lib");

var jqUnit = require("node-jqunit");

fluid.registerNamespace("gpii.ptd.api.tests.childrenTestCaseHolder");
gpii.ptd.api.tests.childrenTestCaseHolder.confirmHasChildren = function (that) {
    var processedRecords = that.model.processedRecords;
    jqUnit.assertNotUndefined("There should be processed data...", processedRecords);
    jqUnit.assertTrue("There should be at least one processed record...", processedRecords.length > 0);
    fluid.each(processedRecords, function (record) {
        jqUnit.assertNotUndefined("There should be 'aliases' data for each term...", record.aliases);
        jqUnit.assertTrue("There should be at least one alias record for each term...", record.aliases.length > 0);
    });
};

gpii.ptd.api.tests.childrenTestCaseHolder.confirmHasNoChildren = function (that) {
    var processedRecords = that.model.processedRecords;
    jqUnit.assertNotUndefined("There should be processed data...", processedRecords);

    fluid.each(processedRecords, function (record) {
        jqUnit.assertUndefined("There should be no 'child' data...", record.aliases);
    });
};

// Wire in an instance of kettle.requests.request.http for each test and wire the check to its onError or onSuccess event
fluid.defaults("gpii.ptd.api.tests.children.caseHolder", {
    gradeNames: ["gpii.express.tests.caseHolder"],
    ports:      "{testEnvironment}.options.ports",
    dbName:     "records",
    testData: {
        "notReadyForChildren": [
            { type: "term" }, // No uniqueId
            { type: "bogus", uniqueId: "12345"}, // Wrong term type
            { type: "alias", uniqueId: "org.gnome.system.proxy.http.host" } // Real record, still the wrong `type`.
        ],
        "readyForChildren": [
            { type: "term", uniqueId: "adaptationType"},
            { type: "term", uniqueId: "alertDialog" },
            { type: "term", uniqueId: "alertDialogShowHelp" }
        ]
    },
    distributeOptions: [
        {
            source: "{that}.options.ports",
            target: "{that gpii.ptd.api.lib.children}.options.ports"
        },
        {
            source: "{that}.options.dbName",
            target: "{that gpii.ptd.api.lib.children}.options.dbName"
        }
    ],
    rawModules: [
        {
            tests: [
                {
                    name: "Testing adding children to term records...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "{readyForChildren}.applier.change",
                            args:     [ "originalRecords", "{testCaseHolder}.options.testData.readyForChildren" ]
                        },
                        {
                            listener: "gpii.ptd.api.tests.childrenTestCaseHolder.confirmHasChildren",
                            event:    "{readyForChildren}.events.onChildrenLoaded",
                            args:     ["{readyForChildren}"]
                        }
                    ]
                },
                {
                    name: "Testing adding children to non-term records...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "{notreadyForChildren}.applier.change",
                            args:     [ "originalRecords", "{testCaseHolder}.options.testData.notReadyForChildren" ]
                        },
                        {
                            listener: "gpii.ptd.api.tests.childrenTestCaseHolder.confirmHasNoChildren",
                            event:    "{notreadyForChildren}.events.onChildrenLoaded",
                            args:     ["{notreadyForChildren}"]
                        }
                    ]
                },
                {
                    name: "Testing misconfiguration (bad Couch URL)...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "{badDbUrl}.applier.change",
                            args:     [ "originalRecords", "{testCaseHolder}.options.testData.readyForChildren" ]
                        },
                        {
                            listener: "gpii.ptd.api.tests.childrenTestCaseHolder.confirmHasNoChildren",
                            event:    "{badDbUrl}.events.onChildrenLoaded",
                            args:     ["{badDbUrl}"]
                        }
                    ]
                },
                {
                    name: "Testing misconfiguration (incorrect view path)...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "{badViewPath}.applier.change",
                            args:     [ "originalRecords", "{testCaseHolder}.options.testData.readyForChildren" ]
                        },
                        {
                            listener: "gpii.ptd.api.tests.childrenTestCaseHolder.confirmHasNoChildren",
                            event:    "{badViewPath}.events.onChildrenLoaded",
                            args:     ["{badViewPath}"]
                        }
                    ]
                },
                {
                    name: "Testing misconfiguration (view path with a leading slash)...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "{reallyBadViewPath}.applier.change",
                            args:     [ "originalRecords", "{testCaseHolder}.options.testData.readyForChildren" ]
                        },
                        {
                            listener: "gpii.ptd.api.tests.childrenTestCaseHolder.confirmHasNoChildren",
                            event:    "{reallyBadViewPath}.events.onChildrenLoaded",
                            args:     ["{reallyBadViewPath}"]
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        readyForChildren: {
            type: "gpii.ptd.api.lib.children",
            options: {
                urls:   {
                    couch: "{caseHolder}.options.urls.db"
                }
            }
        },
        notreadyForChildren: {
            type: "gpii.ptd.api.lib.children",
            options: {
                urls: {
                    couch: "{caseHolder}.options.urls.db"
                }
            }
        },
        filteredOut: {
            type: "gpii.ptd.api.lib.children",
            options: {
                urls: {
                    couch: "{caseHolder}.options.urls.db"
                }
            }
        },
        badDbUrl: {
            type: "gpii.ptd.api.lib.children",
            options: {
                viewPath: "%baseUrlTotally/Bogus/View/"
            }
        },
        badViewPath: {
            type: "gpii.ptd.api.lib.children",
            options: {
                viewPath: "_design/api/_view/changeling"
            }
        },
        reallyBadViewPath: {
            type: "gpii.ptd.api.lib.children",
            options: {
                viewPath: "/_design/api/_view/changeling",  // The leading slash should not cause problems
                model: {
                    parentRecords: "{caseHolder}.options.testData.readyForChildren"
                }
            }
        }
    }
});

gpii.ptd.api.tests.testEnvironment({
    ports: {
        api:    9784,
        couch:  6985,
        lucene: 6555,
        mail:   7725
    },
    components: {
        testCaseHolder: {
            type: "gpii.ptd.api.tests.children.caseHolder"
        }
    }
});