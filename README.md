支持树视图的bootstrap风格table；<br>
数据可支持data数组或者url动态加载方式，url加载优先；<br>
支持分页、排序、表格内编辑等功能。<br>
表格内编辑功能具有编辑前事件与编辑后事件。 <br>
最早的封装灵感来源于博文：https://www.cnblogs.com/landeanfen/p/6776152.html； <br>
底层树视图表格采用的是jquery-treegrid：https://github.com/maxazan/jquery-treegrid； <br>
分页组件采用：https://github.com/lyonlai/bootstrap-paginator； <br>
表格内编辑部分参考了x-editable：https://github.com/vitalets/x-editable，部分css类直接引用（逻辑部分自己写的）； <br>
日期选择器采用组件：https://github.com/uxsolutions/bootstrap-datepicker； <br>
另外还有自定义的页面缓冲显示插件与对话框插件：jquery-loadingView, bootstrap-dialog。<br>