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
import traceback

from odoo import api, fields, models, _
from odoo.exceptions import MissingError
from odoo.tools.safe_eval import safe_eval

import json
from zeep import helpers

_logger = logging.getLogger(__name__)

class Partner(models.Model):
    _inherit = 'res.partner'

    is_linked_to_bced_personne = fields.Boolean(string='Is linked to BCED Personne', default=False)

    def action_update_bced_personne(self):
        for rec in self :
            if rec.is_linked_to_bced_personne :
                try :
                    # TODO : update contact information from BCED Web Service
                    rec.update_contact_information(rec, None)
                except Exception as e :
                    _logger.error('Error while updating contact information : %s', e)
                    return {
                        'type': 'ir.actions.client',
                        'tag': 'display_notification',
                        'params': {
                            'message': _('Error while updating contact information : %s' % traceback.format_exc()),
                            'next': {'type': 'ir.actions.act_window_close'},
                            'sticky': False,
                            'type': 'warning',
                        }
                    }

class BCEDPersonne(models.TransientModel):
    _name = "school.bced_personne_wizard"
    _description = "BCED Personne Wizard"
    
    student_id = fields.Many2one('res.partner', string='Student', required=True)

    student_name = fields.Char(related='student_id.name', string='Name', readonly=True)
    student_image_512 = fields.Binary('Image', attachment=True, related='student_id.image_512', readonly=True)
    student_niss = fields.Char(related='student_id.reg_number', string='Niss', readonly=True)
    student_firstname = fields.Char(related='student_id.firstname', string='First Name', readonly=True)
    student_lastname = fields.Char(related='student_id.lastname', string='Last Name', readonly=True)
    student_birthdate_date = fields.Date(related='student_id.birthdate_date', string='Birth Date', readonly=True)

    state = fields.Selection([('draft','Draft'),('no_bced', 'No BCED'), ('candidate_bced', 'Candidate BCED'), ('bced', 'Has BCED')], string='State', default='draft')

    candidate_person_ids = fields.One2many('school.bced_personne_summary', 'wizard_id', string='Candidate Persons')

    selected_person_id = fields.Many2one('school.bced_personne_summary', string='Selected Person')
       
    def action_retrieve_bced_persons(self):
        self.ensure_one()
        ws = self.env['school.webservice'].search([('name', '=', 'bced_personne')], limit=1)
        data = ws.searchPersonByName(self.student_id)
        if data.status and data.status['code'] == 'SOA5100000':
            self.state = 'no_bced'
        elif data.status and data.status['code'] == 'SOA0000000':
            self.state = 'candidate_bced'
            if data.persons and data.persons.person:
                for person in data.persons.person:
                    self.candidate_person_ids |= self.candidate_person_ids.create({
                        'firstname': ' '.join(person.name.firstName),
                        'lastname': ' '.join(person.name.lastName),
                        # parse birthdate
                        'birthdate': fields.Date.to_date(person.birth.officialBirthDate),
                        'niss': person.personNumber,
                        'wizard_id': self.id,
                        'data': json.dumps(helpers.serialize_object(person, dict)),
                    })
        return { 
            'type': 'ir.actions.act_window',
            'name': 'BCED Personne',
            'view_mode': 'form',
            'res_model': 'school.bced_personne_wizard',
            'res_id': self.id,
            'target': 'new',
        }

    def action_link_bced_personne(self):
        for rec in self :
            try :
                rec.update_contact_information(rec.student_id, rec.selected_person_id.data)
            except Exception as e :
                _logger.error('Error while updating contact information : %s', e)
                return {
                    'type': 'ir.actions.client',
                    'tag': 'display_notification',
                    'params': {
                        'message': _('Error while updating contact information : %s' % traceback.format_exc()),
                        'next': {'type': 'ir.actions.act_window_close'},
                        'sticky': False,
                        'type': 'warning',
                    }
                }

    def action_create_bced_personne(self):
        self.ensure_one()
       
        return True

    @api.model
    def update_contact_information(self, partner_id, data) :
        if partner_id and data :
            data = json.loads(data)
            partner_id.reg_number = data['personNumber']
            partner_id.firstname = data['name']['firstName'][0]
            partner_id.lastname = ' '.join(data['name']['lastName'])
            if len(data['name']['firstName']) > 1 :
                partner_id.initials = ','.join(map(lambda x: x[0], data['name']['firstName'][1:]))
            else:
                partner_id.initials = ''
            partner_id.gender = 'male' if data['gender']['code']['_value_1'] == 'M' else 'female'
            if data['nationalities'] :
                # TODO : no nationality in BCDE for now
                pass
            for address in data['addresses']['address']:
                # Diplomatic is for foreigner
                if address['addressType'] == 'Diplomatic':
                    partner_id.street = address['plainText'][0]['_value_1']
                    partner_id.street2 = ''
                    partner_id.zip = ''
                    partner_id.city = ''
                    partner_id.country_id = self.env['res.country'].search([('code', '=', address['country'][0]['code']['_value_1'])], limit=1).id
                if address['addressType'] == 'Residential':
                    street_name = address['street']['description'].filter(lambda x: x['language']['code']['_value_1'] == 'fr')[0]['_value_1']
                    if address['boxNumber'] :
                        partner_id.street = ' '.join([street_name,address['houseNumber'],address['boxNumber']])
                    else :
                        partner_id.street = ' '.join([street_name,address['houseNumber']])
                    partner_id.street2 = ''
                    partner_id.zip = address['postCode']['code']['_value_1']
                    partner_id.city = address['municipality']['description'].filter(lambda x: x['language']['code']['_value_1'] == 'fr')[0]['_value_1']
                    partner_id.country_id = self.env['res.country'].search([('code', '=', address['country'][0]['code']['_value_1'])], limit=1).id
                elif address['addressType'] == 'PostAddress':
                    street_name = address['street']['description'].filter(lambda x: x['language']['code']['_value_1'] == 'fr')[0]['_value_1']
                    if address['boxNumber'] :
                        partner_id.secondary_street = ' '.join([street_name,address['houseNumber'],address['boxNumber']])
                    else :
                        partner_id.secondary_street = ' '.join([street_name,address['houseNumber']])
                    partner_id.secondary_street2 = ''
                    partner_id.secondary_zip = address['postCode']['code']['_value_1']
                    partner_id.secondary_city = address['municipality']['description'].filter(lambda x: x['language']['code']['_value_1'] == 'fr')[0]['_value_1']
                    partner_id.secondary_country_id = self.env['res.country'].search([('code', '=', address['country'][0]['code']['_value_1'])], limit=1).id
            partner_id.birthdate_date = fields.Date.to_date(data['birth']['officialBirthDate'])
            if data['birth']['birthPlace'] :
                partner_id.birthplace = data['birth']['birthPlace']['description'].filter(lambda x: x['language']['code']['_value_1'] == 'fr')[0]['_value_1']
            partner_id.is_linked_to_bced_personne = True
        
            
class BCEDPersonneSummary(models.TransientModel):
    _name = "school.bced_personne_summary"
    _description = "BCED Personne Summary"

    firstname = fields.Char(string='First Name')
    lastname = fields.Char(string='Last Name')
    birthdate = fields.Date(string='Birth Date')
    niss = fields.Char(string='Niss')

    data = fields.Text(string='Data')

    wizard_id = fields.Many2one('school.bced_personne_wizard', string='Wizard')

    def action_use_person(self):
        self.ensure_one()
        self.wizard_id.selected_person_id = self.id
        self.wizard_id.state = 'bced'
        return { 
            'type': 'ir.actions.act_window',
            'name': 'BCED Personne',
            'view_mode': 'form',
            'res_model': 'school.bced_personne_wizard',
            'res_id': self.wizard_id.id,
            'target': 'new',
        }