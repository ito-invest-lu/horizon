odoo.define("school_evaluations.action_school_portal_main", function (require) {
    "use strict";

    var Model = require("web.Model");
    var session = require("web.session");

    (function () {
        $(document).ready(function () {
            // TODO : pas nécessaire de faire ce call get_session_info ??
            session.rpc("/web/session/get_session_info", {}).then(function () {
                var Users = new Model("res.users");
                Users.call("has_group", ["school_management.group_teacher"]).then(
                    function (has_group) {
                        if (has_group) {
                            $("#oe_main_menu_navbar").remove();
                        }
                    }
                );
            });
        });
    })();

    function setModalMaxHeight(element) {
        this.$element = $(element);
        this.$content = this.$element.find(".modal-content");
        var borderWidth = this.$content.outerHeight() - this.$content.innerHeight();
        var dialogMargin = $(window).width() < 768 ? 20 : 60;
        var contentHeight = $(window).height() - (dialogMargin + borderWidth);
        var headerHeight = this.$element.find(".modal-header").outerHeight() || 0;
        var footerHeight = this.$element.find(".modal-footer").outerHeight() || 0;
        var maxHeight = contentHeight - (headerHeight + footerHeight);

        this.$content.css({
            overflow: "hidden",
        });

        this.$element.find(".modal-body").css({
            "max-height": maxHeight,
            "overflow-y": "auto",
        });
    }

    $(".modal").on("show.bs.modal", function () {
        $(this).show();
        setModalMaxHeight(this);
    });

    $(window).resize(function () {
        if ($(".modal.in").length != 0) {
            setModalMaxHeight($(".modal.in"));
        }
    });
});
