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
{
    'name': 'School Booking',
    'version': '0.1',
    'license': 'AGPL-3',
    'author': 'be-Cloud.be (Jerome Sonnet)',
    'website': '',
    'category': 'School Management',
    'depends': ['school_management','calendar','web'],
    'init_xml': [],
    'data': [
        'data/school_booking.xml',
        'views/school_booking_view.xml',
        'views/school_asset_view.xml',
        'wizard/school_booking_wizard.xml',
        'security/ir.model.access.csv',
    ],
    'demo_xml': [],
    'description': '''
        This modules add room reservation, assets management,...
    ''',
    'qweb': ['static/src/xml/*.xml'],
    'active': False,
    'installable': True,
    'application': True,
}
