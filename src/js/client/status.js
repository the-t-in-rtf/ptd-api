// TODO:  Agree on where this should live and move the base grade to that place.
// Common controls for the "status" field.  See the search and record components for example uses.
/* global fluid */
"use strict";
(function () {
    fluid.defaults("gpii.ptd.status", {
        gradeNames: ["gpii.ptd.select"],
        template:   "common-status-edit",
        selectors:  {
            initial: "",
            select:  "notfound" // You are expected to define this in the derived grade
        },
        select: {
            options: {
                "new": {
                    label: "New",
                    value: "new"
                },
                active: {
                    label: "Active",
                    value: "active"
                },
                discontinued: {
                    label: "Discontinued",
                    value: "discontinued"
                },
                deleted: {
                    label: "Deleted",
                    value: "deleted"
                }
            }
        }
    });
})();