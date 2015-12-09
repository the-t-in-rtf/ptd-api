/*

    The record viewing and editing interface, based on a `templateFormControl` component.  The initial data is
    provided by the template renderer and the `initBlock` helper.

    The view and edit form are always rendered, but the edit form is hidden by default.  If the user is logged in,
    an "Edit Record" toggle is displayed that can be used to hide the view form and show the edit form.

    Switching the `type` field has special meaning, in that only certain fields are allowed for each record type.  We
    must redraw the viewport if the `type` changes.  Our templates use the `equals` helper and the `type` field to
    decide which fields to display.

 */
/*
    TODO:  Tests we need, in no particular order...

    1. Toggling the edit form off and on.
    2. Editing all fields
    3. switching record types
      a. The form should update
      b. No inappropriate data from the previous record type should be submitted.
      c. All type-appropriate data should be preserved on a round trip from term->alias->term
    4. Confirming that all fields are rendered correctly for all record types.
    5. Confirming that the edit form is not visible when the user is not logged in.
    6. Submitting invalid data (there should be error feedback, preferably on the right field)
    7. Adding uses data
    8. Removing uses data
    9. Linking an alias to a term.

    // TODO: Create a derived or parallel grade that works with new records, and wire that in to GET /api/record/ (HTML only, JSON should return a 404)
    2. adding a new record
 */
/* global fluid, jQuery */

(function ($) {
    "use strict";
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.ptd.api.frontend.record.edit");

    // We work with a clone of the original record until our changes are saved.
    gpii.ptd.api.frontend.record.edit.cloneOriginalRecord = function (that) {
        that.applier.change("record", fluid.copy(that.model.originalRecord));
    };

    // A gatekeeper function to prevent the cloning of the original record from triggering a redraw until we are
    // actually ready.
    gpii.ptd.api.frontend.record.edit.redrawOnTypeChange = function (that) {
        if (that.locate) {
            that.renderInitialMarkup();
        }
    };

    // We use a standard `templateFormControl` for the editing.
    fluid.defaults("gpii.ptd.api.frontend.record.edit", {
        gradeNames:   ["gpii.templates.templateFormControl"],
        baseUrl:      "/api/record/",
        hideOnSuccess: false,
        ajaxOptions: {
            method:      "PUT",
            dataType:    "json",
            json:        true
        },
        rules: {
            successResponseToModel: {
                "":             "notfound",
                originalRecord: "responseJSON.record",
                successMessage: "responseJSON.message",
                errorMessage:   { literalValue: undefined }
            },
            errorResponseToModel: {
                "":              "notfound",
                errorMessage:    "responseJSON.message",
                successMesssage: { literalValue: undefined }
            },
            modelToRequestPayload: {
                "": "record"
            },
            ajaxOptions: {
                url: {
                    transform: {
                        type:     "fluid.transforms.stringTemplate",
                        template: "%baseUrl%uniqueId",
                        terms: {
                            baseUrl:  "{that}.options.baseUrl",
                            uniqueId: "{that}.model.record.uniqueId"
                        },
                        value: "https://issues.fluidproject.org/browse/FLUID-5703" // <--- The bug that requires this unused block.
                    }
                }
            }
        },
        templates: {
            initial: "record-edit"
        },
        components: {
            uses: {
                type:          "gpii.ptd.api.frontend.list",
                createOnEvent: "onMarkupRendered",
                container:     ".uses-container",
                options: {
                    template:   "record-edit-uses",
                    model: {
                        items: "{gpii.ptd.api.frontend.record.edit}.model.record.uses"
                    }
                }
            },
            picker: {
                type:          "gpii.ptd.api.frontend.picker",
                createOnEvent: "onMarkupRendered",
                container:     ".alias-picker-viewport",
                options: {
                    model: {
                        picked: "{that}.model.record.aliasOf"
                    }
                }
            }
        },
        bindings: {
            aliasOf:       "originalRecord.aliasOf",
            defaultValue:  "originalRecord.defaultValue",
            definition:    "originalRecord.definition",
            notes:         "originalRecord.notes",
            status:        "originalRecord.status",
            termLabel:     "originalRecord.termLabel",
            translationOf: "originalRecord.translationOf",
            type:          "originalRecord.type",
            uniqueId:      "originalRecord.uniqueId",
            valueSpace:    "originalRecord.valueSpace"
        },
        selectors: {
            addUse:        "input[name='addUse']",
            aliasOf:       "input[name='aliasOf']",
            defaultValue:  "input[name='defaultValue']",
            definition:    "[name='definition']",
            notes:         "[name='notes']",
            parentLink:    ".ptd-link-container",
            removeUse:     ".remove-use",
            submit:        ".record-edit-save",
            status:        "input[name='status']",
            termLabel:     "input[name='termLabel']",
            translationOf: "input[name='translationOf']",
            type:          "input[name='type']",
            usesContainer: ".uses-container",
            uniqueId:      "input[name='uniqueId']",
            valueSpace:    "input[name='valueSpace']"
        },
        modelListeners: {
            originalRecord: {
                funcName: "gpii.ptd.api.frontend.record.edit.cloneOriginalRecord",
                args:     ["{that}"]
            },
            "record.type": {
                funcName: "gpii.ptd.api.frontend.record.edit.redrawOnTypeChange",
                args:     ["{that}"]
            }
        }
    });

    fluid.defaults("gpii.ptd.api.frontend.record.view", {
        gradeNames: ["gpii.templates.templateMessage"],
        template:   "record-view",
        components: {
            successMessage: {
                type:      "gpii.templates.templateMessage",
                container: ".record-view-viewport .success",
                options: {
                    template:  "common-success",
                    model: {
                        message: "{gpii.ptd.api.frontend.record.view}.model.successMessage"
                    },
                    modelListeners: {
                        message: { func: "{that}.renderInitialMarkup" },
                        record: { func: "{that}.renderInitialMarkup"  }
                    }
                }
            }
        }
    });


    fluid.registerNamespace("gpii.ptd.api.frontend.record");

    gpii.ptd.api.frontend.record.handleSuccess = function (that, success) {
        if (success) {
            that.toggleControls.performToggle();
        }
    };

    // A wrapper component that controls whether view or edit is displayed.
    fluid.defaults("gpii.ptd.api.frontend.record", {
        gradeNames:   ["fluid.viewComponent"],
        model: {
            successMessage: null,
            errorMessage:   null,
            user:           null,
            record:         null
        },
        events: {
            onChildMarkupRendered: null
        },
        components: {
            edit: {
                type:      "gpii.ptd.api.frontend.record.edit",
                container: ".record-edit-viewport",
                options: {
                    model: {
                        user:           "{gpii.ptd.api.frontend.record}.model.user",
                        originalRecord: "{gpii.ptd.api.frontend.record}.model.record",
                        successMessage: "{gpii.ptd.api.frontend.record}.model.successMessage",
                        errorMessage:   "{gpii.ptd.api.frontend.record}.model.errorMessage"
                    },
                    listeners: {
                        "requestReceived.handleSuccess": {
                            funcName: "gpii.ptd.api.frontend.record.handleSuccess",
                            args:     ["{gpii.ptd.api.frontend.record}", "{arguments}.0"]
                        },
                        "onMarkupRendered.notifyParent": {
                            func: "{gpii.ptd.api.frontend.record}.events.onChildMarkupRendered.fire"
                        }
                    }
                }
            },
            view: {
                type:      "gpii.ptd.api.frontend.record.view",
                container: ".record-view-viewport",
                options: {
                    model: {
                        record:         "{gpii.ptd.api.frontend.record}.model.record",
                        user:           "{gpii.ptd.api.frontend.record}.model.user",
                        successMessage: "{gpii.ptd.api.frontend.record}.model.successMessage"
                    },
                    listeners: {
                        "onMarkupRendered.notifyParent": {
                            func: "{gpii.ptd.api.frontend.record}.events.onChildMarkupRendered.fire"
                        }
                    }
                }
            },
            toggleControls: {
                type:          "gpii.ptd.toggle",
                container:     "{record}.container",
                options: {
                    toggles: {
                        editForm: true,
                        viewForm: true
                    },
                    selectors: {
                        editForm: ".record-edit-viewport",
                        viewForm: ".record-view-viewport",
                        toggle:   ".record-toggle"
                    },
                    events: {
                        // Our view may be redrawn over and over again, and we have to make sure our bindings work each time.
                        onRefresh: {
                            events: {
                                parentReady: "{record}.events.onChildMarkupRendered"
                            }
                        }
                    },
                    listeners: {
                        "onCreate.applyBindings": {
                            func: "{that}.events.onRefresh.fire"
                        }
                    }
                }
            }
        }
    });
})(jQuery);