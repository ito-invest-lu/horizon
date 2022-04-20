/* global odoo, _, $ */
odoo.define('deliberation.DeliberationRenderer', function (require) {
    "use strict";

    var BasicRenderer = require('web.BasicRenderer');
    var utils = require('web.utils');
    // var core = require('web.core');
    // var qweb = core.qweb;

    var DeliberationRenderer = BasicRenderer.extend({
        
        events: _.extend({}, BasicRenderer.prototype.events, {
        }),
        
        _render: function () {
            this.$el.append(
                $('<div>').addClass('container-fluid o_d_main_container').append(
                    this._renderHeader(),
                    this._renderContent(),
                    this._renderFooter(),
                ),
                $('<button>').text('Close').click(ev => this.trigger_up('close')),
            );
            return $.when();
        },
        
        _renderHeader : function () {
            var record = this.state.data;
            var program = this.state.programValue;
            var $header = $('<div>',{class : 'row bloc_header mt-4'});
            var $col1 = $('<div>',{class : 'col-2'});
            var $img = $('<img>',{ 
                'class' : 'img img-fluid img-thumbnail ml16',
                'src' : this._getImageURL('res.partner','image_256',record.student_id.data.id,'student picture'),
                'style' : 'min-height: 256px;',
            });
            $col1.append($img);
            $header.append($col1);
            var $col2 = $('<div>',{class : 'col-10'});
            $col2.append(`
                    <div class="row">
                        <span class="col-md-10">
                            <h1 class="display-4">${record.student_id.data.display_name}</h1>
                        </span>
                        <span class="col-md-2 refresh_button">
                            <button class="btn btn-default o_reload_bloc" type="button">
                                <i class="fa fa-refresh fa-fw fa-2x"></i>
                            </button>
                        </span>
                    </div>
                    <div class="row">
                        <span class="col">
                            <h1 class="display-5">${record.source_bloc_title} - ${record.source_bloc_level}</h1>
                        </span>
                    </div>
                    <div class="row d-flex align-items-center" style="margin-bottom: 10px;">
                        <div class="col-md-2">
                            <button class="btn btn_credits" type="button">
                                PAE<br/><span class="score_value">${record.total_acquiered_credits}/${record.total_credits}</span>
                            </button>
                        </div>
                        <div class="col-md-8">
                            <div role="alert" class="alert alert-danger" style="margin-bottom: 0px;">N'a pas validé tous les crédits ECTS de son PAE et est ajourné(e).</div>
                        </div>
                        <div class="col-md-2">
                            <button type="button" class="btn btn-lg btn-danger bloc_postpone">Ajourné</button>
                        </div>
                    </div>
            `);
            var program_total = Math.max(program.required_credits,program.total_registered_credits);
            $col2.append(`
            <div class="row vertical-align justify-content-center">
                <div class="progress col-10" style="height: 40px;">
                    <div class="progress-bar bg-info" style="width:${program.total_acquiered_credits/program_total*100}%">
                        ${program.total_acquiered_credits}
                    </div>
                    <div class="progress-bar bg-success" style="width:${record.total_acquiered_credits/program_total*100}%">
                        ${record.total_acquiered_credits}
                    </div>
                    <div class="progress-bar bg-warning" style="width:${(record.total_credits-record.total_acquiered_credits)/program_total*100}%">
                        ${record.total_credits-record.total_acquiered_credits}
                    </div>
                    </t>
                </div>
            </div>
            `);
            $header.append($col2);
            return $header;
        },
        
        _renderContent : function () {$
            var record = this.state.data;
            var $content = $('<div>',{class : 'row bloc_content mt-4'});
            var $col1 = $('<div>',{class : 'col-2'});
            $col1.append(this._renderSideContent());
            $content.append($col1);
            var $col2 = $('<div>',{class : 'col-10'});
            var $table = $('<table>', {
                'class' : 'table table-condensed table-bordered result_table',
                'style' : 'font-size:180%;'});
            $table.append(`
                <colgroup>
                    <col style="width:20px">
                    <col style="width:500">
                    <col style="width:50px">
                    <col style="width:50px">
                    <col style="width:75px">
                    <col style="width:20px">
                </colgroup>
                <thead class="thead-light">
                    <tr>
                        <th class="text-center">#</th>
                        <th>Intitulé</th>
                        <th>Rés</th>
                        <th>Cre</th>
                        <th>Acq</th>
                        <th></th>
                    </tr>
                </thead>`);
            var $tbody = $('<tbody>');
            for(var i =0; i < record.course_group_ids.data.length; i++) {
                var course_group = record.course_group_ids.data[i];
                $tbody.append(`<tr class="course_group">
                    <th class="text-center" scope="row">
                        ${i+1}
                    </th>
                    <td>
                        ${course_group.data.title}
                    </td>
                    <td style=" text-align: right;">
                    </td>
                    <td style=" text-align: right;">
                        ${course_group.data.total_credits}
                    </td>
                    <td>
                        <span class="label label-warning btn o_set_delib" data-course-group-id="29654">NoAcq</span>
                    </td>
                    <td>
                        <i aria-hidden="true" class="fa fa-search o_school_edit_icg" role="button" data-cg-id="29654"></i>
                    </td>
                </tr>`);
                for(var j = 0; j < course_group.data.course_ids.data[j]; j++) {
                     var course = course_group.data.course_ids.data[j];
                     console.log(course);
                }
            }
            $table.append($tbody);
            $col2.append($table);
            $content.append($col2);
            return $content;
        },
        
        _renderSideContent : function () {
            
        },
            
        _renderFooter : function () {
        },
        
        /**
         * @private -- FROM KANBAN SOURCE COPYRIGHT ODOO
         * @param {string} model the name of the model
         * @param {string} field the name of the field
         * @param {integer} id the id of the resource
         * @param {string} placeholder
         * @returns {string} the url of the image
         */
        _getImageURL: function (model, field, id, placeholder) {
            id = (_.isArray(id) ? id[0] : id) || null;
            var isCurrentRecord = this.modelName === model && (this.recordData.id === id || (!this.recordData.id && !id));
            var url;
            if (isCurrentRecord && this.record[field] && this.record[field].raw_value && !utils.is_bin_size(this.record[field].raw_value)) {
                // Use magic-word technique for detecting image type
                url = 'data:image/' + this.file_type_magic_word[this.record[field].raw_value[0]] + ';base64,' + this.record[field].raw_value;
            } else if (placeholder && (!model || !field || !id || (isCurrentRecord && this.record[field] && !this.record[field].raw_value))) {
                url = placeholder;
            } else {
                var session = this.getSession();
                var params = {
                    model: model,
                    field: field,
                    id: id
                };
                if (isCurrentRecord) {
                    params.unique = this.record.__last_update && this.record.__last_update.value.replace(/[^0-9]/g, '');
                }
                url = session.url('/web/image', params);
            }
            return url;
        },
        
    });

    return DeliberationRenderer;

});