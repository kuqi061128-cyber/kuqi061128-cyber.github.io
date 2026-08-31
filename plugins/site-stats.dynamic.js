/* ============================================================
 * 插件：站点统计（右栏 · 统计）—— 云端数据版
 * 替换原 plugins/site-stats.js 使用；记得在 index.html 把 ?v= 升一位
 *
 * 变化点:
 *   - 获赞数: 从「访客本地值」升级为「云端全网真实总数」(Like 集合条数)
 *   - 新增:   「留言数」(Message 集合条数，未建该类型时显示 —)
 *   - PV/UV:  仍用不蒜子(免费全网计数)；以后想完全自主可在阶段D自建
 * ============================================================ */
(function () {
  const P = {
    id: "site-stats",
    column: "right",
    order: 10,
    enabled: true,
    live: true,
  };

  P.render = function (el, ctx) {
    const api = window.DSH_API;
    P._el = el; P._ctx = ctx;

    /* 重绘前保留不蒜子已填的 PV/UV 值（脚本只挂一次，重绘后不再自动填，故需手动回填） */
    const oldPv = document.getElementById("busuanzi_value_site_pv");
    const oldUv = document.getElementById("busuanzi_value_site_uv");
    const pvVal = (oldPv && oldPv.textContent.trim() && oldPv.textContent !== "…") ? oldPv.textContent : "…";
    const uvVal = (oldUv && oldUv.textContent.trim() && oldUv.textContent !== "…") ? oldUv.textContent : "…";

    const likes = P._likes != null ? P._likes : ctx.state.likes;
    const msgs = P._msgs != null ? P._msgs : "…";

    const row = (k, v) => '<div class="stat-row"><span>' + k + '</span><b>' + v + '</b></div>';
    el.innerHTML =
      '<div class="widget-title"><span><span class="ico">📊</span>站点统计</span></div>' +
      row("文章数", ctx.ARTICLES.length) +
      row("作品数", ctx.WORKS.length) +
      row("总访问量", '<span id="busuanzi_value_site_pv">' + pvVal + '</span>') +
      row("访客数", '<span id="busuanzi_value_site_uv">' + uvVal + '</span>') +
      row("获赞数", likes) +
      row("留言数", msgs);

    /* 不蒜子：脚本只挂一次，避免 SPA 重绘时反复下载+请求堆积 */
    if (!P._bsAdded) {
      P._bsAdded = true;
      const b = document.createElement("script");
      b.id = "busuanzi-script";
      b.async = true;
      b.src = "https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js";
      document.body.appendChild(b);
      /* 首次加载兜底：6 秒后若仍为 … 显示 — */
      setTimeout(function () {
        const pv = document.getElementById("busuanzi_value_site_pv");
        const uv = document.getElementById("busuanzi_value_site_uv");
        if (pv && pv.textContent === "…") pv.textContent = "—";
        if (uv && uv.textContent === "…") uv.textContent = "—";
      }, 6000);
    }

    /* ---- 异步取云端计数，取到后只重绘一次 ---- */
    if (!P._fetched) {
      P._fetched = true;

      api.get("/api/likes?pagination[pageSize]=1").then(function (r) {
        const m = r.meta && r.meta.pagination;
        if (m && typeof m.total === "number") {
          P._likes = m.total;
          if (P._el) P.render(P._el, P._ctx);
        }
      })["catch"](function () { P._likes = ctx.state.likes; });

      api.get("/api/messages?pagination[pageSize]=1").then(function (r) {
        const m = r.meta && r.meta.pagination;
        if (m && typeof m.total === "number") {
          P._msgs = m.total;
          if (P._el) P.render(P._el, P._ctx);
        }
      })["catch"](function () { P._msgs = "—"; });
    }
  };

  registerPlugin(P);
})();
