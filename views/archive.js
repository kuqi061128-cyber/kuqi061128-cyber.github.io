/* ============================================================
 * 分区模块：归档（按年月时间轴浏览全部文章）
 *   路由：#/archive
 *   数据：window.BLOG_POSTS（由 api-loader 从 Strapi 或本地兜底注入）
 * ============================================================ */
(function () {

  const S = {
    id: "archive",     // 路由地址 #/archive
    label: "归档",      // 顶部导航标签
    order: 32,         // 排在作品(30)之后、「我的」(35)之前

    render(el, ctx) {
      const esc = ctx.esc;
      const posts = (ctx.ARTICLES || []).slice()
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));

      if (!posts.length) {
        el.innerHTML = '<div class="view-head"><h2 class="view-title">🗂 归档</h2></div>' +
          '<div class="empty">还没有文章</div>';
        return;
      }

      /* 按 YYYY-MM 分组 */
      const groups = [];
      const index = {};
      posts.forEach(function (a) {
        const d = String(a.date || "");
        const key = d.slice(0, 7) || "未知";
        if (!index[key]) { index[key] = { key: key, items: [] }; groups.push(index[key]); }
        index[key].items.push(a);
      });

      const label = function (key) {
        const m = key.match(/^(\d{4})-(\d{2})$/);
        return m ? m[1] + " 年 " + Number(m[2]) + " 月" : key;
      };

      el.innerHTML =
        '<div class="view-head"><h2 class="view-title">🗂 归档</h2>' +
        '<span style="font-size:13px;color:var(--muted)">共 ' + posts.length + ' 篇</span></div>' +
        groups.map(function (g) {
          return '<div class="arc-group">' +
            '<div class="arc-month">' + esc(label(g.key)) +
            ' <span>· ' + g.items.length + ' 篇</span></div>' +
            g.items.map(function (a) {
              return '<a class="arc-item" href="#/post/' + a.id + '">' +
                '<span class="arc-day">' + esc(String(a.date || "").slice(8, 10) || "—") + ' 日</span>' +
                '<span class="arc-title">' + esc(a.title) + '</span>' +
                '<span class="arc-cat">' + esc(a.category || "") + '</span></a>';
            }).join("") +
            '</div>';
        }).join("");
    },
  };

  registerSection(S);
})();
