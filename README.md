# Introduction

This package provides a copy of the API used to power the [Preference Terms Dictionary](https://terms.raisingthefloor.org/).

It includes both the server side implementation, andn all of the required schemas and reference client-side components.

# Running this package

For testing purposes, you can just run src/tests/js/launch-test-harness.js, which will set up an instance of [PouchDB](http://pouchdb.com/)
and a [workalike implementation of Lucene](https://github.com/GPII/gpii-pouchdb-lucene).  This will load the sample data
in tests/data on each run, and will not persist any changes you make.

To set up a production instance of the API, you will need:

1. A running instance of [CouchDB](http://couchdb.apache.org/)
2. A running instance of [CouchDB Lucene](https://github.com/rnewson/couchdb-lucene)
3. To install the views required by the API (see the instructions in src/couchapp), including those used for Lucene integration.

The [repository for the PTD website](https://github.com/GPII/ptd-website) provides a good example of using this API in
a full-fledged site.