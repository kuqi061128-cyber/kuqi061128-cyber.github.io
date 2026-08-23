/* ============================================================
 * 站点信息配置 —— 博客名、头像、介绍、背景图、页脚，全改这一个文件
 *
 * 头像/背景图图片放 assets/ 或 assets/img/ 目录后填路径即可；
 * 想恢复默认样式：avatar 留空 "" 显示名字首字，intro 留空 "" 不显示简介。
 * ============================================================ */
window.BLOG_SITE = {
  /* 基本信息 */
  name: "Kuqi",                          // 博客名 / 站长名（顶部导航、页面标题都会用它）
  tagline: "来玩卡拉彼丘谢谢喵！",        // 一句话签名（导航栏和首页横幅显示）
  intro: "一位电子兴趣爱好者喵，无聊时就会捣鼓些莫名其妙的东西喵。",  // 首页横幅简介，留空 "" 则不显示
  url: "https://kuqis.cloud/",           // 站点正式地址（SEO/分享卡片/RSS 里的链接都用它）
  description: "Kuqi 的个人博客：分享教程、随笔、作品与下载。",  // 站点简介（搜索引擎和分享卡片摘要）

  /* 头像 */
  avatar: "assets/img/preview.gif?v=2",  // 头像图片路径（支持 PNG/JPG/GIF 动图）；留空 "" 则显示名字首字圆形占位

  /* 背景 */
  backgroundVideo: "assets/background.mp4?v=3",  // 动态视频背景（mp4/webm，静音循环播放）；留空 "" 则用静态背景图。换视频文件后把 v=3 改成 v=4 可强制访客刷新缓存
  background: "assets/background.jpg",       // 静态背景图（视频未设置或加载失败时的回退）
  backgroundDim: 0.6,                        // 压暗程度 0~1：越大背景越淡、文字越清晰
  cardOpacity: 0.5,                         // 卡片暗层浓度 0~1：越小卡片越透（背景更明显），越大文字区域越实
  cardBlur: 0,                              // 卡片磨砂模糊像素：0 = 完全不启用（性能最好，推荐）；调大（如 8、16）变磨砂玻璃感（会略增渲染负担）

  /* 页脚 */
  footer: "© 2026 Kuqi 的博客 · 由 GitHub Pages 免费托管",  // 页脚文字

  /* 留言板评论（giscus · GitHub Discussions）
     访客用 GitHub 账号登录留言，评论存进仓库 Discussions，站长在仓库 Discussions 标签管理
     前提：仓库已开启 Discussions 并安装 giscus 应用（https://github.com/apps/giscus） */
  giscus: {
    repo: "kuqi061128-cyber/kuqi061128-cyber.github.io",
    repoId: "R_kgDOUBJ86Q",
    category: "Announcements",              // 只允许维护者发起的讨论分类，防止访客乱开帖
    categoryId: "DIC_kwDOUBJ86c4DEALw",
  },
};
