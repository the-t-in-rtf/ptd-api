/*

    An "auto-suggest" picker that:

    1. Lets you type in one words that might be found in the thing you want to "pick"
    2. Periodically queries a remote URL to look up suggestions.
    3. Lets you pick one of the suggestions using the mouse or keyboard.

    Within the PTD, we use this to associate aliases and translations with the common term.

 */
/* global fluid, jQuery */
(function ($) {
    "use strict";
    var gpii = fluid.registerNamespace("gpii");


    fluid.registerNamespace("gpii.ptd.api.frontend.picker.suggestions");

    // Update the current value with the "picked" suggestion and toggle the controls / value display
    gpii.ptd.api.frontend.picker.suggestions.pickParent = function (that, event) {
        var element   = $(event.currentTarget);
        var value     = JSON.parse(element.attr("value"));
        var changeSet = fluid.model.transformWithRules(value, that.options.rules.pickedToModel);
        // Reuse the "batch change" mechanism from `ajaxCapable`.
        gpii.templates.ajaxCapable.batchChanges(that, changeSet);
    };

    gpii.ptd.api.frontend.picker.suggestions.navigateWithinSuggestions = function (that, event) {
        var fromElement = that.locate("selectedSuggestion");
        var toElement   = null;
        switch (event.keyCode) {
            // Up arrow
            case 38:
                toElement = that.locate("suggestion").last();

                if (fromElement && fromElement.length > 0) {
                    var previous = fromElement.prev();
                    if (previous) {
                        toElement = previous;
                    }
                }

                if (fromElement) { fromElement.removeClass("picker-suggestion-selected"); }
                if (toElement) { toElement.addClass("picker-suggestion-selected"); }
                break;
            // Down arrow
            case 40:
                toElement = that.locate("suggestion").first();

                if (fromElement && fromElement.length > 0) {
                    var next = fromElement.next();
                    if (next) {
                        toElement = next;
                    }
                }

                if (fromElement) { fromElement.removeClass("picker-suggestion-selected"); }
                if (toElement) { toElement.addClass("picker-suggestion-selected"); }
                break;
            // Enter key or space bar
            case 13:
            case 32:
                // pick this element
                if (fromElement) { fromElement.keypress(); }
                break;
        }
    };

    fluid.defaults("gpii.ptd.api.frontend.picker.suggestions", {
        gradeNames: ["gpii.templates.templateMessage"],
        template:   "picker-suggestions",
        rules: {
            pickedToModel: {
                pickedId:    "uniqueId",
                picked:      ""
            }
        },
        model: {
            suggestions: [],
            picked:      null,
            pickedId:    null
        },
        selectors: {
            suggestion:         ".picker-suggestion",
            suggestions:        ".picker-suggestions",
            selectedSuggestion: ".picker-suggestion-selected"
        },
        modelListeners: {
            suggestions: {
                func:          "{that}.renderInitialMarkup",
                excludeSource: "init"
            }
        },
        listeners: {
            onMarkupRendered: [
                {
                    "this": "{that}.dom.suggestion",
                    method: "click",
                    args:   "{that}.pickParent"
                },
                {
                    "this": "{that}.dom.suggestion",
                    method: "keypress",
                    args:   "{that}.pickParent"
                },
                {
                    "this": "{that}.dom.suggestions",
                    method: "keydown",
                    args:   "{that}.navigateWithinSuggestions"
                }
            ]
        },
        invokers: {
            navigateWithinSuggestions: {
                funcName: "gpii.ptd.api.frontend.picker.suggestions.navigateWithinSuggestions",
                args: [ "{that}", "{arguments}.0"]
            },
            pickParent: {
                funcName: "gpii.ptd.api.frontend.picker.suggestions.pickParent",
                args: [ "{that}", "{arguments}.0"]
            }
        }
    });

    fluid.registerNamespace("gpii.ptd.api.frontend.picker");

    // Start checking for updates to the query
    gpii.ptd.api.frontend.picker.startPolling = function (that) {
        if (!that.polling) {
            that.polling = setInterval(function () { gpii.ptd.api.frontend.picker.pollForUpdates(that); }, 1000);
        }
    };

    // Check for updates to the query by firing a change.  If nothing has changed, nothing will be done
    gpii.ptd.api.frontend.picker.pollForUpdates = function (that) {
        that.applier.change("query", that.locate("query").val());
    };

    // Stop checking for updates to the query
    gpii.ptd.api.frontend.picker.stopPolling = function (that) {
        if (that.polling) {
            clearInterval(that.polling);
            that.polling = null;
        }
    };

    gpii.ptd.api.frontend.picker.startGatedRequest = function (that) {
        if (that.model.query && that.model.query.length > 0 && !that.isRequestActive) {
            that.makeRequest();
        }
    };

    // Whether our request is successful or not, we know the request is complete.
    gpii.ptd.api.frontend.picker.handleGatedFunction = function (that, fn, args) {
        that.isRequestActive = false;
        fn.apply(that, args);
    };

    // A record "looker upper" that looks up the full "picked" record when the "pickedId" changes.
    // to avoid double-polling, this only fires if `that.model.picked` is null.
    fluid.registerNamespace("gpii.ptd.api.frontend.picker.recordLookerUpper");
    gpii.ptd.api.frontend.picker.recordLookerUpper.lookupRecord = function (that) {
        if (that.model.pickedId && !that.model.picked) {
            that.makeRequest();
        }
    };

    fluid.defaults("gpii.ptd.api.frontend.picker.recordLookerUpper", {
        gradeNames: ["gpii.templates.ajaxCapable"],
        model: {
            picked:   null,
            pickedId: null
        },
        ajaxOptions: {
            url: {
                expander: {
                    funcName: "fluid.stringTemplate",
                    args:     ["{that}.options.urlTemplate", "{that}.model"]
                }
            },
            headers: {
                Accept: "application/json"
            }
        },
        rules: {
            successResponseToModel: {
                "":       "notfound",
                "picked": "responseJSON.records"
            },
            errorResponseToModel: {
                "":       "notfound",
                "picked": { literalValue: null}
            }
        },
        modelListeners: {
            pickedId: {
                funcName:      "gpii.ptd.api.frontend.picker.recordLookerUpper.lookupRecord",
                excludeSource: "init",
                args:          ["{that}"]
            }
        },
        listeners: {
            "onCreate.lookupRecord": {
                funcName: "gpii.ptd.api.frontend.picker.recordLookerUpper.lookupRecord",
                args:     ["{that}"]
            }
        }
    });

    // The main "picker" queries the "suggestions" URL and updates the model.  There is a child component that
    // handles the initial lookup of the "picked" record if it exists.
    fluid.defaults("gpii.ptd.api.frontend.picker", {
        gradeNames: ["gpii.templates.ajaxCapable", "gpii.templates.templateAware"],
        urls: {
            suggestions: "/api/search",
            lookup:      "/api/record/%pickedId"
        },
        ajaxOptions: {
            success: "{that}.handleGatedSuccess",
            error:   "{that}.handleGatedError",
            headers: {
                Accept: "application/json"
            }
        },
        templates: {
            initial: "picker-viewport"
        },
        rules: {
            successResponseToModel: {
                "":           "notfound",
                errorMessage: { literalValue: null},
                suggestions:  "responseJSON.records"
            },
            errorResponseToModel: {
                "":           "notfound",
                errorMessage: { literalValue: "Error looking up suggestions." },
                suggestions:  { literalValue: []}
            },
            modelToRequestPayload: {
                "":    "notfound",
                limit: { literalValue: 5},
                q:     "query"
            },
            ajaxOptions: {
                url: { literalValue: "{that}.options.urls.suggestions"}
            }
        },
        members: {
            isRequestActive: false,
            polling:         null
        },
        model: {
            picked:   null,
            pickedId: null,
            query:    null
        },
        selectors: {
            error:       ".picker-error",
            initial:     "{that}.options.container",
            query:       ".picker-search-query",
            suggestions: ".picker-suggestions-viewport",
            toggle:      ".picker-toggle"
        },
        invokers: {
            handleGatedError: {
                funcName: "gpii.ptd.api.frontend.picker.handleGatedFunction",
                args:     ["{that}", "{that}.handleError", "{arguments}"]
            },
            handleGatedSuccess: {
                funcName: "gpii.ptd.api.frontend.picker.handleGatedFunction",
                args:     ["{that}", "{that}.handleSuccess", "{arguments}"]
            },
            renderInitialMarkup: {
                func: "{that}.renderMarkup",
                args: ["initial", "{that}.options.templates.initial", "{that}.model", "html"]
            },
            startPolling: {
                funcName: "gpii.ptd.api.frontend.picker.startPolling",
                args:     ["{that}"]
            },
            stopPolling: {
                funcName: "gpii.ptd.api.frontend.picker.startPolling",
                args:     ["{that}"]
            }
        },
        modelListeners: {
            picked: {
                func:          "{that}.renderInitialMarkup",
                excludeSource: "init"
            },
            query: {
                funcName: "gpii.ptd.api.frontend.picker.startGatedRequest",
                args:     ["{that}"]
            }
        },
        listeners: {
            onDestroy: {
                func: "{that}.stopPolling"
            },
            onMarkupRendered: [
                {
                    func: "{that}.toggle.events.onRefresh.fire"
                },
                {
                    "this": "{that}.dom.query",
                    method: "focus",
                    args:   "{that}.startPolling"
                },
                {
                    "this": "{that}.dom.query",
                    method: "blur",
                    args:   "{that}.stopPolling"
                }
            ]
        },
        bindings: {
            "query": "query"
        },
        components: {
            toggle: {
                type:      "gpii.ptd.toggle",
                container: "{gpii.ptd.api.frontend.picker}.container",
                options: {
                    toggles: {
                        view: true,
                        edit: true
                    },
                    selectors: {
                        edit:   ".picker-edit",
                        toggle: ".picker-toggle",
                        view:   ".picker-view"
                    }
                }
            },
            errorMessage: {
                type:          "gpii.templates.templateMessage",
                createOnEvent: "onMarkupRendered",
                container:     "{gpii.ptd.api.frontend.picker}.dom.error",
                options: {
                    template: "common-error",
                    model: {
                        message: "{gpii.ptd.api.frontend.picker}.model.errorMessage"
                    }
                }
            },
            suggestions: {
                type:          "gpii.ptd.api.frontend.picker.suggestions",
                createOnEvent: "onMarkupRendered",
                container:     "{gpii.ptd.api.frontend.picker}.dom.suggestions",
                options: {
                    model: {
                        suggestions: "{gpii.ptd.api.frontend.picker}.model.suggestions",
                        pickedId:    "{gpii.ptd.api.frontend.picker}.model.pickedId",
                        picked:      "{gpii.ptd.api.frontend.picker}.model.picked",
                        query:       "{gpii.ptd.api.frontend.picker}.model.query"
                    }
                }
            },
            recordLookerUpper: {
                type: "gpii.ptd.api.frontend.picker.recordLookerUpper",
                options: {
                    urlTemplate: "{gpii.ptd.api.frontend.picker}.options.urls.lookup",
                    model: {
                        pickedId: "{gpii.ptd.api.frontend.picker}.model.pickedId",
                        picked:   "{gpii.ptd.api.frontend.picker}.model.picked"
                    }
                }
            }
        }
    });
})(jQuery);