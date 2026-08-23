/* ============================================================
 * 插件：站点统计（右栏 · 统计）
 * live=true：文章/点赞等数据一变就自动重绘
 * 总访问量/访客数：不蒜子 busuanzi 真实全网计数（按域名统计，
 *   计数服务由 busuanzi.ibruce.info 免费提供；国内偶尔不稳，
 *   拉不到数据时显示 —）；重绘后重新挂载脚本触发刷新
 * 获赞数：访客本地记录（点桌宠/点赞产生，无后端故不做全网累计）
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
        row("总访问量", '<span id="busuanzi_value_site_pv">…</span>') +
        row("访客数", '<span id="busuanzi_value_site_uv">…</span>') +
        row("获赞数", s.likes);

      /* 不蒜子：SPA 重绘会生成新 span，重挂脚本让它重新取数填充 */
      const old = document.getElementById("busuanzi-script");
      if (old) old.remove();
      const b = document.createElement("script");
      b.id = "busuanzi-script";
      b.async = true;
      b.src = "https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js";
      document.body.appendChild(b);

      /* 6 秒还没取到数（服务挂了/被墙）就显示 —，不留个假加载态 */
      setTimeout(() => {
        const pv = document.getElementById("busuanzi_value_site_pv");
        const uv = document.getElementById("busuanzi_value_site_uv");
        if (pv && !pv.textContent.trim().replace("…", "")) pv.textContent = "—";
        if (uv && !uv.textContent.trim().replace("…", "")) uv.textContent = "—";
      }, 6000);
    },
  };

  registerPlugin(P);
})();
