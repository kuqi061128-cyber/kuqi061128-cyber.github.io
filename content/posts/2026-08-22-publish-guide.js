/* 文章：发布流程示范（这一篇本身就是按模板写出来的，可以照着抄） */
registerPost({
  id: 5,
  title: "如何发布一篇新文章或新作品",
  date: "2026-08-22",
  category: "教程",
  tags: ["教程", "博客"],
  views: 88,
  summary: "三步发布：复制模板 → 填内容 → 在 index.html 加一行引入。你正在读的这篇就是这样发布的。",
  content: `
    <p>博客的内容全部模块化存放：文章在 content/posts/ 目录（一篇一个文件），作品在 content/works/ 目录（一个作品一个文件）。</p>
    <h3>发一篇新文章</h3>
    <p>第一步：复制 content/posts/_template.js，重命名（建议用「日期-英文Slug.js」格式，如 2026-09-01-my-post.js）；第二步：填写标题、日期、分类、标签、摘要和正文；第三步：在 index.html 底部的「内容库引入区」加一行 &lt;script src="content/posts/2026-09-01-my-post.js"&gt;&lt;/script&gt;，保存刷新即可。</p>
    <h3>发布一个新作品</h3>
    <p>流程和发文章完全一样：复制 content/works/_template.js 重命名（如 07-my-app.js），填好内容后在 index.html 加一行引入。更新作品（比如发布新版本安装包）只改它自己那个文件。</p>
    <h3>注意事项</h3>
    <p>每篇文章的 id 必须唯一且发布后不要再改（文章链接依赖它）；日期格式保持 YYYY-MM-DD，列表会自动按日期排序。</p>
  `,
});
