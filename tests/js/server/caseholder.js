/*

  The tests in this directory work with an instance of the API whose search is powered by `gpii-pouchdb-lucene`.

  In order for this component to be shut down cleanly between runs, you must use or extend this `testCaseHolder`.

  This picks up the standard start of sequence from `gpii.express.tests.caseHolder` and adds steps at the end of each
  sequence to shut down lucene and to wait for shutdown to complete.

 */
var fluid = require("infusion");

fluid.defaults("gpii.ptd.api.tests.caseHolder", {
    gradeNames: ["gpii.express.tests.caseHolder"],
    sequenceEnd: [
        {
            func: "{testEnvironment}.shutdownLucene"
        },
        {
            listener: "fluid.identity",
            event: "{testEnvironment}.events.onLuceneShutdownComplete"
        }
    ]
});