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
    'name': 'Website CRLG Portal',
    'version': '0.1',
    'license': 'AGPL-3',
    'author': 'ito-invest (Jerome Sonnet)',
    'website': '',
    'category': 'School Management',
    'depends': [
        'website_school_portal'
    ],
    'data': [
        'init_crlg.xml',
        'views/footer.xml',
        'views/custom.xml',
    ],
    'assets': {
        'web._assets_primary_variables': [
            'website_crlg_portal/static/src/scss/variables.scss',
        ],
        'web.assets_frontend': [
            'website_crlg_portal/static/src/scss/main.scss',
        ]
    },
    'description': '''
        This module initializes appearance and contents for CRLG Horizon Portal.
    ''',
    'active': False,
    'installable': True,
    'application': True,
    'images': [
        'static/description/icon.png',
    ],
}
