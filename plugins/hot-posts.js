/* ============================================================
 * 插件：热门文章（右栏 · 统计）
 * 按浏览量取前 5，点击跳转正文；正文被打开后自动重排
 * ============================================================ */
(function () {
  const P = {
    id: "hot-posts",
    column: "right",
    order: 20,
    enabled: true,
    live: true,

    render(el, ctx) {
      const top = ctx.ARTICLES
        .slice()
        .sort((a, b) => ctx.articleViews(b.id) - ctx.articleViews(a.id))
        .slice(0, 5);
      el.innerHTML =
        '<div class="widget-title"><span><span class="ico">🔥</span>热门文章</span></div>' +
        '<ul class="hot-list">' + top.map((a, i) =>
          '<li><span class="hot-rank">' + (i + 1) + '</span>' +
          '<div><a href="#/post/' + a.id + '">' + ctx.esc(a.title) + '</a>' +
          '<div class="hot-views">' + ctx.articleViews(a.id) + ' 次浏览</div></div></li>'
        ).join("") + '</ul>';
    },
  };

  registerPlugin(P);
})();
