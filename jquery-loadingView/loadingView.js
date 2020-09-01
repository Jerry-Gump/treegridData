/*
 * 版本0.1.0
 * http://www.legalsoft.com.cn
 * 北京联高软件开发有限公司
 * Licensed under the MIT licenses.
 */
$(function () {
    // 对于想被阴影覆盖的部分，它的position必须是absolute或者relative，这是受.sub-loading的positon:absulote限定的
    // 要将阴影放到最前面，就必须设置z-index，而要使z-index起作用，那么.sub-loading就必须position:absolute或者relative
    "use strict";
    $.fn.loadingView = function (action) {
        var $this = $(this);
        var overlay;
        if (action === "show") {
            overlay = $this.children("#wait_overlay");
            if (overlay.length > 0) {// 避免多次创建
                overlay.show();
            } else {
                var html = "    <div id=\"wait_overlay\" style=\"position:absolute;left:0px;right:0px;top:0px;bottom:0px;\">";
                html += "        <div style=\"display:block;position:absolute;z-index:5000;left:0px;right:0px;top:0px;bottom:0px;background-color:#666;opacity:0.3;\">";
                html += "        </div>";
                html += "        <i class=\"icon-spinner icon-spin\" style=\"z-index:5001;color:#000;font-size:40px;position:absolute;top:50%;margin-top:-20px;left:50%;margin-left:-20px;opacity:1;\"></i>";
                html += "    </div>";
                $this.append(html);
            }
        } else if (action === "hide") {
            overlay = $this.children("#wait_overlay");
            overlay.hide();
        } else {// 默认销毁
            overlay = $this.children("#wait_overlay");
            overlay.remove();
        }
    };
});