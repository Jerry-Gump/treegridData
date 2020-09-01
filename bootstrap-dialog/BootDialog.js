(function ($) {
    // 一个以bootstrap modal 作为基础的弹出框
    // 添加了jquery-ui的draggable-dialog部分功能，用以实现drag
    $.BootDialog = {
        // Public methods
        dialog: function (id, content, title, btnset, width, onshow, callback, closebtn) {
            $.BootDialog._dialog(id, title, content, btnset, "dialog", width, function () {
                if (callback) callback();
            }, function () {
                if (onshow) onshow();
            }, closebtn);
        },

        alert: function (message, title, callback, btncaption) {
            if (!btncaption) {
                btncaption = "确定";
            }
            $.BootDialog._dialog("alert", title, "<div class='text-danger' style='text-align:center;font-size:1.2em;'>" + message + "</div>", { buttons: [{ caption: btncaption, event: null, dismiss: true, class: "btn-default", focus: true, hotkey: "enter" }] }, "alert", 300, function () {
                if (callback) callback();
            }, false);
        },

        confirm: function (message, callback, width, ycaption, ncaption) {
            if (!width) {
                width = 400;
            }
            if (!ycaption) {
                ycaption = "确认";
            }
            if (!ncaption) {
                ncaption = "取消";
            }
            $.BootDialog._dialog("confirm", null, "<div class='text-warning' style='text-align:center;font-size:1.2em;padding:15px 0px;'>" + message + "</div>", { buttons: [{ caption: ycaption, event: function () { if (callback) callback(true); }, dismiss: true, class: "btn-warning", focus: true, hotkey: "enter" }, { caption: ncaption, event: function () { if (callback) callback(false); }, dismiss: true, class: "btn-default", hotkey: "esc" }] }, "confirm", width, null, false);
        },

        // btnset {[{caption:'',event:function(){}, dismiss:true, class:'btn-default', focus:true, hotkey:'enter'|'esc'}]}
        // Private methods
        _dialog: function (id, title, content, btnset, type, width, callback, onshow, closebtn) {
            var containerId = "container_" + id;
            var titleId = "title_" + id;
            var contentId = "content_" + id;
            var dialogId = "dialog_" + id;
            var headerId = "header_" + id;
            var bodyId = "body_" + id;

            if ($("#" + containerId).length > 0) {
                $("#" + containerId).modal("show");
                return;
            }
            var style = "";
            if (width) {
                width = width + "";
                if (width.indexOf("%") > 0 || width.indexOf("px") > 0) {
                    style = ' style="width:' + width + '"';
                } else {
                    style = ' style="width:' + width + 'px;"';
                }
            }
            // z-index自增长，避免混乱
            var zidx = $("#bootdialog_z_index").val();
            if (!zidx) {
                zidx = 1041;
                $("body").append("<input type='hidden' id='bootdialog_z_index' value='1041' />");
            } else {
                zidx = parseInt(zidx) + 1;
                $("#bootdialog_z_index").val(zidx);
            }

            var modalHtml = '<div style="z-index:' + zidx + ';" class="modal fade" role="dialog" aria-labelledby="' + titleId + '" aria-hidden="true" data-backdrop="static" data-keyboard="false" id="' + containerId + '">';// title="' + title + '"
            modalHtml += '<div class="modal-dialog"' + style + ' id="' + dialogId + '">';
            modalHtml += '<div class="modal-content" id="' + contentId + '">';
            // confirm不要标题，不要标题栏关闭按钮
            if ((type === "dialog" || type === "alert") && title) {
                modalHtml += '<div class="modal-header" id="' + headerId + '">';
                if (closebtn) {
                    modalHtml += '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>';
                }
                modalHtml += '<h4 class="modal-title" id="' + titleId + '">' + title + '</h4>';
                modalHtml += '</div>';
            }
            modalHtml += '<div class="modal-body" id="' + bodyId + '"></div>';
            modalHtml += '<div class="modal-footer" id="footer_' + id + '">';
            modalHtml += '</div>';
            modalHtml += '</div>';
            modalHtml += '</div>';
            modalHtml += '</div>';
            // 动态创建对话框
            $("BODY").append(modalHtml);
            $("#" + bodyId).append(content);
            if (!width) {
                $("#" + containerId).css({
                    minWidth: $("#" + containerId).find('.modal-body').outerWidth(),
                    maxWidth: "80%"
                });
            }

            // 关闭之后，自动销毁
            $("#" + containerId).on('hidden.bs.modal', function () {
                $("#container_" + id).next(".modal-backdrop").remove();
                $("#container_" + id).remove();
                if ($(".modal:visible").length > 0) {
                    $("body").addClass("modal-open");
                }
                if (callback) {
                    callback();
                }
            });
            $("#" + containerId).on('show.bs.modal', function () {
                if (onshow) onshow();
            });
            if (btnset) {
                var idx = 1;
                for (var i = 0; i < btnset.buttons.length; i++) {
                    var btn = btnset.buttons[i];
                    // 按钮没有标题的话，忽略
                    if (!btn.caption)
                        continue;
                    var btnid = 'btn_' + idx + '_' + id;
                    idx++;
                    var btnhtml = '<input type="button" class="btn ';
                    if (btn.class)
                        btnhtml += btn.class;
                    btnhtml += '" id="' + btnid + '" data-idx="' + i + '" value="' + btn.caption + '"';
                    // 设置默认热点
                    if (btn.focus) {
                        btnhtml += " autofocus";
                    }
                    btnhtml += ' /> ';
                    $('#footer_' + id).append(btnhtml);
                    // 按钮点击事件处理
                    $("#" + btnid).click(function () {
                        var clk_idx = parseInt($(this).attr("data-idx"));
                        var clk_btn = btnset.buttons[clk_idx];
                        if (clk_btn.event) {
                            // 处理逻辑是：如果事件处理返回true则关闭对话框，返回false则忽略按钮操作
                            if (clk_btn.event("#" + containerId)) {
                                $.BootDialog._hide(id);
                                return;
                            }
                        }
                        if (clk_btn.dismiss) {
                            // 如果设置了关闭属性为true，则不管前面处理的结果如何，都关闭对话框
                            $.BootDialog._hide(id);
                            return;
                        }
                    });
                }

                // 对话框内输入按钮、输入框等接收键盘事件，实现按钮的热键功能
                $("#" + containerId).find("input,textarea,select,button").on("keyup", function (e) {
                    var btn;
                    var btnid;
                    var i;
                    if (e.keyCode === 13) {
                        idx = 1;
                        for (i = 0; i < btnset.buttons.length; i++) {
                            btn = btnset.buttons[i];
                            if (!btn.caption)
                                continue;
                            btnid = 'btn_' + idx + '_' + id;
                            idx++;
                            if (!btn.hotkey) {
                                continue;
                            }
                            if (btn.hotkey === "enter") {
                                $("#" + btnid).trigger('click');
                                break;
                            }
                            /*
                            var hotCode = parseInt(btn.hotkey);
                            if (hotCode == e.keyCode) {
                                $("#" + btnid).trigger('click');
                                break;
                            }*/
                        }
                    } else if (e.keyCode === 27) {
                        idx = 1;
                        for (i = 0; i < btnset.buttons.length; i++) {
                            btn = btnset.buttons[i];
                            if (!btn.caption)
                                continue;
                            btnid = 'btn_' + idx + '_' + id;
                            idx++;
                            if (!btn.hotkey) {
                                continue;
                            }
                            if (btn.hotkey === "esc") {
                                $("#" + btnid).trigger('click');
                                break;
                            }
                            /*
                            var hotCode = parseInt(btn.hotkey);
                            if (hotCode == e.keyCode) {
                                $("#" + btnid).trigger('click');
                                break;
                            }*/
                        }
                    }
                });
            }
            $('#' + containerId).modal('show');
            var selector;
            if (type !== "confirm" && title) {
                selector = "#" + headerId;
                $('#' + dialogId).draggable({
                    handle: selector
                });
            } else {
                selector = "#" + bodyId;
                $('#' + dialogId).draggable({
                    handle: selector
                });
            }
        },

        _hide: function (id) {
            $("#container_" + id).modal("hide");
        }
    };

    /*
    * 对话框组件，此对话框基于bootstrap，动态创建，关闭之后自动销毁
    * id：dialog的DOM id,以支持多重对话框
    * content：对话框内容html文本
    * title：对话框标题，当titie为null时，以内容区域为拖动区域，head区域直接隐藏
    * btnset：按钮定义格式为
    {
        buttons: [
            { caption: "确定", event: function (dlgId) { return false; }, dismiss: false, class: "btn-primary", focus: false, hotkey: "enter" },
            { caption: "取消", event: null, dismiss: true, class: "btn-default", focus: true, hotkey: "esc" }
        ]
    }
    * 其中event: function(dlgId）{} dlgId包含#符号
    * width：对话框宽度
    * onshow：对话框显示出来的时候进行的回调
    * callback：对话框关闭之后通知，无参数，此时全部对话框已经销毁
    */
    jBootDialog = function (id, content, title, btnset, width, onshow, callback, closebtn) {
        if (typeof (closebtn) === "undefined") {
            closebtn = true;
        }
        $.BootDialog.dialog(id, content, title, btnset, width, onshow, callback, closebtn);
    };
    // callback无参数
    // btncaption，为多语言自定义按钮文字
    jBootAlert = function (message, title, callback, btncaption) {
        $.BootDialog.alert(message, title, callback, btncaption);
    };
    // 这里的callback有参数，为boolean
    // ycaption,ncaption为多语言自定义按钮文字
    jBootConfirm = function (message, callback, width, ycaption, ncaption) {
        $.BootDialog.confirm(message, callback, width, ycaption, ncaption);
    };
})(jQuery);