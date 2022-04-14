/* global odoo, _, $ */
odoo.define('deliberation.DeliberationRenderer', function (require) {
    "use strict";

    var AbstractRenderer = require('web.BasicRenderer');
    // var core = require('web.core');
    // var qweb = core.qweb;

    var DeliberationRenderer = AbstractRenderer.extend({
        events: _.extend({}, AbstractRenderer.prototype.events, {
        }),
        _render: function () {
            this.$el.append(
                $('<div>').addClass('container o_d_main_container'),
            );
            this._renderHeader();
            this.$el.append(
                $('<button>').text('Close').click(ev => this.trigger_up('close')),
            );
            return $.when();
        },
        
        _renderHeader : function () {
            $('.o_d_main_container').append(
                $('<div>').addClass('row').text('This is some text'),
            );
            return $.when();
        },
        
    });

    return DeliberationRenderer;

});