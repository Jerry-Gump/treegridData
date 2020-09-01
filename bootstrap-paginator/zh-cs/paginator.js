/*在treegridData添加paginator的过程中，有语言环境，也有项目环境，为了方便管理，就把这块独立出来*/
$(function () {
    $.fn.treegridData.paginator = {
        itemContainerClass: function (type, page, current) {
            switch (type) {
                case "first":
                    if (current === 1)
                        return "disabled";
                    else
                        return "";
                case "prev":
                    if (current === 1)
                        return "disabled";
                    else
                        return "";
                case "next":
                    if (current === this.totalPages)
                        return "disabled";
                    else
                        return "";
                case "last":
                    if (current === this.totalPages)
                        return "disabled";
                    else
                        return "";
                case "page":
                    return (page === current) ? "active" : "";
            }

        },
        shouldShowPage: function (type, page, current) {
            return true;
        },
        itemTexts: function (type, page, current) {//如下的代码是将页眉显示的中文显示我们自定义的中文。
            switch (type) {
                case "first": return "首页";
                case "prev": return "上一页";
                case "next": return "下一页";
                case "last": return "末页";
                case "page": return page;
            }
        }
    };
});