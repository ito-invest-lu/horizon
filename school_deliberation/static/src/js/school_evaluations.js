/*
# -*- encoding: utf-8 -*-
##############################################################################
#
#    Copyright (c) 2015 be-cloud.be
#                       Jerome Sonnet <jerome.sonnet@be-cloud.be>
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################
*/

/* global odoo, $ */

odoo.define('school_evaluations.action_school_evaluations_main', function (require) {
"use strict";

var core = require('web.core');

var Widget = require('web.Widget');
var Dialog = require('web.Dialog');
var rpc = require('web.rpc');
var session = require('web.session');

var BlocEditor = require('school_evaluations.school_evaluations_bloc_editor');
var ProgramEditor = require('school_evaluations.school_evaluations_program_editor');


var QWeb = core.qweb;
var _t = core._t;

var EvaluationConfigDialog = Dialog.extend({
    template: 'ConfigDialog',
    
    events: {
        'change .o_school_year_select': function (event) {
            event.preventDefault();
            this.parent.year_id = parseInt(this.$(event.currentTarget).find(":selected").attr('value'))
            this.parent.year_name = this.$(event.currentTarget).find(":selected").text();
        },
        "click .o_school_first_session": function (event) {
            event.preventDefault();
            this.parent.school_session = 1;
            this.$('.o_school_second_session').removeClass('active');
            this.$(event.currentTarget).addClass('active');
        },
        "click .o_school_second_session": function (event) {
            event.preventDefault();
            this.parent.school_session = 2;
            this.$('.o_school_first_session').removeClass('active');
            this.$(event.currentTarget).addClass('active');
        },
    },
    
    init: function(parent, title) {
        self = this;
        this._super.apply(this, arguments);
        this.parent = parent;
        this.school_session = parent.school_session;
    },
    
    start: function() {
        var self = this;
        var tmp = this._super.apply(this, arguments);
        var defs = [];
        self.$school_year_select = this.$('select.o_school_year_select');
        defs.push(
            rpc.query({
                model: 'school.year',
                method: 'read',
                args: [[],['id','name']],
            }).then(function(years) {
                years.map(function(year){
                                var o = new Option(year.name,year.id);
                                if (year.id == self.parent.year_id) {
                                    $(o).attr('selected',true);
                                }
                                self.$school_year_select.append(o);
                            });
                }));
        return $.when(tmp, defs);
    },
    
    close: function () {
        this._super();
        if(this.parent.school_session == 1) {
            this.parent.$('h2.o_school_deliberation_title').text("Délibération Première Session " + this.parent.year_name);
        } else {
            this.parent.$('h2.o_school_deliberation_title').text("Délibération Seconde Session " + this.parent.year_name);
        }
        this.parent.update_blocs();
    },
    
});

var EvaluationsAction = Widget.extend({
    template: 'MainView',
    
    events: {
        "click .o_school_group_item": function (event) {
            event.preventDefault();
            var self = this;
            this.$('.o_school_group_item.active').removeClass('active');
            this.$(event.currentTarget).addClass('active');
            var group_id = this.$(event.currentTarget).data('group-id');
            this.set_group(group_id);
        },
        "click .evaluation_config": function (event) {
            event.preventDefault();
            new EvaluationConfigDialog(this, {title : 'Evaluation Config'}).open();       
        },
        "click .o_school_bloc_item": function (event) {
            event.preventDefault();
            this.$('.o_school_bloc_item.active').removeClass('active');
            this.$(event.currentTarget).addClass('active');
            var bloc_id = this.$(event.currentTarget).data('bloc-id');
            this.set_bloc(bloc_id);
        },
        "click .o_school_musique": function (event) {
            event.preventDefault();
            this.school_domain = 1;
            this.$('.o_school_theatre').removeClass('active');
            this.$(event.currentTarget).addClass('active');
            this.update_blocs();
        },
        "click .o_school_theatre": function (event) {
            event.preventDefault();
            this.school_domain = 2;
            this.$('.o_school_musique').removeClass('active');
            this.$(event.currentTarget).addClass('active');
            this.update_blocs();
        },
    },
    
    init: function(parent, title) {
        this._super.apply(this, arguments);
        this.title = title;
        this.context = {};
        this.school_domain = 1;
        this.school_session = new Date().getMonth() < 7 ? 1 : 2;
        this.parent = parent;
        $('.o_main_navbar').addClass('o_hidden');
    },
    
    start: function() {
        var self = this;
        this._title = "Delibération";
        return rpc.query({
                model: 'res.users',
                method: 'read',
                args:  [session.uid, ['id','name','current_year_id']],
            }).then(
                    function(user) {
                        self.user = user[0];
                        self.year_id = self.user.current_year_id[0];
                        self.year_name = self.user.current_year_id[1];
                        if(self.school_session == 1) {
                            self.$('h2.o_school_deliberation_title').text("Délibération Première Session " + self.year_name);
                        } else {
                            self.$('h2.o_school_deliberation_title').text("Délibération Seconde Session " + self.year_name);
                        }
                }).then(
                    function() {
                        self.update_blocs();
                });
    },

    build_domain: function() {
        var domain = [];
        if(this.school_session == 1) {
            domain.push(['exclude_from_deliberation','=',false],['source_bloc_domain_id','=',this.school_domain],['year_id','=',this.year_id],['state','in',['progress','postponed','awarded_first_session']]);
        } else {
            domain.push(['exclude_from_deliberation','=',false],['source_bloc_domain_id','=',this.school_domain],['year_id','=',this.year_id],['state','in',['postponed','awarded_second_session','failed']]);
        }
        return domain;
    },
    
    update_blocs: function() {
        var self = this;
        
        this.groups = [
            {   
                'id' : 0, 
                'title' : "Bloc 1",
                'blocs' : [],
                'school_session' : this.school_session,
                'is_program' : false, // TODO : Can link to the editor class rather than this
            },
            { 
                'id' : 1, 
                'title' : "Bachelier",
                'blocs' : [],
                'school_session' : this.school_session,
                'is_program' : false,
            },
            { 
                'id' : 2, 
                'title' : "Cycle Bachelier",
                'blocs' : [],
                'school_session' : this.school_session,
                'is_program' : true,
            },
            { 
                'id' : 3, 
                'title' : "Master",
                'blocs' : [],
                'school_session' : this.school_session,
                'is_program' : false,
            },
            { 
                'id' : 4, 
                'title' : "Cycle Master",
                'blocs' : [],
                'school_session' : this.school_session,
                'is_program' : true,
            },
            { 
                'id' : 5, 
                'title' : "Agrégation",
                'blocs' : [],
                'school_session' : this.school_session,
                'is_program' : false,
            },
        ];
        var defs = [];
        
        defs.push(rpc.query({
                    model: 'school.individual_bloc',
                    method: 'search_read',
                    domain: self.build_domain().concat([['source_bloc_level', '=', 1]]),
                    fields: ['id','name','student_id','student_name','source_bloc_level','source_bloc_title','state'],
                    context: this.context,
                    order: 'student_name'
                }).then(function (data) {
                    if(data.length > 0){
                        self.groups[0].blocs = data;
                    }
                }));
        
        defs.push(rpc.query({
                    model: 'school.individual_bloc',
                    method: 'search_read',
                    domain: self.build_domain().concat(['|',['source_bloc_level', '=', 2],['source_bloc_level', '=', 3]]),
                    fields: ['id','name','student_id','student_name','source_bloc_level','source_bloc_title','state'],
                    context: this.context,
                    order: 'student_name'
                }).then(function (data) {
                    if(data.length > 0){
                        self.groups[1].blocs = data;
                    }
                }));
        
        defs.push(rpc.query({
                    model: 'school.individual_program',
                    method: 'search_read',
                    domain: [['state','in',['progress']],['cycle_id.short_name', '=', 'B'],['program_completed', '=', true],['domain_id','=',this.school_domain]],
                    fields: [],
                    context: this.context,
                    order: 'student_name'
                }).then(function (data) {
                    if(data.length > 0){
                        self.groups[2].blocs = data;
                    }
                }));
        
        defs.push(rpc.query({
                    model: 'school.individual_bloc',
                    method: 'search_read',
                    domain: self.build_domain().concat(['|',['source_bloc_level', '=', 4],['source_bloc_level', '=', 5]]),
                    fields: ['id','name','student_id','student_name','source_bloc_level','source_bloc_title','state'],
                    context: this.context,
                    order: 'student_name'
                }).then(function (data) {
                    if(data.length > 0){
                        self.groups[3].blocs = data;
                    }
                }));
          
        defs.push(rpc.query({
                    model: 'school.individual_program',
                    method: 'search_read',
                    domain: [['state','in',['progress']],['cycle_id.short_name', '=', 'M'],['program_completed', '=', true],['domain_id','=',this.school_domain]],
                    fields: [],
                    context: this.context,
                    order: 'student_name'
                }).then(function (data) {
                    if(data.length > 0){
                        self.groups[4].blocs = data;
                    }
                }));  
        
        
        defs.push(rpc.query({
                    model: 'school.individual_bloc',
                    method: 'search_read',
                    domain: self.build_domain().concat([['source_bloc_level', '=', 6]]),
                    fields: ['id','name','student_id','student_name','source_bloc_level','source_bloc_title','state'],
                    context: this.context,
                    order: 'student_name'
                }).then(function (data) {
                    if(data.length > 0){
                        self.groups[5].blocs = data;
                    }
                }));

        $.when.apply($,defs).then(function(){
            self.render_sidebar();
        });  
    },
    
    render_sidebar: function () {
        var $sidebar = $(QWeb.render("SideBar", this));
        this.$(".sidebar").html($sidebar);
        this.$('.main_navbar').metisMenu();
    },
    
    set_group: function(group_id) {
        var self = this;
        var group = this.groups[group_id];
        if(group) {
            this.$(".sub_sidebar").hide();
            var $sidebar = $(QWeb.render("SubSideBar", group));
            this.$(".sub_sidebar").html($sidebar);
            this.$('.sub_navbar').metisMenu();
            var ids = [];
            for (var i=0, ii=group.blocs.length; i<ii; i++) {
                ids.push(group.blocs[i].id);
            }
            if(group.is_program) {
                self.editor = new ProgramEditor(self, {});
            } else {
                self.editor = new BlocEditor(self, {});
            }
            self.$('.editor').remove();
            self.show_startup();
            self.editor.appendTo(self.$('.o_evaluation_editor'));
            self.editor.read_ids(ids).then(
                function(){
                    self.$(".sub_sidebar").show();
                } 
            );    
        } else {
            this.$(".sub_sidebar").empty();
        }
    },
    
    set_bloc: function(bloc_id) {
        this.editor.set_bloc_id(bloc_id);
    },
    
    show_startup: function() {
        this.$('.o_startup_screen').removeClass('o_hidden');
    },
    
    hide_startup: function() {
        this.$('.o_startup_screen').addClass('o_hidden');
    },
    
    /**
     * Get the title of the thread window, which usually contains the name of
     * the thread.
     *
     * @returns {string}
     */
    getTitle: function () {
        return this._title;
    },
    
    /**
     * In some situations, we need confirmation from the controller that the
     * current state can be destroyed without prejudice to the user.  For
     * example, if the user has edited a form, maybe we should ask him if we
     * can discard all his changes when we switch to another action.  In that
     * case, the action manager will call this method.  If the returned
     * promise is successfully resolved, then we can destroy the current action,
     * otherwise, we need to stop.
     *
     * @returns {Promise} resolved if the action can be removed, rejected
     *   otherwise
     */
    canBeRemoved: function () {
        return Promise.resolve();
    },
    
    });
       
    core.action_registry.add('school_evaluations.main', EvaluationsAction);

});