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

from odoo import api, fields, models, tools, _
from odoo.exceptions import UserError, ValidationError
from odoo.tools.safe_eval import safe_eval

_logger = logging.getLogger(__name__)

class Deliberation(models.Model):
    '''Deliberation'''
    _name = 'school.deliberation'
    _description = 'Manage deliberation process'
    _inherit = ['school.year_sequence.mixin']
    
    state = fields.Selection([
            ('draft','Draft'),
            ('active', 'Active'),
            ('archived', 'Archived'),
        ], string='Status', index=True, readonly=True, default='draft',
        #track_visibility='onchange', TODO : is this useful for this case ?
        copy=False,
        help=" * The 'Draft' status is used when a new deliberation is created and not running yet.\n"
             " * The 'Active' status is when a deliberation is ready to be processed.\n"
             " * The 'Archived' status is used when a deliberation is obsolete and shall be archived.")
        
    year_id = fields.Many2one('school.year', required=True, string="Year")
    
    session = fields.Selection(
        ([('first','First'),('sec','Second'),('third','Third')]),
        string='Session',
        required=True)
    
    date = fields.Date(required=True, string="Date")
    
    title = fields.Char(required=True, string="Title")
    
    secretary_id = fields.Many2one('res.partner', required=True, domain=[('teacher','=',True)])
    
    individual_program_ids = fields.Many2many('school.individual_program', 'school_deliberation_program_rel', 'deliberation_id', 'program_id', string='Programs',domain=[('state','=','progess')])
    
    individual_program_count = fields.Integer(string='Programs Count', compute="_compute_counts")
    
    individual_bloc_ids = fields.Many2many('school.individual_bloc', 'school_deliberation_bloc_rel', 'deliberation_id', 'bloc_id', string='Blocs',domain=[('state','=','progess')])
    
    individual_bloc_count = fields.Integer(string='Blocs Count', compute="_compute_counts")
    
    def _compute_counts(self):
        for rec in self:
            rec.individual_program_count = len(rec.individual_program_ids)
            rec.individual_bloc_count = len(rec.individual_bloc_ids)
    
    def to_draft(self):
        return self.write({'state': 'draft'})

    def activate(self):
        return self.write({'state': 'active'})

    def archive(self):
        return self.write({'state': 'archived'})