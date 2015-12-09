"use strict";
// TODO:  If we run these first, they pass, if we run them at the end of the list, they fail.
// I suspect a problem with `gpii-pouchdb-lucene`, `gpii-pouch` or the specific test harness used in this package, but
// need help investigating.

require("./search-tests");
require("./records-tests");

// Sub-component tests
require("./children-tests");
require("./filters-tests");
require("./paging-tests");
require("./params-tests");
require("./sorting-tests");

// API endpoint tests
require("./record-delete-tests");
require("./record-get-tests");

require("./record-post-tests"); // Works alone
require("./record-put-tests"); // Works alone