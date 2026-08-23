/* ============================================================
 * 分区模块：网站推荐
 * 数据在 content/links.js（加网站改那里，本文件一般不用动）
 * 卡片点击后在新标签页打开对应网站
 * ============================================================ */
(function () {
  const FALLBACK_COLORS = ["#38bdf8", "#818cf8", "#f472b6", "#34d399", "#fbbf24", "#f87171"];

  const S = {
    id: "links",        // 路由地址：#/links
    label: "网站推荐",   // 顶部导航标签文字
    order: 50,          // 排在留言板（40）之后

    render(el, ctx) {
      const list = window.BLOG_SITES || [];
      el.innerHTML =
        '<div class="view-head"><h2 class="view-title">🔗 网站推荐</h2></div>' +
        (list.length
          ? '<div class="works-grid">' + list.map((s, i) => {
              const color = s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
              let domain = s.url || "";
              try { domain = new URL(s.url).hostname; } catch (e) {}
              return '<a class="link-card" href="' + ctx.esc(s.url) + '" target="_blank" rel="noopener">' +
                '<div class="link-icon" style="background:' + color + '">' +
                  ctx.esc(String(s.name || "网")[0].toUpperCase()) + '</div>' +
                '<div class="link-body"><h4>' + ctx.esc(s.name) + '</h4>' +
                '<p>' + ctx.esc(s.desc) + '</p>' +
                '<div class="work-foot"><span class="work-tag">' + ctx.esc(s.tag) + '</span>' +
                '<span class="link-dom">' + ctx.esc(domain) + '</span></div></div></a>';
            }).join("") + '</div>'
          : '<div class="empty">还没有推荐网站，去 content/links.js 添加吧</div>');
    },
  };

  registerSection(S);
})();
