/* 文章：零依赖博客搭建教程 */
registerPost({
  id: 3,
  title: "用纯 HTML/CSS/JS 搭建零依赖博客",
  date: "2026-08-12",
  category: "教程",
  tags: ["JavaScript", "静态博客"],
  views: 190,
  summary: "不装 Node、不装依赖，一个 HTML 文件搞定路由、渲染和本地存储，随便扔到 GitHub Pages 就能上线。",
  content: `
    <p>很多人以为写博客系统一定要框架，其实一个文件就够了。</p>
    <h3>Hash 路由</h3>
    <p>监听 hashchange 事件，解析 #/articles、#/works 这样的地址并渲染对应分区，浏览器的前进后退也能正常工作。</p>
    <h3>数据驱动渲染</h3>
    <p>文章一篇一个文件放在 content/posts/ 目录，作品一个一个文件放在 content/works/ 目录，页面加载时自动汇总并由渲染函数转成 HTML 填入中栏。要发新内容，复制模板填好再加一行引入即可。</p>
    <h3>localStorage 做轻量持久化</h3>
    <p>点赞数、留言、访问量都存在浏览器本地，无需后端。将来接上后端接口时，只需替换读写函数。</p>
  `,
});
