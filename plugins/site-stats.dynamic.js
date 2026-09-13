/* ============================================================
 * 插件：站点统计（右栏 · 统计）—— 全部数据自建版 v3
 *
 * 数据来源（全部走自己的 Strapi，2026-09-13 起不再依赖第三方）：
 *   - 文章数 / 作品数：内存中的 ARTICLES、WORKS
 *   - 总访问量 / 今日访问 / 最近 7 天：POST /api/visits/hit 打点 + GET /api/visits/summary 汇总
 *   - 获赞数：/api/likes 条数    - 留言数：/api/messages 条数
 *
 * 说明：打点每次页面加载只发一次（模块级标记，SPA 重绘不会重复计数）；
 *       统计接口拿不到时显示「—」，不影响其它功能。
 * ============================================================ */
(function () {
  let styleAdded = false;
  function ensureStyle() {
    if (styleAdded) return;
    styleAdded = true;
    const st = document.createElement("style");
    st.textContent =
      ".v7-chart{display:flex;align-items:flex-end;gap:6px;margin-top:12px;padding-top:10px;" +
      "border-top:1px dashed rgba(255,255,255,.06)}" +
      ".v7-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}" +
      ".v7-bar{width:100%;border-radius:3px;background:linear-gradient(180deg,var(--accent),var(--accent2));" +
      "min-height:4px;transition:height .3s ease}" +
      ".v7-day{font-size:11px;color:var(--muted)}" +
      ".v7-title{font-size:12px;color:var(--muted);margin-top:10px}";
    document.head.appendChild(st);
  }

  const P = {
    id: "site-stats",
    column: "right",
    order: 10,
    enabled: true,
    live: true,
  };

  function repaint() {
    if (P._el && P._ctx) P.render(P._el, P._ctx);
  }

  function loadCounts(api, ctx) {
    api.get("/api/likes?pagination[pageSize]=1").then(function (r) {
      const m = r.meta && r.meta.pagination;
      if (m && typeof m.total === "number") { P._likes = m.total; repaint(); }
    })["catch"](function () { P._likes = ctx.state.likes; repaint(); });

    api.get("/api/messages?pagination[pageSize]=1").then(function (r) {
      const m = r.meta && r.meta.pagination;
      if (m && typeof m.total === "number") { P._msgs = m.total; repaint(); }
    })["catch"](function () { P._msgs = "—"; repaint(); });
  }

  function loadSummary(api) {
    api.get("/api/visits/summary").then(function (r) {
      if (r && r.data) { P._data = r.data; repaint(); }
    })["catch"](function () {
      P._data = P._data || { total: "—", today: "—", days: [] };
      repaint();
    });
  }

  function chartHtml(days) {
    if (!days || !days.length) return "";
    const max = Math.max.apply(null, days.map(function (d) { return d.count || 0; })) || 1;
    return '<div class="v7-title">最近 7 天</div>' +
      '<div class="v7-chart">' + days.map(function (d) {
        const h = Math.max(4, Math.round((d.count || 0) / max * 46));
        return '<div class="v7-col" title="' + d.date + "：" + d.count + ' 次">' +
          '<div class="v7-bar" style="height:' + h + 'px"></div>' +
          '<span class="v7-day">' + String(d.date).slice(8) + "</span></div>";
      }).join("") + "</div>";
  }

  P.render = function (el, ctx) {
    ensureStyle();
    const api = window.DSH_API;
    P._el = el;
    P._ctx = ctx;

    const d = P._data || {};
    const likes = P._likes != null ? P._likes : ctx.state.likes;
    const msgs = P._msgs != null ? P._msgs : "…";
    const row = (k, v) => '<div class="stat-row"><span>' + k + "</span><b>" + v + "</b></div>";

    el.innerHTML =
      '<div class="widget-title"><span><span class="ico">📊</span>站点统计</span></div>' +
      row("文章数", ctx.ARTICLES.length) +
      row("作品数", ctx.WORKS.length) +
      row("总访问量", d.total != null ? d.total : "…") +
      row("今日访问", d.today != null ? d.today : "…") +
      row("获赞数", likes) +
      row("留言数", msgs) +
      chartHtml(d.days);

    /* 打点：每次页面加载仅一次（放在首屏渲染后，不抢关键路径） */
    if (!P._hit) {
      P._hit = true;
      setTimeout(function () {
        api.post("/api/visits/hit", {}).then(function () { loadSummary(api); })
          ["catch"](function () { loadSummary(api); });
        loadCounts(api, ctx);
      }, 600);
    }
  };

  registerPlugin(P);
})();
