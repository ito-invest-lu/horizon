/* global odoo, _, _t */
odoo.define('deliberation.DeliberationController', function (require) {
    "use strict";

    var BasicController = require('web.BasicController');
    var viewRegistry = require('web.view_registry');
    
    const KanbanController = require('web.KanbanController');

    KanbanController.include({

        /**
         * @override
         * @private
         */
        _onOpenRecord(ev) {
            if (this.actionViews.length > 1 && this.actionViews[1].type == 'deliberation') {
                console.log("Deliberate Bloc "+ev.data.id);
                ev.stopPropagation();
                var record = this.model.get(ev.data.id, {raw: true});
                this.trigger_up('switch_view', {
                    view_type: 'deliberation',
                    res_id: record.res_id,
                    mode: ev.data.mode || 'readonly',
                    model: this.modelName,
                });
            } else {
                this._super.apply(this, arguments);
            }
        },
    });
    
    var DeliberationController = BasicController.extend({
        
        custom_events: {
            close: '_onClose',
            deliberate_course_group: '_onDeliberateCourseGroup',
            reload_bloc: '_onReloadBloc',
            deliberate_next_bloc: '_onNextBloc',
            deliberate_previous_bloc: '_onPreviousBloc',
            fail_bloc : '_onFailBloc',
            postpone_bloc : '_onPostponeBloc',
            award_bloc : '_onAwardBloc',
        },

        init: function (parent, model, renderer, params) {
            this.model = model;
            this.renderer = renderer;
            this._super.apply(this, arguments);
        },

        start: function () {
            return this._super();
        },

        _onFailBloc: function (event) {
            var self = this;
            self._rpc({
                model: 'school.individual_bloc',
                method: "set_to_failed",
                args: [self.renderer.state.res_id, self.renderer.state.data.decision],
            }).then(function(result) {
                self._onNextBloc(event);
            });
        },
    
        _onPostponeBloc: function (event) {
            var self = this;
            self._rpc({
                model: 'school.individual_bloc',
                method: "set_to_postponed",
                args: [self.renderer.state.res_id, self.renderer.state.data.decision],
            }).then(function(result) {
                self._onNextBloc(event);
            });
        },

        _onAwardBloc: function (event) {
            event.stopPropagation();
            var self = this;
            console.log("Deliberate CG "+event.data['id']);
            this._rpc({
                model:'school.individual_bloc',
                method:'action_deliberate_bloc',
                args: [ [self.id] ],
                context: {...self.initialState.context,...{
                    default_bloc_id: parseInt(event.data['id']),
                    default_deliberation_id: parseInt(self.initialState.context['deliberation_id']),
                }},
            }).then(result => {
                self.do_action(result, { 'on_close' : self._onNextBloc.bind(self) });
            });
        },
        
        _onReloadBloc: function (event) {
            this.reload();
        },
        
        _onPreviousBloc: function (event) {
            if(event) {
                event.stopPropagation();
            }
            var currentIndex = this.renderer.state.res_ids.indexOf(this.renderer.state.res_id);
            if( currentIndex > 0) {
                const reloadParams = {
                    limit: 1,
                    offset: --currentIndex,
                };
                this.reload(reloadParams);
                this.trigger_up('scrollTo', { top: 0 });
            }
        },
        
        _onNextBloc: function (event) {
            if(event) {
                event.stopPropagation();
            }
            var currentIndex = this.renderer.state.res_ids.indexOf(this.renderer.state.res_id);
            if( currentIndex < this.renderer.state.res_ids.length - 1) {
                const reloadParams = {
                    limit: 1,
                    offset: ++currentIndex,
                };
                this.reload(reloadParams);
                this.trigger_up('scrollTo', { top: 0 });
            }
        },

        _onClose: function (ev) {
            event.stopPropagation();
            this.trigger_up('switch_view', {
                    view_type: 'kanban',
                    mode: ev.data.mode || 'readonly',
                    model: this.modelName,
                    controllerID: this.controllerID,
            });
        },
        
        _onDeliberateCourseGroup: function (event) {
            event.stopPropagation();
            var self = this;
            console.log("Deliberate CG "+event.data['id']);
            this._rpc({
                model:'school.individual_bloc',
                method:'action_deliberate_course_group',
                args: [ [self.id] ],
                context: {...self.initialState.context,...{
                    default_course_group_id: parseInt(event.data['id']),
                    default_deliberation_id: parseInt(self.initialState.context['deliberation_id']),
                }},
            }).then(result => {
                self.do_action(result, { 'on_close' : self._onReloadBloc.bind(self) });
            });
            
            /*this.do_action({
                type: 'ir.actions.act_window',
                name: 'Deliberate Course Group',
                target: 'new',
                flags: { action_buttons: true, headless: true },
                res_model:  'school.course_group_deliberation',
                context: {
                    default_course_group_id: parseInt(event.data['id']),
                    default_deliberation_id: parseInt(this.initialState.context['deliberation_id']),
                },
                views: [[false, 'form']],
            });*/
        },

    });

    return DeliberationController;

});