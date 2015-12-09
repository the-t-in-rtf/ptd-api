/*

    A component to manage adding and removing items from a simple textual list.  Does not support ordering.

 */

/* global fluid, jQuery */
(function ($) {
    "use strict";
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.ptd.api.frontend.list");
    gpii.ptd.api.frontend.list.addItem = function (that) {
        var newItem = that.locate("addItem");
        if (newItem) {
            var newItems = that.model.items ? fluid.copy(that.model.items) : [];
            newItems.push($(newItem).val());
            that.applier.change("items", newItems);
        }
    };

    gpii.ptd.api.frontend.list.removeItem = function (that, event) {
        // "this" should be the item clicked
        // figure out its position

        // This depends on the markup to include a position attribute
        var position = $(event.currentTarget).attr("position");

        if (position) {
            var newItems = that.model.items ? fluid.copy(that.model.items) : [];
            newItems.splice(position, 1);
            that.applier.change("items", newItems);
        }
        else {
            console.log("Couldn't determine list position of use, and as a result couldn't remove it.");
        }
    };

    fluid.defaults("gpii.ptd.api.frontend.list", {
        gradeNames: ["gpii.templates.templateMessage"],
        template:   "common-list-edit",
        selectors: {
            "addItem":    "input[name='addItem']",
            "removeItem": ".remove-item"
        },
        invokers: {
            addItem: {
                funcName: "gpii.ptd.api.frontend.list.addItem",
                args: [ "{that}"]
            },
            removeItem: {
                funcName: "gpii.ptd.api.frontend.list.removeItem",
                args: [ "{that}", "{arguments}.0"]
            }
        },
        listeners: {
            onMarkupRendered: [
                {
                    "this": "{that}.dom.addItem",
                    method: "on",
                    args:   ["change", "{that}.addItem"]
                },
                {
                    "this": "{that}.dom.removeItem",
                    method: "on",
                    args:   ["click.removeItem", "{that}.removeItem"]
                },
                {
                    "this": "{that}.dom.removeItem",
                    method: "on",
                    args:   ["keypress.removeItem", "{that}.removeItem"]
                }
            ]
        }
    });
})(jQuery);
