/*
 * 版本0.9.0
 * http://www.legalsoft.com.cn
 * 北京联高软件开发有限公司
 * Licensed under the MIT licenses.
 */

(function ($) {
    "use strict";
    var TreegridData = function (element, options) {
        this.$element = $(element);
        this.setting = options;
        this.dataRangeCache = new Object();
        this._init();
    };

    TreegridData.prototype = {
        constructor: TreegridData,
        _init: function () {
            var target = this;
            this.$element.data('setting', this.setting);
            this.$element.addClass('table');
            this.$element.addClass('treegrid-table');
            if (this.setting.striped) {
                this.$element.addClass('table-striped');
            }
            if (this.setting.bordered) {
                this.$element.addClass('table-bordered');
            }
            // 添加event处理
            this.$element.on('click', 'button, a', function (e) {
                e.stopPropagation();
                // 判断是否有event标志：lg-event
                var event = $(this).attr('lg-event');
                if (event) {
                    var obj = new Object();
                    obj.event = event;
                    obj.data = $(this).parents('tr').data('node');
                    if (obj.data) {
                        obj.id = obj.data[target.setting.id];
                    }
                    // 这个是不能同时使用的，没必要，而且会有重复操作的嫌疑
                    if ($.isFunction(target.setting.onActionEvent)) {
                        target.setting.onActionEvent(target.$element, obj);
                    } else {
                        target.$element.trigger('tool-action', [target.$element, obj]);
                    }
                }
            });
            this.$element.off('click', ".column-sortable");
            this.$element.on('click', '.column-sortable', function (event) {
                event.stopPropagation();
                var param = new Object();
                if ($(this).hasClass('sorted')) {
                    // 顺序颠倒
                    param.sortDesc = !target.setting.sortDesc;
                    /*
                    if (param.sortDesc) {
                        if (!$(this).find('span.arrow').hasClass('up')) {
                            $(this).find('span.arrow').addClass('up');
                        }
                    } else {
                        $(this).find('span.arrow').removeClass('up');
                    }*/
                } else {
                    // 先去除原先的排序对象active类型，然后设置此对象active
                    param.sortDesc = target.setting.sortDesc;
                    /*
                    target.find('span.arrow').remove();
                    $(this).append('<span class=\"arrow\"><span>');
                    param.sortDesc = options.sortDesc;
                    if (param.sortDesc) {
                        if (!$(this).hasClass('desc')) {
                            $(this).addClass('desc');
                        }
                    } else {
                        $(this).removeClass('desc');
                    }*/
                }
                // 其实这里是全部重建的，所以实际上不需要操作界面元素，只要改参数就行了
                param.sortField = $(this).attr('data-field');
                target.$element.treegridData('sortBy', param);
            });

            /*
             以下为表格内编辑事件绑定以及内部功能函数
             */
            this.$element.off("click", "a.editable");
            this.$element.on("click", "a.editable", function (event) {
                event.stopPropagation();
                target.closeEdit(target);
                var type = $(this).attr("data-type");
                switch (type) {
                    case "text":
                    case "int":
                    case "float":
                        target.textEditable($(this));
                        break;
                    case "select":
                        target.selectEditable($(this));
                        break;
                    case "date":
                        target.dateEditable($(this));
                }
            });

            this.$element.off("click", ".editable-submit");
            this.$element.on("click", ".editable-submit", function (event) {
                event.stopPropagation();
                var obj = new Object();
                // 获取合适的数据，根据类型不同，会有不同的处理方式，text, select, textarea会直接使用val()
                // 复合型数据（时间区间）等有可能会有多个对象，暂时只管text类型
                obj.field = $(this).closest("td").find("a.editable").attr("data-field");
                obj.value = $(this).closest("form.editableform").find("#" + obj.field).val();

                // 现在只处理input的输入，其他输入（select/textarea）一般来说不需要做数据检查
                var type = $(this).closest("form.editableform").attr("data-type");
                if (type === "float") {
                    // 检查是否浮点数
                } else if (type === "int") {
                    // 是否整数
                } else if (type === "date") {
                    // 日期
                }

                obj.data = $(this).parents('tr').data('node');
                if (obj.data) {
                    obj.id = obj.data[target.setting.id];
                }
                if ($.isFunction(target.setting.onPreEdit)) {
                    // 给客户端一个修改前数据检查的机会，如果返回错误，则直接忽略此操作
                    if (!target.setting.onPreEdit(target.$element, obj)) {
                        return;
                    }
                }
                // 检查已通过，修改数据，同时使用事件发送出去处理
                obj.data[obj.field] = obj.value;
                $("#" + obj.field + "_" + obj.id).val(obj.value);
                // 调用处理过程，使用事件方式是异步的
                if ($.isFunction(target.setting.onEdited)) {
                    target.setting.onEdited(target.$element, obj);
                } else {
                    target.$element.trigger('grid-edited', [target.$element, obj]);
                }
                var idx = target.$element.find("a.editable").index($(this).closest("td").find("a.editable"));
                // 修改显示，把改对象的工作放最后，是为了前面的autoNext能正常运行
                var column = null;
                if ($.isArray(target.setting.columns[0])) {
                    for (var i = 0; i < target.setting.columns.length; i++) {
                        for (var j = 0; j < target.setting.columns[i].length; j++) {
                            if (target.setting.columns[i][j].field === obj.field) {
                                column = target.setting.columns[i][j];
                                break;
                            }
                        }
                        if (column !== null) {
                            break;
                        }
                    }
                } else {
                    for (var k = 0; k < target.setting.columns.length; k++) {
                        if (target.setting.columns[k].field === obj.field) {
                            column = target.setting.columns[k];
                            break;
                        }
                    }
                }
                /*直接从原始数据查找更快速
                var datacols = target.getDataColumn();
                $.each(datacols, function (i, c) {
                    if (c.field === obj.field) {
                        column = c;
                    }
                });*/
                var txt = target.editItemHtml(obj.data, column);
                $(this).closest("td").html(txt);
                if (target.setting.autoNext) {
                    // 自动对下一个对象启动编辑,不太清楚find出来的jquery对象是否按照顺序来的，能不能这么按顺序跳过去
                    if (target.$element.find("a.editable").length > idx + 1) {
                        $(target.$element.find("a.editable")[idx + 1]).trigger("click");// 这儿能触发target.on("click", "a.editable")事件吗？
                    }
                }
            });
            this.$element.off("click", ".editable-cancel");
            this.$element.on("click", ".editable-cancel", function (event) {
                event.stopPropagation();
                if (target.setting.editMode === "popup") {
                    $("#" + $(".editable-buttons").attr("data-selector")).popover("destroy");
                } else {
                    $(this).closest("td").find("a.editable").show();
                    $(this).closest("div.editable-container").remove();
                }
            });

            // 自动关闭编辑功能
            $("body").on("click", function (event) {
                if ($(event.target).closest(".editable-container").length > 0) {
                    return;
                }
                if (target.setting.autoClose && target.$element.find(".editable-container").length > 0) {
                    // 把其他的编辑内容干掉
                    target.closeEdit(target);
                    event.stopPropagation();
                }
            });
            // 表格内编辑中可操作部分被点击不能关闭编辑功能，停止事件冒泡
            this.$element.on("click", "input, select, textarea", function (event) {
                event.stopPropagation();
            });
            // 清除输入框内容
            this.$element.on("click", ".editable-clear-x", function (event) {
                $(this).prev("input").focus().val("");
                event.stopPropagation();
            });
            // 快捷键
            this.$element.on("keyup", "input, select", function (e) {// 快捷键
                if (e.keyCode === 13) {// 回车
                    $(this).closest(".editable-container").find(".editable-submit").trigger("click");
                } else if (e.keyCode === 27) {// esc
                    $(this).closest(".editable-container").find(".editable-cancel").trigger("click");
                }
            });
            // 创建表格
            this.reload();
        },
        closeEdit: function (target) {
            if (target.setting.editMode === "popup") {
                $("#" + $(".editable-buttons").attr("data-selector")).popover("destroy");
            } else {
                target.$element.find(".editable-container").closest("td").find("a.editable").show();
                //$(this).closest("div.editable-container").remove();
                $("body").find(".editable-container").remove();
            }
        },
        getRootNodes: function (data) {
            var result = [];
            var $this = this;
            $.each(data, function (index, item) {
                if (!item[$this.setting.parentColumn]) {
                    result.push(item);
                }
            });
            return result;
        },
        getChildNodes: function (data, parentNode, parentIndex, tbody, autoinc, datacols) {
            var cidx = 1;
            var $this = this;
            $.each(data, function (i, item) {
                if (item[$this.setting.parentColumn] === parentNode[$this.setting.id]) {
                    var data_idx = data.indexOf(item);
                    var cautoinc = autoinc + "." + cidx;
                    cidx++;
                    var nowParentIndex = ++$this.setting.trIdx;
                    var tr = $this.createLine(item, parentIndex, nowParentIndex, data_idx, cautoinc, datacols);
                    tbody.append(tr);
                    $this.getChildNodes(data, item, nowParentIndex, tbody, cautoinc, datacols);
                }
            });
        },
        createLine: function (item, parentIndex, nowParentIndex, data_idx, autoinc, datacols) {
            var tr = $('<tr id=\"node_' + item[this.setting.id] + '\" data-trIdx=\"' + nowParentIndex + '\" data-autoinc=' + autoinc + ' \"></tr>');
            tr.data("node", item);
            tr.addClass('treegrid-' + nowParentIndex);
            if (parentIndex) {
                tr.addClass('treegrid-parent-' + parentIndex);
            }
            var $this = this;
            $.each(datacols, function (index, column) {
                tr.append($this.createItem(item, column, data_idx, autoinc));
            });
            return tr;
        },
        templateExpend: function (tpl, item, data_idx) {
            tpl = tpl.replace(/[\r\n]/g, "");
            //tpl = tpl.replace(/\n/g, "");
            var otl = "var html='';var d=" + JSON.stringify(item) + ";";
            var le = 0;
            var begin = tpl.indexOf('{{');
            while (begin >= 0) {
                if (le < begin) {
                    if (tpl.substring(le, begin).trim().length > 0) {
                        otl += "html += \"" + tpl.substring(le, begin).replace(/"/g,"\\\"") + "\";";
                    }
                }
                var end = tpl.indexOf('}}', begin);
                if (end > begin) {
                    var exp = tpl.substring(begin, end);
                    exp = exp.substring(2).trim();
                    var js = false;
                    var echtml = false;
                    if (exp.substring(0, 1) === "#") {
                        exp = exp.substring(1);
                        js = true;
                    } else if (exp.substring(0, 1) === "=") {
                        exp = exp.substring(1);// 这个没测试过
                        echtml = true;
                    }
                    if (!js) {
                        var db = exp.indexOf("d.");
                        while (db >= 0) {
                            var de = exp.indexOf(" ", db);
                            if (de < 0) {
                                de = exp.length;
                            }
                            if (de > db) {
                                var se = exp.substring(db, de);
                                var ess = se.split('.');
                                if (ess.length === 2) {
                                    // 必须是d.Id这样的格式才行，实际只考虑后续的，前面用什么并不管
                                    if (ess[1] === 'LG_DATA_INDEX') {
                                        se = data_idx;
                                    } else {
                                        se = item[ess[1]];
                                    }
                                }
                                exp = exp.substring(0, db) + se + exp.substring(de);
                            }
                            db = exp.indexOf("d.", db + 1);
                        }
                        if (!echtml) {
                            otl += "html += \"" + exp.replace(/"/g, "\\\"") + "\";";
                        } else {
                            otl += "html += \"" + new Option(exp).innerHTML() + "\";";
                        }
                    } else {
                        otl += exp;
                    }
                    
                    le = end + 2;
                }
                begin = tpl.indexOf('{{', begin+1);
            }
            if (le < tpl.length - 1) {
                if (tpl.substring(le).trim().length > 0) {
                    otl += "html += \"" + tpl.substring(le).replace(/"/g, "\\\"") + "\";";
                }
            }
            otl += " return html;";
            var html = eval("function t(){" + otl + "} t();");
            return html;
        },
        createItem: function (item, column, data_idx, tr_autoinc) {
            var $this = this;
            var td = $('<td></td>');
            // 按照autoincreament->templet->toolbar->field优先级处理
            // 可编辑数据只能是简单对象，不能是autoincreament、templet和toolbar
            if (column.autoincreament) {
                td.text(tr_autoinc);
            }
            else if (typeof (column.templet) === "string" && column.templet.length > 0) {
                // 按照模板的方式组织
                var tpl = column.templet;
                if (tpl.substring(0, 1) === "#") {
                    tpl = $(tpl).text();
                }
                tpl = $this.templateExpend(tpl, item, data_idx);
                td.append(tpl);
            } else if (typeof (column.toolbar) === "string" && column.toolbar.length > 0) {
                // 抓取toolbar内容放入td
                if ($(column.toolbar).length > 0) {
                    var barTxt = $(column.toolbar).text();
                    // 对barTxt中的语句解释处理
                    barTxt = $this.templateExpend(barTxt, item, data_idx);
                    td.append(barTxt);
                }
            } else {
                var txt = this.editItemHtml(item, column);
                td.html(txt);
            }
            switch (column.align) {
                case "left":
                    td.addClass("text-left");
                    break;
                case "center":
                    td.addClass("text-center");
                    break;
                case "right":
                    td.addClass("text-right");
                    break;
            }
            if (column.style) {
                td.css(column.style);
            }
            return td;
        },
        textEditable: function ($elem) {
            // 把其他的编辑内容干掉
            this.$element.find(".editable-container").closest("td").find("a.editable").show();
            this.$element.find(".editable-container").remove();

            var type = $elem.attr("data-type");
            var value = $elem.attr("data-value");
            var field = $elem.attr("data-field");
            var title = $elem.attr("data-title");
            if (this.setting.editMode === "popup") {
                var ih = "<div class='editable-container'><form class=\"form-inline editableform\" data-type=\"" + type + "\" onsubmit=\"return false;\"><div class=\"control-group\"><div><div class=\"editable-input\" style=\"position: relative;\"><input id=\"" + field + "\" type=\"text\" class=\"input-medium\" style=\"padding-right: 24px;\"><span class=\"editable-clear-x\"></span></div><div class=\"editable-buttons\" data-selector=\"" + $elem.attr("id") + "\"><button type=\"button\" class=\"btn btn-primary editable-submit\"><i class=\"icon-ok icon-white\"></i></button><button type=\"button\" class=\"btn editable-cancel\"><i class=\"icon-remove\"></i></button></div></div><div class=\"editable-error-block help-block\" style=\"display: none;\"></div></div></form></div>";
                var os = { html: true, title: title, content: ih, placement: "auto top", trigger: "manual" };
                $elem.popover(os);
                $elem.popover("show");
            } else {
                var container = $("<div class='editable-container'></div>");
                container.append("<form class=\"form-inline editableform\" data-type=\"" + type + "\" onsubmit=\"return false;\" style=\"\"><div class=\"control-group\"><div><div class=\"editable-input\" style=\"position: relative;\"><input id=\"" + field + "\" type=\"text\" class=\"input-medium\" style=\"padding-right: 24px;\"><span class=\"editable-clear-x\"></span></div><div class=\"editable-buttons\" data-selector=\"" + $elem.attr("id") + "\"><button type=\"button\" class=\"btn btn-primary editable-submit\"><i class=\"icon-ok icon-white\"></i></button><button type=\"button\" class=\"btn editable-cancel\"><i class=\"icon-remove\"></i></button></div></div><div class=\"editable-error-block help-block\" style=\"display: none;\"></div></div></form>");
                $elem.after(container);
                $elem.hide();
            }
            $(".editable-container").find("input").focus().val(value);
        },
        selectEditable: function ($elem) {
            // 把其他的编辑内容干掉
            this.$element.find(".editable-container").closest("td").find("a.editable").show();
            this.$element.find(".editable-container").remove();

            // 获取选项
            var datarange = this.GetDataRange($elem.attr("data-range"));
            var type = $elem.attr("data-type");
            var value = $elem.attr("data-value");
            var field = $elem.attr("data-field");
            var title = $elem.attr("data-title");
            var options = "";
            if ($.inArray(datarange)) {
                for (var i = 0; i < datarange.length; i++) {
                    options += "<option value='" + datarange[i].id + "'>" + datarange[i].title + "</option>";
                }
            }
            if (this.setting.editMode === "popup") {
                var ih = "<div class='editable-container'><form class=\"form-inline editableform\" data-type=\"" + type + "\" onsubmit=\"return false;\" style=\"\"><div class=\"control-group\"><div><div class=\"editable-input\" style=\"position: relative;\"><select id=\"" + field + "\" class=\"input-medium\">";
                ih += options;
                ih += "</select></div><div class=\"editable-buttons\" data-selector=\"" + $elem.attr("id") + "\"><button type=\"button\" class=\"btn btn-primary editable-submit\"><i class=\"icon-ok icon-white\"></i></button><button type=\"button\" class=\"btn editable-cancel\"><i class=\"icon-remove\"></i></button></div></div><div class=\"editable-error-block help-block\" style=\"display: none;\"></div></div></form>";
                ih += "</div>";
                var os = { html: true, title: title, content: ih, placement: "auto top", trigger: "manual" };
                $elem.popover(os).popover("show");
            } else {
                var container = $("<div class='editable-container'></div>");
                container.append("<form class=\"form-inline editableform\" data-type=\"" + type + "\" onsubmit=\"return false;\" style=\"\"><div class=\"control-group\"><div><div class=\"editable-input\" style=\"position: relative;\"><select id=\"" + field + "\" class=\"input-medium\"></select><span class=\"editable-clear-x\"></span></div><div class=\"editable-buttons\" data-selector=\"" + $elem.attr("id") + "\"><button type=\"button\" class=\"btn btn-primary editable-submit\"><i class=\"icon-ok icon-white\"></i></button><button type=\"button\" class=\"btn editable-cancel\"><i class=\"icon-remove\"></i></button></div></div><div class=\"editable-error-block help-block\" style=\"display: none;\"></div></div></form>");                
                container.find("#" + field).html(options);
                $elem.after(container);
                $elem.hide();
            }
            $(".editable-container").find("select").focus().val(value);
        },
        dateEditable: function ($elem) {
            // 把其他的编辑内容干掉
            this.$element.find(".editable-container").closest("td").find("a.editable").show();
            this.$element.find(".editable-container").remove();

            var type = $elem.attr("data-type");
            var value = $elem.attr("data-value");
            var field = $elem.attr("data-field");
            var title = $elem.attr("data-title");
            if (this.setting.editMode === "popup") {
                var ih = "<div class='editable-container'><form class=\"form-inline editableform\" data-type=\"" + type + "\" onsubmit=\"return false;\" style=\"\"><div class=\"control-group\"><div><div class=\"editable-input\" style=\"position: relative;\"><div class='input-group date'><input data-format='yyyy-mm-dd' style='width:100%;' id='" + field + "' value='" + value + "' class='form-control' /><span class='input-group-addon'><i class='fa fa-calendar icon-calendar'></i></span></div></div><div class=\"editable-buttons\" data-selector=\"" + $elem.attr("id") + "\"><button type=\"button\" class=\"btn btn-primary editable-submit\"><i class=\"icon-ok icon-white\"></i></button><button type=\"button\" class=\"btn editable-cancel\"><i class=\"icon-remove\"></i></button></div></div><div class=\"editable-error-block help-block\" style=\"display: none;\"></div></div></form></div>";
                var os = { html: true, title: title, content: ih, placement: "auto top", trigger:"manual" };
                $elem.popover(os).popover("show");
            } else {
                var container = $("<div class='editable-container'></div>");
                container.append("<form class=\"form-inline editableform\" data-type=\"" + type + "\" onsubmit=\"return false;\" style=\"\"><div class=\"control-group\"><div><div class=\"editable-input\" style=\"position: relative;\"><div class='input-group date'><input data-format='yyyy-mm-dd' style='width:100%;' id='" + field + "' value='" + value + "' class='form-control' /><span class='input-group-addon'><i class='fa fa-calendar icon-calendar'></i></span></div></div><div class=\"editable-buttons\" data-selector=\"" + $elem.attr("id") + "\"><button type=\"button\" class=\"btn btn-primary editable-submit\"><i class=\"icon-ok icon-white\"></i></button><button type=\"button\" class=\"btn editable-cancel\"><i class=\"icon-remove\"></i></button></div></div><div class=\"editable-error-block help-block\" style=\"display: none;\"></div></div></form>");
                $elem.after(container);
                $elem.hide();
            }
            $(".editable-container").find("input").focus().val(value);
            $(".editable-container").find('.input-group.date').datepicker({ zIndexOffset: 5000, language: 'zh-CN', format: 'yyyy-mm-dd', daysOfWeekHighlighted: '0,6', autoclose: true });            
        },
        GetDataRange: function (datarange) {
            if (this.dataRangeCache[datarange]) {
                return this.dataRangeCache[datarange];
            }
            var rangeArray;
            if ($.isArray(datarange)) {
                rangeArray = datarange;
            }
            else if (datarange.indexOf(".json") !== -1) {
                $.ajax({
                    async: false,
                    type: "GET",
                    url: datarange,
                    success: function (dr) {
                        rangeArray = dr;
                    }
                });
            } else if (datarange.indexOf("url:") !== -1) {
                var url = datarange.substring(datarange.indexOf("url:") + 4);
                $.ajax({
                    async: false,
                    type: "GET",
                    url: url,
                    success: function (dr) {
                        rangeArray = eval("(" + dr + ")");
                    }
                });
            } else {
                rangeArray = new Array();
                var dr = datarange.split(",");
                for (var j = 0; j < dr.length; j++) {
                    var drr = dr[j].split("^");
                    var o = new Object();
                    if (drr.length > 1) {
                        o.id = drr[0];
                        o.title = drr[1];
                    } else {
                        o.id = dr[j];
                        o.title = dr[j];
                    }
                    rangeArray.push(o);
                }
            }
            this.dataRangeCache[datarange] = rangeArray;
            return rangeArray;
        },
        editItemHtml: function (item, column) {
            var txt = item[column.field] || column.placeHolder || "";

            var d = item[column.field] || "";
            if (column.type === "select") {
                var dataRange = this.GetDataRange(column.datarange);
                if ($.isArray(dataRange)) {
                    for (var i = 0; i < dataRange.length; i++) {
                        if (dataRange[i].id == d) {
                            txt = dataRange[i].title;
                            break;
                        }
                    }
                }
            }
            if (column.editable) {
                // 可编辑，如果内容是空，则必须显示一个可输入的占位内容
                if (txt === "") {
                    txt = this.setting.editInfo[column.type] || "<span style='color:red;'>Empty</span>";
                }
                txt = "<input type='hidden' name='" + column.field + "_" + item[this.setting.id] + "' value='" + d + "' /><a href='javascript:void(0);' id='a_" + column.field + "_" + item[this.setting.id]+"' class='editable' data-title='" + column.title + "' data-field='" + column.field + "' data-type='" + column.type + "' data-value='" + d + "' data-range='" + column.datarange + "'>" + txt + "</a>";
                //target.data("tabIdx", tabIdx);
            }
            return txt;
        },
        createHeadLine: function (row, thr) {
            var $this = this;
            $.each(row, function (i, item) {
                var th = $('<th style="vertical-align:middle;"></th>');
                if (item.width) {
                    th.css("width", item.width);
                }
                if (typeof item.colspan === "number") {
                    th.attr("colspan", item.colspan);
                }
                if (typeof item.rowspan === "number") {
                    th.attr("rowspan", item.rowspan);
                }
                th.text(item.title);
                // 只有数据直接相关的才应该支持排序，但对于多重表头不好确定？
                if (item.sortable && !item.autoincreament) {
                    th.addClass('column-sortable');
                    th.attr("data-field", item.field);
                    if (item.field === $this.setting.sortField) {
                        th.addClass('sorted');
                        if ($this.setting.sortDesc) {
                            th.append("<span class='sign arrow'></span>");
                        } else {
                            th.append("<span class='sign arrow up'></span>");
                        }
                    }
                }
                switch (item.align) {
                    case "left":
                        th.addClass("text-left");
                        break;
                    case "center":
                        th.addClass("text-center");
                        break;
                    case "right":
                        th.addClass("text-right");
                        break;
                }
                thr.append(th);
            });
        },
        createTable: function (data, message) {
            // 先清空内容
            this.$element.empty();
            //构造表头
            var thead = $('<thead></thead>');
            for (var p = 0; p < this.setting.columns.length; p++) {
                var thr = $('<tr></tr>');
                thr.css(this.setting.titleStyle);
                thead.append(thr);
                var row = this.setting.columns[p];
                // 兼容双重表头与单一表头
                if ($.isArray(row)) {
                    this.createHeadLine(row, thr);
                } else {
                    this.createHeadLine(this.setting.columns, thr);
                    break;
                }
            }
            this.$element.append(thead);

            //构造表体
            if (this.setting.page) {
                this.setting.trIdx = (this.setting.pageIndex - 1) * this.setting.pageSize;
            } else {
                this.setting.trIdx = 0;
            }
            var tbody = $('<tbody></tbody>');
            var datacols = this.getDataColumn();
            var $this = this;
            if ($.isArray(data) && data.length > 0) {
                var mx_autoinc = this.setting.trIdx + 1;
                if (this.setting.treeView) {
                    // 树视图，按照树结构向下抓数据，创建行，此模式下有可能会有部分数据不显示（父节点不在数组中）
                    var rootNode = this.getRootNodes(data);
                    $.each(rootNode, function (i, item) {
                        var data_idx = data.indexOf(item);
                        var autoinc = mx_autoinc + "";
                        mx_autoinc++;
                        var nowParentIndex = ++$this.setting.trIdx;
                        var tr = $this.createLine(item, null, nowParentIndex, data_idx, autoinc, datacols);
                        tr.addClass('root-node');
                        tbody.append(tr);
                        $this.getChildNodes(data, item, nowParentIndex, tbody, autoinc, datacols);
                    });
                } else {
                    // 非树视图，直接全部往上加就是了
                    $.each(data, function (i, item) {
                        var data_idx = data.indexOf(item);
                        var autoinc = mx_autoinc + "";
                        mx_autoinc++;
                        var nowParentIndex = ++$this.setting.trIdx;
                        var tr = $this.createLine(item, null, nowParentIndex, data_idx, autoinc, datacols);
                        tr.addClass('root-node');
                        tbody.append(tr);
                    });
                }
                this.$element.data('mx_autoinc', mx_autoinc);
            } else {
                var noData = '<tr class=\"empty-table\"><td style=\"text-align:center;\" colspan=\"' + datacols.length + '\">' + message + '</td></tr>';
                tbody.append(noData);
            }
            this.$element.append(tbody);
            this.$element.treegrid(this.setting);
            if (!this.setting.expandAll) {
                this.$element.treegrid('collapseAll');
            }

            this.$element.css("margin-bottom", "0px");
        },
        getDataColumn: function () {
            var datacols = null;
            if (this.setting.columns.length > 0) {
                if (!$.isArray(this.setting.columns[0])) {
                    // 通过这个来判断是否有多重表头
                    datacols = this.setting.columns;
                } else {
                    datacols = new Array();
                    var allRow = new Array();
                    for (var i = 0; i < this.setting.columns.length; i++) {
                        var rowcolumn = this.setting.columns[i];
                        var subrow = new Array();
                        $.each(rowcolumn, function (k, column) {
                            // 第一步，整理列内容，填补上空白的列，使所有的行都一样长（不够的尾部默认为空补上）
                            if (column.colspan && column.colspan > 1) {
                                var rs = 1;
                                if (typeof column.rowspan === "number") {
                                    rs = column.rowspan;
                                }
                                for (var j = column.colspan - 1; j > 0; j--) {
                                    subrow.push({ rowspan: rs });// 多列，填充空白列进去，同时填充行数
                                }
                            }
                            subrow.push(column);
                        });
                        allRow.push(subrow);
                    }
                    var expendCol = new Array();
                    $.each(allRow, function (k, row) {
                        if (datacols.length < row.length) {
                            datacols.length = row.length;
                        }
                        if (expendCol.length < row.length * 2) {
                            var sl = expendCol.length;
                            expendCol.length = row.length * 2;
                            for (var m = sl; m < row.length; m++) {
                                expendCol[m * 2] = k;// 开始计数行
                                expendCol[m * 2 + 1] = 1;// 有效行
                            }
                        }
                        var mcc = new Array();
                        mcc.length = expendCol.length / 2;
                        for (var n = 0; n < expendCol.length / 2; n++) {
                            if (k > expendCol[n * 2] && k < expendCol[n * 2 + 1] + expendCol[n * 2]) {
                                mcc[n] = 0;
                            } else {
                                mcc[n] = 1;
                            }
                        }
                        var idx = 0;
                        $.each(row, function (j, column) {
                            while (mcc[idx] === 0) {
                                idx++;
                            }
                            // 这里按照简单的方式处理，如果有显示内容autoincreament,templet,toolbar,field，就作为数据列显示出来
                            if (column.autoincreament || (typeof column.templet === "string" && column.templet.length > 0) ||
                                (typeof column.toolbar === "string" && column.toolbar.length > 0) || (typeof column.field === "string" && column.field.length > 0)) {
                                datacols[idx] = column;
                            }
                            if (column.rowspan && column.rowspan > 1) {
                                expendCol[idx * 2] = k;
                                expendCol[idx * 2 + 1] = column.rowspan;
                            }
                            idx++;
                        });
                    });
                }
            }
            return datacols;
        },
        createPaginator: function () {
            // 这里添加翻页插件
            var $this = this;
            var pageCtrl = $this.$element.next(".page");
            if (!pageCtrl || pageCtrl.length === 0) {
                pageCtrl = $("<div class='page'><ul class=\"pagination pull-right\" style=\"margin:4px 0px 0px 0px;\"></ul></div>");
                $this.$element.after(pageCtrl);
            }
            var paginator_options = {
                //设置版本号
                bootstrapMajorVersion: 3,
                // 显示第几页
                currentPage: $this.setting.pageIndex,
                // 总页数
                totalPages: $this.setting.pageCount,
                size: "small",
                alignment: "right",
                //当单击操作按钮的时候, 执行该函数, 调用ajax渲染页面
                onPageClicked: function (event, originalEvent, type, page) {
                    // 跳转
                    $this.$element.treegridData('pageTo', page);
                }
            };
            // $.fn.treegridData.paginator被放在一个独立的/PageSetting/{lang}/paginator.js文件中
            // 用于定义项目相关与语言环境相关的设定，这是为了更好的通用化
            paginator_options = $.extend(true, paginator_options, $.fn.treegridData.paginator, $this.setting.paginator);
            $(pageCtrl).find(".pagination").bootstrapPaginator(paginator_options);
        },
        getSetting: function (name) {
            var options = this.$element.data('setting');
            if (typeof name === 'string') {
                return options[name];
            }
            return options;
        },
        updateNode: function (nodeData) {
            var $this = this;
            var tr = $this.$element.find('#node_' + nodeData[$this.setting.id]);
            if (tr) {
                // 找到对象，更新里面的内容
                var datacols = this.getDataColumn();
                var autoinc = tr.attr("data-autoinc");
                var data_idx = $this.setting.data.indexOf(nodeData);
                tr.empty();
                $.each(datacols, function (index, column) {
                    tr.append($this.createItem(nodeData, column, data_idx, autoinc));
                });
            }
        },
        // 这里用了递归和遍历，所以不要太大的表格，几百行和好多层的情况下，有可能会造成问题，没有做测试
        removeNodeById: function (param) {
            // param为数据的id
            var $this = this;
            var node = $this.$element.find('#node_' + param);
            // 遍历，删除下级内容
            $.each($this.$element.find('tr'), function (i, tr) {
                if (!$(tr).data('node')) {// 排除标题行
                    return;
                }
                if ($(tr).data('node')[$this.setting.parentColumn] === param) {
                    $this.$element.treegridData('removeNodeById', $(tr).data('node')[$this.setting.id]);
                }
            });
            node.remove();
            if ($this.$element.find("tbody").find("tr").length === 0) {
                var datacols = this.getDataColumn();
                var noData = '<tr class=\"empty-table\"><td style=\"text-align:center;\" colspan=\"' + datacols.length + '\">' + $this.setting.emptyMessage + '</td></tr>';
                $this.$element.find("tbody").append(noData);
            }
            // 删除数据
            if ($this.setting.data) {
                for (var i = 0; i < $this.setting.data.length; i++) {
                    if ($this.setting.data[i][$this.setting.id] === param) {
                        $this.setting.data.splice(i, 1);
                        break;
                    }
                }
            }
        },
        appendNode: function (param) {
            // param为数据，options.data中的一条数据，此功能未经测试
            var data_idx = this.setting.data.indexOf(param);
            if (data_idx < 0) {
                this.setting.data.push(param);
                data_idx = this.setting.data.length - 1;
            }
            var parentIndex = 0;
            var tr = null;
            if (!this.setting.trIdx) {
                this.setting.trIdx = 0;
            }
            var nowParentIndex = ++this.setting.trIdx;// 当前的序号
            var autoinc;
            var mx_autoinc;
            // 如果前面表格是空得，就需要先删掉代表空内容的行
            this.$element.find('tr.empty-table').remove();
            var datacols = this.getDataColumn();
            if (this.setting.treeView) {
                // 有父节点，先找到父节点，然后使用after加到对应的里面去
                // 对于非根节点，又找不到父节点的，直接忽略，在加入数据前，必须清楚这事，组织数据时就需要做好判断，设定合适的parentId
                if (param[this.setting.parentColumn]) {
                    var parentNode = $(this).find('#node_' + param[this.setting.parentColumn]);
                    if (parentNode.length > 0) {
                        parentIndex = parentNode.attr('data-trIdx');
                        autoinc = parentNode.attr('data-autoinc') + "." + (this.$element.find('tr.treegrid-parent-' + parentIndex).length() + 1);
                        if (!$.isNumeric(parentIndex)) {
                            parentIndex = 1;
                        }
                        tr = this.createLine(item, parentIndex, nowParentIndex, data_idx, autoinc, datacols);
                        parentNode.after(tr);
                    }
                } else {
                    mx_autoinc = this.$element.data('mx_autoinc');
                    autoinc = mx_autoinc + "";
                    mx_autoinc++;
                    this.$element.data('mx_autoinc', mx_autoinc);
                    tr = this.createLine(item, null, nowParentIndex, data_idx, autoinc, datacols);
                    this.$element.append(tr);
                }
            } else {
                mx_autoinc = this.$element.data('mx_autoinc');
                autoinc = mx_autoinc + "";
                mx_autoinc++;
                this.$element.data('mx_autoinc', mx_autoinc);
                tr = this.createLine(item, null, nowParentIndex, data_idx, autoinc, datacols);
                this.$element.append(tr);
            }
        },
        sortBy: function (param) {
            // param.sortField, param.sortDesc
            if (typeof (param.sortField) === 'string') {
                if (this.setting.sortField === param.sortField) {
                    this.setting.sortDesc = !this.setting.sortDesc;
                } else {
                    this.setting.sortField = param.sortField;
                    this.setting.sortDesc = false;
                }
                this.setting.pageIndex = 1;

                this.$element.treegridData('reload', this.setting);
            }
        },
        pageTo: function (param) {
            // param即将跳转的页码(1->)
            if ($.isNumeric(param) && this.setting.page) {
                var pgIdx = parseInt(param);
                if (pgIdx > 0) {
                    this.setting.pageIndex = pgIdx;
                    this.$element.treegridData('reload', this.setting);
                }
            }
        },
        reload: function (param) {
            // param.sortField, param.sortDesc, param.pageIndex, param.pageSize
            // 实际上此处支持对所有的options的修改，param的格式参考defaults
            // 更新表格设置
            $.extend(true, this.setting, param || {});
            // 给table和paginator加一个外包div容器
            if (this.$element.parent(".treegrid-container").length === 0) {
                var container = $("<div class='treegrid-container' style='position:relative;min-height:40px;'></div>");
                this.$element.before(container);
                container.append(this.$element);
            }
            if (this.setting.url) {
                var ajaxP = this.setting.ajaxParams;
                if (typeof (this.setting.sortField) === "string" && typeof (this.setting.sortKey) === "string") {
                    ajaxP[this.setting.sortKey] = this.setting.sortField;
                }
                if (typeof (this.setting.descKey) === "string") {
                    ajaxP[this.setting.descKey] = this.setting.sortDesc;
                }
                ajaxP.page = this.setting.page;
                if (this.setting.page) {
                    ajaxP.pageIndex = this.setting.pageIndex;
                    ajaxP.pageSize = this.setting.pageSize;
                }
                if (this.setting.treeView) {
                    ajaxP.parentColumn = this.setting.parentColumn;
                }
                ajaxP.treeView = this.setting.treeView;
                // 使用自定义的loadingView作为操作缓存
                this.$element.parent(".treegrid-container").loadingView("show");
                var $table = this.$element;
                var $this = this;
                $.ajax({
                    type: this.setting.type,
                    url: this.setting.url,
                    data: ajaxP,
                    dataType: "JSON",
                    success: function (data, textStatus, jqXHR) {
                        //debugger;
                        // 这里的data采用通用结构,data.retCode=0,data.message,data.datas
                        if (data.retCode === 0) {
                            $this.setting.data = data.datas;
                            var pageChange = false;
                            if (typeof (data.pageIndex) === "number") {
                                if ($this.setting.pageIndex !== data.pageIndex) {
                                    pageChange = true;
                                    $this.setting.pageIndex = data.pageIndex;
                                }
                            }
                            if (typeof (data.pageSize) === "number") {
                                $this.setting.pageSize = data.pageSize;
                            }
                            if (typeof (data.pageCount) === "number") {
                                if (data.pageCount !== $this.setting.pageCount) {
                                    pageChange = true;
                                    $this.setting.pageCount = data.pageCount;
                                }
                            }
                            $this.createTable(data.datas, $this.setting.emptyMessage);
                            // paginator并不需要每次都重建，所以这里加了pageChange的设定
                            if ($this.setting.page && pageChange) {
                                $this.createPaginator();
                            }
                        } else {
                            // 报告异常？
                            $this.createTable(null, data.message);
                            $this.setting.pageIndex = 1;
                            $this.setting.pageCount = 1;
                            if ($this.setting.page) {
                                $this.createPaginator();
                            }
                        }
                        $table.parent(".treegrid-container").loadingView("hide");
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        $table.parent(".treegrid-container").loadingView("hide");
                        // 用了自定义的弹出框，是不是需要做检验？
                        if ($.isFunction(jBootAlert)) {
                            jBootAlert(errorThrown);
                        } else {
                            alert(errorThrown);
                        }
                    }
                });
            }
            else {
                // 使用自定义的loadingView作为操作缓存
                this.$element.parent(".treegrid-container").loadingView("show");
                // 对this.setting.data进行排序
                if ($.isArray(this.setting.data)) {
                    var sk, desc;
                    if (typeof (this.setting.sortField) === "string") {
                        sk = this.setting.sortField;
                    }
                    if (typeof sk === "string" && sk.length > 0) {
                        desc = this.setting.sortDesc;
                        this.setting.data = this.setting.data.sort(function (a, b) {
                            if (a[sk] && b[sk]) {
                                if ($.isNumeric(a[sk]) && $.isNumeric(b[sk])) {
                                    if (!desc) {
                                        return a[sk] - b[sk];
                                    } else {
                                        return b[sk] - a[sk];
                                    }
                                } else {
                                    if (!desc) {
                                        return a[sk].localeCompare(b[sk], 'zh-CN');
                                    } else {
                                        return -a[sk].localeCompare(b[sk], 'zh-CN');
                                    }
                                }
                            }
                            return 0;
                        });
                    }
                }
                var data;
                var pageChange = false;
                if (this.setting.page && $.isArray(this.setting.data)) {
                    data = new Array();
                    if (!$.isNumeric(this.setting.pageSize) || this.setting.pageSize <= 0) {
                        this.setting.pageSize = 12;
                    }
                    var pc = this.setting.data.length / this.setting.pageSize;
                    if (this.setting.data.length % this.setting.pageSize !== 0) {
                        pc++;
                    }
                    if (pc === 0) {
                        pc = 1;
                    }
                    if (this.setting.pageCount !== pc) {
                        pageChange = true;
                        this.setting.pageCount = pc;
                    }
                    if (!$.isNumeric(this.setting.pageIndex) || this.setting.pageIndex < 1) {
                        pageChange = true;
                        this.setting.pageIndex = 1;
                    }
                    if (this.setting.pageIndex > this.setting.pageCount) {
                        pageChange = true;
                        this.setting.pageIndex = this.setting.pageCount;
                    }
                    //url 方式的分页是服务器端实现的，那边给什么数据这里就显示什么
                    //data 方式需要自己分页，分页只计算根节点的数量，所以这里取得的条数和总数量是有可能存在差距的
                    var c = 0;
                    for (var i = 0; i < this.setting.data.length; i++) {
                        if (!this.setting.data[i][this.setting.parentColumn]) {
                            // 根节点
                            if (c >= (this.setting.pageIndex - 1) * this.setting.pageSize && c < this.setting.pageIndex * this.setting.pageSize) {
                                // 在取值区间
                                data.push(this.setting.data[i]);
                            }
                            c++;
                        } else {
                            // 非根节点，全部传入，供根节点查询组织
                            data.push(this.setting.data[i]);
                        }
                    }
                } else {
                    data = this.setting.data;
                }
                this.createTable(data, this.setting.emptyMessage);
                if (this.setting.page && pageChange) {
                    this.createPaginator();
                }
                this.$element.parent(".treegrid-container").loadingView("hide");
            }
        }
    };

    $.fn.treegridData = function (option) {
        var args = Array.apply(null, arguments);
        args.shift();
        var r;
        return this.each(function () {
            var $this = $(this),
                data = $this.data('treegridData'),
                options = typeof option === 'object' && option;

            if (!data) {
                $this.data('treegridData', (data = new TreegridData(this, $.extend({}, $.fn.treegridData.defaults, options, $(this).data()))));
            }

            if (typeof option === 'string') {
                r = data[option].apply(data, args);
            }
        }), r || this;
    };

    $.fn.treegridData.defaults = {
        // no data message
        emptyMessage: "未找到数据",
        // tree
        id: 'Id',
        parentColumn: 'ParentId',
        expandColumn: null,//在哪一列上面显示展开按钮
        expandAll: true,  //是否全部展开
        expanderExpandedClass: 'icon-caret-down',//展开的按钮的图标
        expanderCollapsedClass: 'icon-caret-right',//缩起的按钮的图标 
        // sort
        sortField: null,// 排序的列（标识）排序会交给服务端处理，因为还要考虑分页
        sortDesc: false,// 逆序或顺序
        sortKey: "sortField",// url参数的排序关键字字段名
        descKey: "isDesc",// url参数的排序顺序字段名
        // page
        page: false,
        pageIndex: 1,
        pageSize: 12,
        pageCount: 0,
        paginator: {},
        // data
        data: [],    //构造table的数据集合
        type: "GET", //请求数据的ajax类型
        url: null,   //请求数据的ajax的url
        ajaxParams: {}, //请求数据的ajax的data属性
        // table
        titleStyle: {},// 标题栏的style
        striped: true,   //是否各行渐变色
        bordered: true,  //是否显示边框
        columns: [
            /*{
                "title": "序号",
                "field": "Index",
                "width": "45",
                "placeHolder": null, // 当没有内容时显示的一个提示信息
                "autoincreament": true, // 自增长数字（树视图分级别如：1, 1.1）
                "templet": "",
                "toolbar": "",
                "sortable": false,
                "editable": false,
                "type": "",
                "align": "left",
                "style": null
              },
              {
                "title": "位置",
                "field": "MMLocation",
                "width": "160",
                "type": "",
                "sortable": false,
                "align": "left",
                "templet": "",
                "toolbar": "#location_bar",
                "style": "background:#FFF;",
                "editable": false
              }
             */
        ],
        // 事件监听和options.onEvent是互斥的，options.onEvent优先
        // toolBar事务处理，另一种实现是通过event:tool-action，参数:target,obj(obj.event,obj.data,obj.id)
        onActionEvent: null,
        // editable
        onPreEdit: null,// 传递修改内容，让用户有机会判断是否可以修改（返回false则取消修改），此采用直接调用方式，没有事件（事件是异步的）
        onEdited: null,// 修改完成，此操作支持grid-edited事件，无法直接控制取消修改，要做数据检查请在onPreEdit处理参数:target(table),obj(obj.data,obj.field,obj.value)
        autoNext: true, // 自动跳转到下一个输入
        autoClose: true, //点击输入区域外自动关闭
        editInfo: { // 如果编辑内容为空，显示占位内容，为placeHolder默认
            text: "空内容",
            select: "请选择",
            date: "yyyy-MM-dd"
        },
        editMode: "popup"//inline
    };
})(jQuery);