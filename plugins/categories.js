/* ============================================================
 * 插件：分类统计（右栏 · 统计）
 * 自动按文章数据汇总分类并画比例条
 * ============================================================ */
(function () {
  const P = {
    id: "categories",
    column: "right",
    order: 30,
    enabled: true,
    live: true,

    render(el, ctx) {
      const map = {};
      ctx.ARTICLES.forEach(a => { map[a.category] = (map[a.category] || 0) + 1; });
      const rows = Object.entries(map).sort((a, b) => b[1] - a[1]);
      const max = rows[0] ? rows[0][1] : 1;
      el.innerHTML =
        '<div class="widget-title"><span><span class="ico">📚</span>分类统计</span></div>' +
        rows.map(([cat, n]) =>
          '<div class="cat-row"><div class="cat-line"><span>' + ctx.esc(cat) + '</span><span>' + n + ' 篇</span></div>' +
          '<div class="bar-track"><div class="bar-fill" style="width:' + Math.round(n / max * 100) + '%"></div></div></div>'
        ).join("");
    },
  };

  registerPlugin(P);
})();
