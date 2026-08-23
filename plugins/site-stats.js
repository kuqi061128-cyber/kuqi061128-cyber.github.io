/* ============================================================
 * 插件：站点统计（右栏 · 统计）
 * live=true：文章/留言/点赞等数据一变就自动重绘
 * ============================================================ */
(function () {
  const P = {
    id: "site-stats",
    column: "right",
    order: 10,
    enabled: true,
    live: true,

    render(el, ctx) {
      const s = ctx.state;
      const row = (k, v) => '<div class="stat-row"><span>' + k + '</span><b>' + v + '</b></div>';
      el.innerHTML =
        '<div class="widget-title"><span><span class="ico">📊</span>站点统计</span></div>' +
        row("文章数", ctx.ARTICLES.length) +
        row("作品数", ctx.WORKS.length) +
        row("总访问量", s.visits) +
        row("获赞数", 256 + s.likes);
    },
  };

  registerPlugin(P);
})();
