(function () {
    "use strict";
    openerp.web_list_view_sticky = function (instance) {
        // Sticky Table Header
        instance.web.ListView.include({
            load_list: function () {
                var self = this;
                self._super.apply(this, arguments);
                var scrollArea = self.ViewManager.$el;
                if (scrollArea) {
                    self.$el.find("table.oe_list_content").each(function () {
                        $(this).stickyTableHeaders({
                            scrollableArea: scrollArea,
                            leftOffset: scrollArea,
                        });
                    });
                }
            },
        });
    };
})();
