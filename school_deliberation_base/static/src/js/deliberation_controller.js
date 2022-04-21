/* global odoo, _ */
odoo.define('deliberation.DeliberationController', function (require) {
    "use strict";

    var BasicController = require('web.BasicController');


    var DeliberationController = BasicController.extend({
        
        custom_events: {
            close: '_onClose'
        },

        init: function (parent, model, renderer, params) {
            this.model = model;
            this.renderer = renderer;
            this._super.apply(this, arguments);
        },

        start: function () {
            return this._super();
        },

        _onClose: function (event) {
            var self = this;
            self._rpc({
                // Get view id
                model:'ir.model.data',
                method:'xmlid_to_res_model_res_id',
                args: ['school_deliberation_base.deliberation_bloc_kanban_view','school_deliberation_base.view_deliberation_bloc_filter'],
            }).then(function(data){                
                // Open view
                self.do_action({
                    'type': 'ir.actions.act_window',
                    'name': 'Deliberate Blocs',
                    'res_model': 'school.individual_bloc',
                    'domain': [['deliberation_ids', 'in', self.initialState.context.deliberation_id]],
                    'view_mode': 'kanban',
                    'views': [[data[1], 'kanban']],
                 });
            });
        },

    });

    return DeliberationController;

});