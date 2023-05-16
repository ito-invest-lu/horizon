# -*- encoding: utf-8 -*-
##############################################################################
#
#    Copyright (c) 2023 ito-invest.lu
#                       Jerome Sonnet <jerome.sonnet@ito-invest.lu>
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

class ResUser(models.Model):
    _inherit = 'res.users'

    national_id = fields.Char(string='National ID')

class ResCompany(models.Model):
    _inherit = 'res.company'

    webservices_key = fields.Binary(string='Web Services Keys')
    # TODO : store encoded ?
    webservices_key_passwd = fields.Char(string='Web Services Key Password')
    webservices_certificate = fields.Binary(string='Web Services Certificate')

    fase_code = fields.Char('FASE code')
