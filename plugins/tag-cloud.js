/* ============================================================
 * 插件：标签云（右栏 · 统计）
 * 出现次数越多的标签字号越大，点击可筛选文章列表
 * ============================================================ */
(function () {
  const P = {
    id: "tag-cloud",
    column: "right",
    order: 40,
    enabled: true,
    live: true,

    render(el, ctx) {
      const map = {};
      ctx.ARTICLES.forEach(a => a.tags.forEach(t => { map[t] = (map[t] || 0) + 1; }));
      const max = Math.max(...Object.values(map), 1);
      el.innerHTML =
        '<div class="widget-title"><span><span class="ico">🏷️</span>标签云</span></div>' +
        '<div class="cloud">' + Object.entries(map).map(([tag, n]) => {
          const size = 12 + Math.round(n / max * 6);
          return '<a href="#/articles/tag/' + encodeURIComponent(tag) + '" style="font-size:' + size + 'px">#' + ctx.esc(tag) + '</a>';
        }).join("") + '</div>';
    },
  };

  registerPlugin(P);
})();
