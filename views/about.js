/* ============================================================
 * 分区模块：关于
 * 内容直接改本文件的 HTML（自我介绍、建站故事、链接）
 * 站长名/简介自动取 site.js 的 name/intro
 * ============================================================ */
(function () {
  const S = {
    id: "about",       // 路由地址：#/about
    label: "关于",      // 顶部导航标签文字
    order: 45,         // 排在留言板（40）之后、网站推荐（50）之前

    render(el, ctx) {
      const s = ctx.SITE;
      el.innerHTML =
        '<div class="view-head"><h2 class="view-title">👋 关于</h2></div>' +
        '<article class="post-detail">' +
          '<div class="banner" style="margin-bottom:20px">' +
            '<div class="avatar">' + (s.avatar
              ? '<img src="' + ctx.esc(s.avatar) + '" alt="头像">'
              : ctx.esc((s.name || "博")[0])) + "</div>" +
            '<div><h2>' + ctx.esc(s.name) + "</h2>" +
            '<p>' + ctx.esc(s.tagline) + "</p></div>" +
          "</div>" +
          '<div class="post-content">' +
            "<p>" + ctx.esc(s.intro) + "</p>" +
            "<h3>这个站是怎么搭的</h3>" +
            "<p>纯手写的零依赖静态博客：HTML/CSS/JS 三件套，不依赖任何框架和构建工具。" +
            "文章、作品、插件全部模块化存放，托管在 GitHub Pages（免费），" +
            "经 Cloudflare CDN 加速，评论由 giscus 驱动（存在本仓库的 Discussions 里）。</p>" +
            '<div class="chips">' +
              '<span class="chip">零依赖</span><span class="chip">GitHub Pages</span>' +
              '<span class="chip">Cloudflare CDN</span><span class="chip">giscus 评论</span>' +
              '<span class="chip">RSS 订阅</span>' +
            "</div>" +
            "<h3>找到我</h3>" +
            '<p>GitHub：<a href="https://github.com/kuqi061128-cyber" target="_blank" rel="noopener">github.com/kuqi061128-cyber</a><br>' +
            '本站源码：<a href="https://github.com/kuqi061128-cyber/kuqi061128-cyber.github.io" target="_blank" rel="noopener">仓库地址</a>（觉得搭得还行欢迎参考）</p>' +
            "<h3>留言</h3>" +
            '<p>有任何想说的、想建议的，去 <a href="#/board">留言板</a> 写两句，' +
            "用 GitHub 账号登录即可评论，我看到都会回。</p>" +
          "</div>" +
        "</article>";
    },
  };

  registerSection(S);
})();
