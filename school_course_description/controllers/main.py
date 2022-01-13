﻿# -*- encoding: utf-8 -*-
##############################################################################
#
#    Copyright (c) 2015 be-cloud.be
#                       Jerome Sonnet <jerome.sonnet@be-cloud.be>
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################

import logging

from odoo import http
from odoo.http import request
from odoo import tools
from odoo.tools.translate import _

_logger = logging.getLogger(__name__)

class school_course_documentation(http.Controller):
    
    @http.route(['/course_doc/<model("school.course"):course>'], type='http', auth='public', website=True)
    def course_doc(self, course, redirect=None, **post):
        values = {
            'course' : course,
            'doc' : course.documentation_id,
        }
        return request.website.render("school_course_description.school_course", values)
        
    @http.route(['/course_group_doc/<model("school.course_group"):cg>'], type='http', auth='public', website=True)
    def course_group_doc(self, cg, redirect=None, **post):
        values = {
            'course' : cg,
            'doc' : course.documentation_id,
        }
        return request.website.render("school_course_description.school_course", values)
        
    @http.route(['/course_doc/edit/<model("school.course"):course>'], type='http', auth='user', website=True)
    def course_doc_edit(self, course, redirect=None, **post):
        draft_doc = course.env['school.course_documentation'].search([['course_id', '=', course.id],['state','=','draft']])
        if not draft_doc:
            active_doc = course.env['school.course_documentation'].search([['course_id', '=', course.id],['state','=','published']])
            if active_doc:
                draft_doc = active_doc.copy()
            else:    
                draft_doc = course.env['school.course_documentation'].create({'course_id' : course.id})
        values = {
            'course' : course,
            'doc' : draft_doc,
        }
        return request.website.render("school_course_description.school_course_edit", values)