# -*- coding: utf-8 -*-
{
    'name': "Custom reports",

    'summary': """This module adds custom reports that canbe printed""",

    'description': """This module adds custom reports that canbe printed.""",

    'installable': True,
    'auto_install': False,
    'application': True,

    'author': "Deuse",
    'website': "https://deuse.be",

    'version': '14.0.1.0.0',

    'depends': ['school_management',"base","partner_contact_gender","partner_contact_birthdate","partner_firstname","custom_partner_fields"],

    'data': [
        'templates/layouts/diploma_layout.xml',
        'templates/layouts/supplement_layout.xml',

        'templates/paperformats/diploma_paperformat.xml',
        'templates/paperformats/supplement_paperformat.xml',

        'templates/school_individual_program_diploma.xml',
        'templates/school_individual_program_supplement.xml',

        'views/individual_program_view.xml',
    ],
    'demo': [
    ],
    'images': [
        'static/description/icon.png',
    ],
}