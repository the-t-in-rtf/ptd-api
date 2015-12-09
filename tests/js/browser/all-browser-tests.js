"use strict";
/*

 Nightmare does not currently clean up all of its listeners before it's destroyed, which results in warnings like the
 following when running more than 10 tests:

 ```
 (node) warning: possible EventEmitter memory leak detected. 11 uncaughtException listeners added. Use emitter.setMaxListeners() to increase limit.
 ```

 For now, we increase the number of listeners to supress the warning.

 TODO:  Remove the workaround once this issue is resolved: https://github.com/segmentio/nightmare/issues/282
 */
process.setMaxListeners(50);

require("./list-tests.js");
require("./picker-tests.js");
require("./toggle-tests.js");