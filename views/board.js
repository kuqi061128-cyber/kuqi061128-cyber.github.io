/* ============================================================
 * 分区模块：留言板（giscus · GitHub Discussions 真评论）
 * 配置在 site.js 的 giscus 段：仓库启用 Discussions + 安装 giscus 应用即可
 *
 * - 访客用 GitHub 账号登录留言，评论永久存在仓库 Discussions 里，全站可见
 * - 站长在仓库 Discussions 标签里置顶/回复/删除评论
 * - mapping=specific + 固定 term：不管从哪个域名/路径进来都是同一个帖子
 * - 主题跟随站点的亮/暗切换（index.html 的 applyTheme 会同步 iframe）
 * ============================================================ */
(function () {
  const S = {
    id: "board",       // 路由地址：#/board
    label: "留言板",    // 顶部导航标签文字
    order: 40,         // 排在导航里的位置（内置分区：首页10/文章20/作品30）

    render(el, ctx) {
      const g = ctx.SITE.giscus || {};
      const ghLink = "https://github.com/" + (g.repo || "") + "/discussions?discussions_q=guestbook";
      el.innerHTML =
        '<div class="view-head"><h2 class="view-title">💬 留言板</h2></div>' +
        '<div class="widget" style="padding:6px">' +
        '<div class="giscus" style="margin:14px"></div>' +
        '<div style="text-align:right;padding:0 14px 12px;font-size:12px">' +
        '<a href="' + ghLink + '" target="_blank" rel="noopener" style="color:var(--muted)">评论发不出去？在 GitHub 上参与讨论 →</a></div>' +
        '</div>';
      const box = el.querySelector(".giscus");
      if (!g.repo || !g.repoId || !g.categoryId) {
        box.innerHTML = '<div class="empty">留言板还没配置：请在 site.js 的 giscus 段填入仓库信息</div>';
        return;
      }
      const s = document.createElement("script");
      s.src = "https://giscus.app/client.js";
      s.async = true;
      s.crossOrigin = "anonymous";
      const cfg = {
        "data-repo": g.repo,
        "data-repo-id": g.repoId,
        "data-category": g.category || "Announcements",
        "data-category-id": g.categoryId,
        "data-mapping": "specific",
        "data-term": "guestbook",
        "data-strict": "0",
        "data-reactions-enabled": "1",
        "data-emit-metadata": "0",
        "data-input-position": "top",
        "data-theme": document.documentElement.getAttribute("data-theme") === "light" ? "noborder_light" : "transparent_dark",
        "data-lang": "zh-CN",
        "data-loading": "lazy",
      };
      for (const k in cfg) s.setAttribute(k, cfg[k]);
      box.appendChild(s);
    },
  };

  registerSection(S);
})();
