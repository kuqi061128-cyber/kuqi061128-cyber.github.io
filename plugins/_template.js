/* ============================================================
 * 插件开发模板（本文件不会被加载，复制一份改成你的插件即可）
 *
 * 使用步骤：
 *   1. 复制本文件，重命名为你的插件名，如 my-plugin.js
 *   2. 修改下面的 id / column / order / render / init
 *   3. 在 index.html 底部的插件引入区加一行：
 *        <script src="plugins/my-plugin.js"></script>
 *   4. 刷新页面即可生效
 *
 * 字段说明：
 *   id        唯一 ID（英文，不与其他插件重复）
 *   column    "left" = 左栏互动插件；"right" = 右栏统计插件
 *   order     排序权重，数字越小排越前（左栏现有 10~40，右栏 10~40）
 *   enabled   false 即下线该插件（保留代码，方便再上线）
 *   className 卡片附加 class（可选）
 *   live      true 表示博客数据（留言/点赞/浏览量）变化时自动重绘（可选）
 *   render    必填：绘制内容。el 是整个 .widget 卡片，直接写 innerHTML
 *   init      可选：首次挂载后执行一次，用来绑事件、开定时器。
 *             绑事件请绑在 el 上（事件委托），这样 live 重绘不会失效
 *   destroy   可选：清理定时器等资源
 *
 * ctx 提供的接口：
 *   ctx.SITE / ctx.ARTICLES / ctx.WORKS   站点配置与文章、作品数据
 *   ctx.state      运行数据（messages 留言、likes 点赞、visits 访问量…）
 *   ctx.articleViews(id)   某篇文章的总浏览量
 *   ctx.esc(s)     文本转义（防 XSS，输出用户内容时务必使用）
 *   ctx.toast(msg) 右下角气泡提示
 *   ctx.fmtNow()   当前时间字符串 "2026-08-22 19:30"
 *   ctx.storeGet(key, def) / ctx.storeSet(key, val)  本地持久化
 *   ctx.refreshPlugins()   手动触发所有 live 插件重绘
 * ============================================================ */
(function () {
  const P = {
    id: "my-plugin",
    column: "left",        // 或 "right"
    order: 50,
    enabled: true,
    // className: "",
    // live: true,

    render(el, ctx) {
      el.innerHTML =
        '<div class="widget-title"><span><span class="ico">🧩</span>我的新插件</span></div>' +
        '<div class="quote-text">这里写插件内容，文章共 ' + ctx.ARTICLES.length + ' 篇。</div>';
    },

    init(el, ctx) {
      el.addEventListener("click", e => {
        if (e.target.closest('[data-act="demo"]')) ctx.toast("你点击了新插件！");
      });
    },

    // destroy() {},
  };

  registerPlugin(P);
})();
