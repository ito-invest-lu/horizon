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

from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    evaluation_open_year_id = fields.Many2one(
        comodel_name="school.year",
        string="Current Year for Evaluations",
        readonly=False,
        help="Only courses in current year could be evaluated.",
        config_parameter="school.evaluation_open_year_id",
    )

    evaluation_open_session = fields.Selection(
        ([("part", "Partial"), ("fin", "Final"), ("sec", "Second"), ("none", "None")]),
        string="Open Session",
        readonly=False,
        help="Only evaluation for current session can be encoded.",
        config_parameter="school.evaluation_open_session",
    )

    display_results = fields.Boolean(
        string="Display Results",
        readonly=False,
        help="Only evaluation for current session can be encoded.",
        config_parameter="school.display.results",
    )
