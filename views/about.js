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
      const owner = s.ownerName || s.name;   // 个人向位置用作者称呼，未配置则回退站名
      el.innerHTML =
        '<div class="view-head"><h2 class="view-title">👋 关于</h2></div>' +
        '<article class="post-detail">' +
          '<div class="banner" style="margin-bottom:20px">' +
            '<div class="avatar">' + (s.avatar
              ? '<img src="' + ctx.esc(s.avatar) + '" alt="头像">'
              : ctx.esc((owner || "博")[0])) + "</div>" +
            '<div><h2>' + ctx.esc(owner) + "</h2>" +
            '<p>' + ctx.esc(s.tagline) + "</p></div>" +
          "</div>" +
          '<div class="post-content">' +
            "<p>" + ctx.esc(s.intro) + "</p>" +
            "<h3>这个站是怎么搭的</h3>" +
            "<p>纯手写的零依赖静态博客：HTML/CSS/JS 三件套，不依赖任何前端框架和构建工具。" +
            "文章、作品、留言等动态内容由自建的 Strapi 后端提供（Node.js + MySQL），" +
            "Nginx 托管静态文件并反代接口；后端不可用时自动回退到本地内置内容，网站永远打得开。</p>" +
            '<div class="chips">' +
              '<span class="chip">零依赖</span><span class="chip">Strapi 动态内容</span>' +
              '<span class="chip">Nginx</span><span class="chip">本地兜底</span>' +
              '<span class="chip">RSS 订阅</span>' +
            "</div>" +
            "<h3>找到我</h3>" +
            '<p>GitHub：<a href="https://github.com/kuqi061128-cyber" target="_blank" rel="noopener">github.com/kuqi061128-cyber</a><br>' +
            '本站源码：<a href="https://github.com/kuqi061128-cyber/kuqi061128-cyber.github.io" target="_blank" rel="noopener">仓库地址</a>（觉得搭得还行欢迎参考）</p>' +
            "<h3>留言</h3>" +
            '<p>有任何想说的、想建议的，去 <a href="#/board">留言板</a> 直接写两句，' +
            "不用注册任何账号，我看到都会回。</p>" +
          "</div>" +
        "</article>";
    },
  };

  registerSection(S);
})();
