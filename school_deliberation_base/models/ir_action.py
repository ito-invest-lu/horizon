from odoo import fields, models


class ActWindowView(models.Model):
    _inherit = "ir.actions.act_window.view"

    view_mode = fields.Selection(
        selection_add=[("deliberation", "Deliberation")],
        ondelete={"deliberation": "cascade"},
    )
