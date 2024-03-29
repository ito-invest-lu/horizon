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

from odoo import api, fields, models

_logger = logging.getLogger(__name__)


class YearOpening(models.TransientModel):
    _name = "school.year_opening"
    _description = "Year Opening Wizard"

    year_id = fields.Many2one(
        "school.year", string="Year", required=True, ondelete="cascade"
    )

    program_to_duplicate_ids = fields.Many2many(
        "school.program", string="Program to Duplicate"
    )

    @api.model
    def default_get(self, fields):
        res = super().default_get(fields)
        current_year_id = self.env.user.current_year_id

        program_ids = self.env["school.program"].search(
            [["year_id", "=", current_year_id.id]]
        )
        return res.update(
            {
                "program_to_duplicate_ids": [
                    (4, program_id.id, False) for program_id in program_ids
                ],
            }
        )

    def action_open_year(self):
        self.ensure_one()
        ids = []
        for program in self.program_to_duplicate_ids:
            _logger.info("Duplicate %s" % program.name)
            uid = program.uid
            if uid.find("-", uid.find("-") + 1) < 0:
                new_uid = f"{uid}-{self.year_id.short_name}"
            else:
                new_uid = f"{uid[:uid.find('-', uid.find('-') + 1)]}-{self.year_id.short_name}"
            new_program = program.copy(
                default={"year_id": self.year_id.id, "uid": new_uid}
            )
            # TODO : Also duplicate the blocs UIDs
            ids.append(new_program.id)
        # return an action showing the created programs
        action = self.env.ref("school_management.action_program_form")
        result = action.read()[0]
        result["domain"] = [("id", "in", ids)]
        return result
