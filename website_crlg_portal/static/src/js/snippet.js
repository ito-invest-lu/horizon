// Affiche dynamiquement un snippet
odoo.define('website_crlg_portal.snippet', function (require) {
    'use strict';
    const publicWidget = require('web.public.widget');
    const DynamicSnippet = require('website.s_dynamic_snippet');

    publicWidget.registry.dynamic_snippet = DynamicSnippet.extend({
        selector: '.hz_generic_insert_snippet',
        /**
         * @override
         */
        _fetchData: async function () {
            var template = this.$target[0].dataset.templateName;
            const html = await this._rpc({
                route: '/hz_generic_insert_snippet/' + template,
            });
            this.data = html;
            this.$target[0].innerHTML = this.data;
        },
    })
 });