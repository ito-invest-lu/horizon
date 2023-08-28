##############################################################################
#
#    Copyright (c) 2023 ito-invest.lu
#                       Jerome Sonnet <jerome.sonnet@ito-invest.lu>
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
import logging

_logger = logging.getLogger(__name__)

# class IndividualBloc(models.Model):
#     '''Individual Bloc'''
#     _inherit = 'school.individual_bloc'


#     def set_to_progress(self, context):
#         for bloc in self:
#             for icg in bloc.course_group_ids:
#                 for ic in icg.course_ids:
#                     if ic.dispense and not ic.is_dispense_approved:
#                         raise UserError(_('Cannot set program on progress, %s dispense in %s is not approved.' % (icg.name, bloc.name)))
#         return super(IndividualBloc, self).set_to_progress(context)

# class IndividualCourse(models.Model):
#     '''Individual Course'''
#     _inherit = ['school.individual_course']

#     is_dispense_approved = fields.Boolean(string="Is Dispense Approved", default=False, tracking=True)
#     dispense_approval_comment = fields.Text(string="Dispense Approval Comment")

#     dispense_char = fields.Char(string="Is Dispensed Text", compute="_compute_char", store=True)
#     is_dispense_approved_char = fields.Char(string="Is Dispense Approved Text", compute="_compute_char", store=True)

#     @api.depends('dispense','is_dispense_approved')

#     def _compute_char(self):
#         for ic in self:
#             ic.dispense_char = _('Dispensed') if ic.dispense else _('Not Dispensed')
#             ic.is_dispense_approved_char = _('Approuved') if ic.is_dispense_approved else _('Not Approuved')


#     @api.model
#     def _needaction_domain_get(self):
#         if self.env.user.partner_id.teacher:
#             return [('teacher_id','=',self.env.user.partner_id.id),('dispense', '=', True),('is_dispense_approved', '=', False)]
#         else:
#             return [('dispense', '=', True),('is_dispense_approved', '=', False)]
