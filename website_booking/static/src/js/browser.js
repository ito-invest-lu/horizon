odoo.define('website_booking.browser', function (require) {
"use strict";

/* global moment, Materialize, $, location, odoo, gapi */

var core = require('web.core');
var ajax = require('web.ajax');
var session = require('web.Session');
var Widget = require('web.Widget');
var time = require('web.time');

var Model = require("web.Model");

var qweb = core.qweb;

ajax.loadXML('/website_booking/static/src/xml/browser.xml', qweb);

var CalendarWidget = Widget.extend({
    template: 'website_booking.browser_calendar',
    
    get_fc_init_options: function() {
        return {
            header : {
                 left:   'prev',
                 center: 'title,today',
                 right:  'next'
             },
            themeSystem : 'bootstrap3',
    		allDaySlot : false,
    		locale: moment.locale,
    		timezone: "local",
    		editable: false,
    		height: 755,
    		locale: 'fr',
    		titleFormat: 'dddd D MMMM YYYY',
    		defaultDate: moment(),
    		defaultView: 'agendaDay',
    		minTime: "08:00:00",
    		maxTime: "22:00:00",
    		navLinks: true, // can click day/week names to navigate views
    		eventLimit: true, // allow "more" link when too many events
    		refetchResourcesOnNavigate : false,
    		resourceRender: function(resourceObj, labelTds, bodyTds) {
    		    if(resourceObj.booking_policy === 'preserved' || resourceObj.booking_policy === 'out') {
    		        labelTds.css('background', '#cccccc');    
    		    }
            },
        }
    },
    
    renderElement: function() {
        this._super.apply(this, arguments);
        var self = this;
        self.$calendar = this.el;
        self.$calendar.fullCalendar(
		    self.get_fc_init_options()
		);
    },
    
    start : function() {
        this._super.apply(this, arguments);
        var self = this;
        // Force a refresh to get it right
        setTimeout(function() {
            self.$calendar.fullCalendar('changeView','agendaDay');
            //self.$('.fc-button').removeClass('fc-button fc-state-default fc-corner-left fc-corner-right').addClass('waves-effect waves-light btn');
        }, 100);
    },
    
    refetch_events: function() {
        this.$calendar.fullCalendar('refetchEvents');
    },
    
    do_show : function() {
        this._super.apply(this, arguments);
        var self = this;
        setTimeout(function() {
            self.$calendar.fullCalendar('refetchEvents').then(function(){
                self.$calendar.fullCalendar('changeView','agendaDay');    
            });
            //self.$('.fc-button').removeClass('fc-button fc-state-default fc-corner-left fc-corner-right').addClass('waves-effect waves-light btn');
        }, 100);
    },
    
});

var Schedule =  CalendarWidget.extend({

    init: function(parent, options) {
        this._super.apply(this, arguments);
        this.date = parent.date;
        this.user = parent.user;
        this.asset_id = false;
    },

    get_fc_init_options: function() {
        var self = this;
        return $.extend(this._super(),{
            header: {
                left: '',
    			center: '',
    			right:'',
    		},
            defaultDate: this.date,
            height: 350,
            events: self.fetch_events.bind(this),
            allDaySlot: false,
            dayClick: self.day_click.bind(this),
        });
    },
    
    day_click : function(date, jsEvent, view) {
        this.trigger_up('click_scheduler', {'date' : date, 'jsEvent' : jsEvent, 'view' : view});
    },
    
    fetch_events: function(start, end, timezone, callback) {
        var self = this;
        // Ambuigus time moment are confusing for Odoo, needs UTC
        try {
            if(!start.hasTime()) {
                start = moment(start.format())        
            }
            if(!end.hasTime()) {
                end = moment(end.format())        
            }
        } catch(e) {}
        if(self.asset_id) {
            self.events = [];
            ajax.jsonRpc('/booking/events', 'call', {
    	    		'asset_id':this.asset_id,
    				'start' : time.moment_to_str(start),
    				'end' : time.moment_to_str(end),
    	    	}).done(function(events){
                    events.forEach(function(evt) {
                        self.events.push({
                            'start': moment.utc(evt.start).local().format('YYYY-MM-DD HH:mm:ss'),
                            'end': moment.utc(evt.stop).local().format('YYYY-MM-DD HH:mm:ss'),
                            'title': /*evt.partner_id[1] + " - " +*/ evt.name,
                            'allDay': evt.allday,
                            'id': evt.id,
                            'resourceId':evt.room_id[0],
                            'resourceName':evt.room_id[1],
                            'color': '#FA8FB1',
                            'user_id' : evt.user_id[0],
                        });
                    });
                    //console.log([start, end, events])
                    callback(self.events);
                }
            );
        }
    },
    
    set_asset_id: function(asset_id) {
        this.asset_id = asset_id;
        this.refetch_events();
    },
    
});

var DetailsDialog = Widget.extend({
    template: 'website_booking.details_dialog',
    
    init: function(parent, options) {
        this.event = options.event;
        console.log(this.event);
    },
    
});

var NewBookingDialog = Widget.extend({
    template: 'website_booking.new_booking_dialog',
    
    events: {
        "click .request-booking": function (event) {
            var self = this;
            var fromTime = self.$('#from_hour').timepicker('getTime');
            var toTime = self.$('#to_hour').timepicker('getTime');
            var start = moment(self.date).local().set('hour',fromTime.getHours()).set('minutes',fromTime.getMinutes()).set('seconds',0);
            var stop = moment(self.date).local().set('hour',toTime.getHours()).set('minutes',toTime.getMinutes()).set('seconds',0);
            var roomId = parseInt(self.$( "select.select-asset-id" ).val());
            var event_type = 'school_student_event_type';
            if(self.user.in_group_15) {
                event_type = 'school_teacher_event_type';
            }
            if(self.user.in_group_14) {
                event_type = 'school_management_event_type';
            }
            new Model('ir.model.data').call('get_object_reference', ['school_booking', event_type]).then(function(categ) {
                if(self.edit_mode) {
                    new Model('calendar.event').call('write', [[self.event.id], {
                        'name' : self.$('#description').val(),
                        'start': start.utc().format('YYYY-MM-DD HH:mm:ss'),
                        'stop': stop.utc().format('YYYY-MM-DD HH:mm:ss'),
                        'room_id': roomId,
                        'categ_ids': [[4, categ[1]]],
                    }]).then(function (id) {
                        self.trigger_up('updateEvent', {'id': id});
                    });
                } else {
                    new Model('calendar.event').call('create', [{
                        'name' : self.$('#description').val(),
                        'start': start.utc().format('YYYY-MM-DD HH:mm:ss'),
                        'stop': stop.utc().format('YYYY-MM-DD HH:mm:ss'),
                        'room_id': roomId,
                        'categ_ids': [[4, categ[1]]],
                    }]).fail(function(error) {
                        if(error.data.exception_type == "validation_error"){
                            Materialize.toast(error.data.arguments[0], 4000)
                        }
                    }).then(function (id) {
                        self.trigger_up('newEvent', {'id': id});
                    });
                }
            });
        },
        "click .delete-booking" : function (event) {
            var self = this;
            new Model('calendar.event').call('unlink', [self.event.id]).done(function () {
                self.trigger_up('deleteEvent', self.event.id);
            });
        },
        "change .select-asset-id": function (event) {
            this.schedule.set_asset_id(parseInt(this.$( "select.select-asset-id" ).val()));
            this.updateSendButton();
        },
        "change #from_hour": function (event) {
            var self = this;
            var fromTime = self.$('#from_hour').timepicker('getTime', this.date.toDate());
            var events = this.schedule.events;
            self.$('#from_hour').removeClass('invalid');
            self.$('#from_hour').addClass('valid');
            for (event in events) {
                if (moment(events[event].start).isBefore(fromTime) && moment(events[event].end).isAfter(fromTime)){
                    self.$('#from_hour').removeClass('valid');
                    self.$('#from_hour').addClass('invalid');
                    break;
                } 
            }
            self.hasChanged = true;
            self.updateRoomList();
            self.updateSendButton();
        },
        "change #to_hour": function (event) {
            var self = this;
            var fromTime = self.$('#from_hour').timepicker('getTime', this.date.toDate());
            var toTime = self.$('#to_hour').timepicker('getTime', this.date.toDate());
            var events = this.schedule.events;
            self.$('#to_hour').removeClass('invalid');
            self.$('#to_hour').addClass('valid');
            for (event in events) {
                if (moment(events[event].start).isBefore(toTime) && moment(events[event].end).isAfter(toTime)){
                    self.$('#to_hour').removeClass('valid');
                    self.$('#to_hour').addClass('invalid');
                    break;
                } 
            }
            if(!self.user.in_group_14 && !self.user.in_group_15) {
                if((fromTime.getHours() + fromTime.getMinutes()/60) > (toTime.getHours() + toTime.getMinutes()/60 - 0.5)) {
                    self.$('#to_hour').removeClass('valid');
                    self.$('#to_hour').addClass('invalid');
                }
                if((fromTime.getHours() + fromTime.getMinutes()/60) < (toTime.getHours() + toTime.getMinutes()/60 - 2)) {
                    self.$('#to_hour').removeClass('valid');
                    self.$('#to_hour').addClass('invalid');
                }
            } else {
                self.$('#to_hour').removeClass('invalid');
                self.$('#to_hour').addClass('valid');
            }
            self.hasChanged = true;
            self.updateRoomList();
            self.updateSendButton();
        },
    },
    
    custom_events: {
        'click_scheduler' : 'click_scheduler',
    },
    
    init: function(parent, options) {
        this._super.apply(this, arguments);
        this.parent = parent;
        this.user = parent.session.user;
        if(options && options.event){
            this.ressources = parent.cal.ressources;
            this.date = options.event.start;
            this.event = options.event;
            this.edit_mode = true;
        } else {
            this.ressources = parent.cal.ressources;
            this.date = parent.cal.$calendar.fullCalendar( 'getDate' );
            this.edit_mode = false;
        }
    },

    renderElement: function() {
        this._super.apply(this, arguments);
        var self = this;
        // Fill navigation panel
        self.schedule = new Schedule(this);
        self.schedule.appendTo(this.$(".schedule"));
    },

    start: function() {
        this._super.apply(this, arguments);
        var self = this;
        self.$('select.select-asset-id').material_select();
        self.$('#from_hour').timepicker({
            'timeFormat': 'H:i',
            'minTime': '8:00',
            'maxTime': '21:30',
            'step' : 60,
        });
        self.$('#from_hour').on('change', function() {
            var newTime = self.$('#from_hour').timepicker('getTime');
            self.$('#to_hour').timepicker('option', 'minTime', newTime);
        });
        self.$('#to_hour').timepicker({
            'timeFormat': 'H:i',
            'minTime': '8:30',
            'maxTime': '22:00',
            'showDuration': true,
            'step' : 60,
        });
        if(self.edit_mode) {
            self.$('#from_hour').val(self.event.start.format('H:mm'));
            self.$('#from_hour').removeClass('invalid');
            self.$('#from_hour').addClass('valid');
            self.$('#to_hour').val(self.event.end.format('H:mm'));
            self.$('#to_hour').removeClass('invalid');
            self.$('#to_hour').addClass('valid');
            self.$('#description').val(self.event.title);
            self.updateRoomList();
            self.$('select.select-asset-id').val(self.event.resourceId).change();
            self.$('select.select-asset-id').material_select();
            self.$('.delete-booking').show();
            self.hasChanged = false;
        } else {
            self.$('#description').val(session.partner.name);
        }
        Materialize.updateTextFields();
        self.hasChanged = false;
    },

    click_scheduler: function(event) {
        var requested_date = event.data.date;
        session.user_context.tz;
        var id = time;
        this.$('#from_hour').timepicker('setTime', requested_date.format("HH:mm"));
        this.$('#to_hour').timepicker('option', 'minTime', requested_date.format("HH:mm"));
        requested_date.add(1, 'hours');
        this.$('#to_hour').timepicker('setTime', requested_date.format("HH:mm"));
        var events = this.schedule.events;
        for (event in events) {
            if (moment(events[event].start).stripZone().isBefore(requested_date) && moment(events[event].end).stripZone().isAfter(requested_date)){
                requested_date.add(-0.5, 'hours');
                this.$('#to_hour').timepicker('setTime', requested_date.format("HH:mm"));
                break;
            }
        }
        this.$('#from_hour').removeClass('invalid');
        this.$('#to_hour').removeClass('invalid');
        this.$('#from_hour').addClass('valid');
        this.$('#to_hour').addClass('valid');
        this.updateRoomList();
    },
    
    updateRoomList: function() {
        var self = this;
        var fromTime = self.$('#from_hour').timepicker('getTime');
        var toTime = self.$('#to_hour').timepicker('getTime');
        if (fromTime && toTime) {
            var start = moment(self.date).local().set('hour',fromTime.getHours()).set('minutes',fromTime.getMinutes()).set('seconds',0);
            var stop = moment(self.date).local().set('hour',toTime.getHours()).set('minutes',toTime.getMinutes()).set('seconds',0);
            ajax.jsonRpc('/booking/rooms', 'call', {
        				'start' : time.moment_to_str(start),
        				'end' : time.moment_to_str(stop),
        				'self_id' : self.event ? self.event.id : '',
    	    	}).done(function(rooms){
                var roomSelect = self.$('select.select-asset-id').empty().html(' ');
                for(var room_idx in rooms) {
                    var room = rooms[room_idx];
                    // add new value
                    roomSelect.append(
                      $("<option></option>")
                        .attr("value",room.id)
                        .text(room.name)
                    );
                }
                roomSelect.removeAttr( "disabled" )
        	    roomSelect.material_select();
        	    Materialize.updateTextFields();
        	    self.updateSendButton();
        	});
        }
    },
    
    updateSendButton: function() {
        if(this.$('.invalid').length > 0) {
            this.$('.request-booking').attr( 'disabled', '' );
        } else {
            this.$('.request-booking').removeAttr( 'disabled' );
        }
    },
    
});

var NavigationCard = Widget.extend({
    template: 'website_booking.browser_navigation_card',
    
    events: {
        "click .cat_button": function (event) {
            event.preventDefault();
            var self = this;
            self.getParent().$('.navbar-card.active').removeClass('active');
            self.$(event.currentTarget).addClass('active');
            var category_id = self.$(event.currentTarget).data('category-id');
            if(self.to_parent) {
                self.trigger_up('up_category', {'category' : self.category});
            } else {
                self.trigger_up('click_category', {'category' : self.category});
            }
        },
    },
    
    init: function(parent, category, to_parent) {
        this._super(parent);
        this.category = category;
        this.to_parent = to_parent;
    },
    
    set_active: function() {
        this.getParent().$el.find('.darken-4').removeClass('darken-4').addClass('darken-3')
        this.$el.find('.cat_button').addClass('darken-4');
    },
    
});

var Navigation = Widget.extend({
    template: 'website_booking.browser_navigation',
    
    custom_events: {
        'click_category' : 'click_category',
        'up_category' : 'up_category',
    },
    
    start: function() {
        this._super.apply(this, arguments);
        var self = this;
        this.state = this.getParent()._current_state;
        if(this.state.category_id && this.state.category_id > 0) {
            ajax.jsonRpc('/booking/category', 'call', {'id' : this.state.category_id}).done(function(category){
                if(category[0].is_leaf) {
                    self.selected_category = category[0];
                    ajax.jsonRpc('/booking/category', 'call', {'id' : self.selected_category.parent_id[0]}).done(function(category){
                        self.display_category = category[0];
                        if(self.display_category.parent_id) {
                            ajax.jsonRpc('/booking/category', 'call', {'id' : self.display_category.parent_id[0]}).done(function(category){
                                self.parent_category = category[0];
                                self.renderCategories();
                                self.trigger_up('switch_category', {'category' : self.selected_category});
                            });
                        } else {
                            self.parent_category = self.create_root();
                            self.renderCategories();
                            self.trigger_up('switch_category', {'category' : self.selected_category});
                        }
                    });
                } else {
                    self.selected_category = false;
                    self.display_category = category[0];
                    if(self.display_category.parent_id) {
                        ajax.jsonRpc('/booking/category', 'call', {'id' : self.display_category.parent_id[0]}).done(function(category){
                            self.parent_category = category[0];
                            self.renderCategories();
                            self.trigger_up('switch_category', {'category' : self.display_category});
                        });
                    } else {
                        self.parent_category = self.create_root();
                        self.renderCategories();
                        self.trigger_up('switch_category', {'category' : self.display_category});
                    }
                }
            });
        } else {
            this.display_category = this.create_root();
            this.selected_category = false;
            this.parent_category = false;
            this.renderCategories();
        }
    },
    
    create_root : function(){
        return {
            'id' : 0,
            'name' : 'Root',
            'isRoot' : true,
        }
    },
    
    renderCategories: function() {
        var self = this;
        if(this.display_category) {
            if(this.display_category.isRoot) {
                ajax.jsonRpc('/booking/categories', 'call', {'root' : 1}).done(function(categories){
                    self.$(".categories").empty();
                    categories.forEach(function(category) {
                        var card = new NavigationCard(self, category, false);
                        card.appendTo(self.$(".categories"));
                        if(category.id == self.selected_category.id) {
                            card.set_active();
                        }
                    });
                });
            } else {
                ajax.jsonRpc('/booking/categories', 'call', {'parent_id' : this.display_category.id}).done(function(categories){
                    self.$(".categories").empty();
                    categories.forEach(function(category) {
                        var card = new NavigationCard(self, category, false);
                        card.appendTo(self.$(".categories"));
                        if(category.id == self.selected_category.id) {
                            card.set_active();
                        }
                    });
                    if(self.parent_category) {
                        var card = new NavigationCard(self, self.parent_category, true);
                        card.appendTo(self.$(".categories"));
                    }
                });
            }
        }
    },

    click_category : function(event) {
        var cat = event.data.category;
        if(cat.is_leaf) {
            this.selected_category = cat;
            event.target.set_active();
            this.trigger_up('switch_resource', {'resource' : cat});
        } else {
            this.parent_category = this.display_category;
            this.display_category = cat;
            this.renderCategories();
            this.trigger_up('switch_category', {'category' : cat});
        }
    },
    
    up_category : function(event) {
        var self = this;
        if(self.parent_category.isRoot) {
            this.display_category = this.create_root();
            this.selected_category = false;
            this.parent_category = false;
            self.renderCategories();
        } else {
            if (self.parent_category.parent_id) {
                ajax.jsonRpc('/booking/category', 'call', {'id' : self.parent_category.parent_id[0]}).done(function(category){
                    self.display_category = self.parent_category;
                    self.parent_category = category;
                    self.selected_category = false;
                    self.renderCategories();
                });
            } else {
                self.display_category = self.parent_category;
                self.parent_category = this.create_root();
                self.selected_category = false;
                self.renderCategories();
            }
        }
        self.trigger_up('switch_category', {'category' : self.display_category});
    },
    
});

var Calendar = CalendarWidget.extend({

    get_fc_init_options: function() {
        var self = this;
        return $.extend(this._super(),{
            events: self.fetch_events.bind(this),
    		resources: self.fetch_resources.bind(this),
    		viewRender: function(view,element){
    		     self.trigger_up('switch_date', {'date' : self.$calendar.fullCalendar( 'getDate' )});
    		},
    		eventClick: function(calEvent, jsEvent, view) {
    		    var now = moment();
    		    if(session.user.in_group_14 || session.uid == calEvent.user_id) {
    		        if (moment(calEvent.start) > now) {
            		    var dialog = new NewBookingDialog(self.getParent(), {'event' : calEvent});
                        dialog.appendTo(self.getParent().main_modal.empty());
                        self.getParent().main_modal.modal('open');
    		        } else {
    		            Materialize.toast('You cannot edit booking in the past', 2000);
    		        }
    		    } else {
    		        var details_dialog = new DetailsDialog(self.getParent(), {'event' : calEvent});
    		        details_dialog.appendTo(self.getParent().details_modal.empty());
    		        self.getParent().details_modal.modal('open');
    		    }
            },
            header : {
                left:   'prev',
                center: 'title,today',
                right:  'next'
            },
        });
    },
    
    start: function() {
        this._super.apply(this, arguments);
        this.init_state = this.getParent()._current_state;
        if(this.init_state.date) {
            this.$calendar.fullCalendar( 'gotoDate', moment(this.init_state.date));
        }
    },
           
    fetch_resources : function(callback) {
        var self = this;
        self.ressources = [];
	    ajax.jsonRpc('/booking/assets', 'call', {'category_id':self.category_id}).done(function(assets){
                assets.forEach(function(asset) {
                    self.ressources.push({
                        'id' : asset.id,
                        'title' : asset.name,
                        'booking_policy' : asset.booking_policy,
                    });
                });
                callback(self.ressources);
                self.trigger_up('switch_ressources', {'ressources' : self.ressources});
            }
        );
    },
    
    fetch_events: function(start, end, timezone, callback) {
        var self = this;
		self.events = [];
		// Ambuigus time moment are confusing for Odoo, needs UTC
        try {
            if(!start.hasTime()) {
                start = moment(start.format())        
            }
            if(!end.hasTime()) {
                end = moment(end.format())        
            }
        } catch(e) {}
	    ajax.jsonRpc('/booking/events', 'call', {
	    		    'category_id':self.category_id,
    				'start' : time.moment_to_str(start),
    				'end' : time.moment_to_str(end),
	    	}).done(function(events){
	    	    
	    	    events.forEach(function(evt) {
                    var color = '#ff4355';
    	    	    if (evt.categ_ids.includes(9)) {
    	    	        color = '#00bcd4';
    	    	    } else {
    	    	        if(evt.categ_ids.includes(7)) {
    	    	            color = '#2962ff';
    	    	        } else {
    	    	            if(evt.categ_ids.includes(8)) {
        	    	            color = '#e65100';
        	    	        } else {
        	    	            if (session.uid == evt.user_id[0]) {
        	    	                color = '#ffc107';
        	    	            }
        	    	        }
    	    	        }
    	    	    } 
                    self.events.push({
                        'start': moment.utc(evt.start).local().format('YYYY-MM-DD HH:mm:ss'),
                        'end': moment.utc(evt.stop).local().format('YYYY-MM-DD HH:mm:ss'),
                        'title': /*evt.partner_id[1] + " - " +*/ evt.name,
                        'allDay': evt.allday,
                        'id': evt.id,
                        'resourceId':evt.room_id[0],
                        'resourceName':evt.room_id[1],
                        'color': color,
                        'user_id' : evt.user_id[0],
                    });
                });
                //console.log([start, end, events])
                callback(self.events);
            }
        );
    },
    
    switch_category : function(category) {
        this.category_id = category.id;
        this.$calendar.fullCalendar( 'refetchResources' );
    },
    
    switch_resource : function(resource) {
        this.category_id = resource.id;
        this.$calendar.fullCalendar( 'refetchResources' );
        this.$calendar.fullCalendar( 'refetchEvents' );
    },
    
    goto_date : function(d) {
        this.$calendar.fullCalendar('gotoDate', d);
    },
    
});

var Toolbar = Widget.extend({
    template: 'website_booking.toolbar',
    
    events : {
        "click #login-button" : function (event) {
            ajax.jsonRpc('/booking/login_providers', 'call', {redirect : '/booking#category_id=16'}).done(function(providers){
                if(providers.length > 0) {
                    var provider = providers[0];
                    var link = provider.auth_link
                    window.location.replace(provider.auth_link);
                }
            });    
        },
        "click #help-booking-button": function (event) {
            window.open('http://www.crlg.be/2018/03/15/musique-horizon-booking', '_blank', '');    
        },
        "click #logout-booking-button": function (event) {
            var self = this;
            self.is_logged = false;
            self.uid = false;
            self.avatar_src = false;
            self.$el.html(qweb.render('website_booking.toolbar_nolog', {widget : self}));
            self.rpc("/web/session/destroy", {}).always(function(o) {
                    window.open("http://accounts.google.com/logout", "something", "width=550,height=570");
                    location.reload();
            })
        },
    },
    
    init : function() {
        this._super.apply(this, arguments);
        var self = this;
        session.session_bind().then(function(){
            if (session.uid) {
                self.is_logged = true;
                self.uid = session.uid;
                new Model('res.users').call("search_read", 
                    [[["id", "=", session.uid]], ["id","name","in_group_14","in_group_15","in_group_16",]],
                    {context: session.context}).then(function (user_ids) {
                        session.user = user_ids[0];
                        self.user = session.partner;
                });
                new Model('res.partner').call("search_read", 
                    [[["id", "=", session.partner_id]], ["id","name"]],
                    {context: session.context}).then(function (partner_ids) {
                        session.partner = partner_ids[0];
                        self.partner = session.partner;
                });
                self.avatar_src = session.url('/web/image', {model:'res.users', field: 'image_small', id: session.uid});
                self.$el.html(qweb.render('website_booking.toolbar_log', {widget : self}));
                self.$el.openFAB();
            } else {
                self.$el.html(qweb.render('website_booking.toolbar_nolog', {widget : self}));
            }
        });
    },
    
});

var Browser = Widget.extend({
    template: 'website_booking.browser',
    
    events: {
        "click #add-booking-button": function (event) {
            var self = this;
            event.preventDefault();
            var dialog = new NewBookingDialog(this);
            dialog.appendTo(self.main_modal.empty());
            self.main_modal.modal('open');
        },
        
        "click #goto-date-button": function (event) {
            var self = this;
            this.cal.goto_date(moment(this.$('.datepicker').val(),'DD/MM/YYYY'));
        },
        
    },
    
    custom_events: {
        'switch_resource' : 'switch_resource',
        'switch_category' : 'switch_category',
        'switch_ressources' : 'switch_ressources',
        'switch_date' : 'switch_date',
        'newEvent': function(event) {
            this.cal.refetch_events();
        },
        'deleteEvent': function(event) {
            this.cal.refetch_events();
        },
        'updateEvent': function(event) {
            this.cal.refetch_events();
        },
    },
    
    renderElement: function() {
        this._super.apply(this, arguments);
        this._current_state = $.deparam(window.location.hash.substring(1));
        var self = this;
        // Fill toolbar
        self.tb = new Toolbar(this);
        self.tb.appendTo(this.$(".booking_toolbar"));
        // Fill navigation panel
        self.nav = new Navigation(this);
        self.nav.appendTo(this.$(".navbar"));
        // Fill calendar panel
        self.cal = new Calendar(this);
        self.cal.appendTo(this.$(".calendar"));
        self.cal.tb = self.tb;
        this.$('.datepicker').datepicker($.datepicker.regional[ "fr" ]);
    },
    
    start: function() {
        this._super.apply(this, arguments);
        var self = this;
        /* TODO : why this.$('#main-modal') does not work ? */
        self.main_modal = this.$('#main-modal-content').parent().modal();
        self.details_modal = this.$('#modal-details-content').parent().modal();
        this.$('.collapsible').collapsible();
    },
    
    switch_category: function(event) {
        this.do_push_state({
            'category_id' : event.data.category.id,
        });
        this.cal.switch_category(event.data.category);
    },
    
    switch_resource: function(event) {
        this.do_push_state({
            'category_id' : event.data.resource.id,
        });
        this.cal.switch_resource(event.data.resource);
    },
    
    switch_ressources: function(event) {
        var self = this;
        if(event.data.ressources.length == 0) {
            self.$('#add-booking-button').addClass('hide');
            self.$('.calendar_header').removeClass('active');
            self.$(".collapsible").collapsible({accordion: true});
            self.$(".collapsible").collapsible({accordion: false});
        } else {
            self.$('#add-booking-button').removeClass('hide');
            self.$('.calendar_header').addClass('active');
            self.$(".collapsible").collapsible();
            self.cal.do_show()
        }
    },
    
    switch_date: function(event) {
        this.do_push_state({
            'date' : event.data.date.format("YYYY-MM-DD"),
        });   
    },
    
    do_push_state: function(state) {
        state = $.extend(this._current_state, state);
        var url = '#' + $.param(state);
        this._current_state = $.deparam($.param(state), false); // stringify all values
        $.bbq.pushState(url);
        this.trigger('state_pushed', state);
    },
    
});

core.action_registry.add('website_booking.browser', Browser);

return Browser;

});