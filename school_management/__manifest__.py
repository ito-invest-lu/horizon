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
{
    'name': 'School management',
    'version': '0.1',
    'license': 'AGPL-3',
    'author': 'ito-invest (Jerome Sonnet)',
    'website': '',
    'category': 'School Management',
    'depends': ['mail','partner_contact_gender','partner_second_lastname','partner_contact_birthdate','partner_contact_birthplace'],
    'init_xml': [],
    'data': [
        'school_data.xml',
        'views/res_partner_view.xml',
        'views/program_view.xml',
        'views/individual_program_view.xml',
        'views/configuration_view.xml',
        'report/report_program.xml',
        'sequences/school_sequence.xml',
        'security/ir.model.access.csv',
    ],
    'demo': [
        'school_data_demo.xml'
    ],
    'assets': {
        'web._assets_primary_variables': [
            'school_management/static/src/scss/primary_variables.scss'
        ],
        'web.report_assets_common': [
            'school_management/static/src/css/pure-nr.css',
            'school_management/static/src/css/reports.css',
        ],
    },
    'description': '''
        This modules add management tools for a school.
    ''',
    'active': False,
    'installable': True,
    'application': True,
}
