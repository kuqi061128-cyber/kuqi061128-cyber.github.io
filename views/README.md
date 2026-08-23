# 分区模块说明

博客顶部导航的扩展分区存放在本目录，**一个分区一个文件**。

## 文件一览

| 文件 | 分区 |
|---|---|
| board.js | 留言板（含表单、留言列表、种子留言配置） |
| links.js | 网站推荐（数据在 content/links.js，加网站改那里即可） |
| _template.js | 新分区模板（不会被加载） |

首页 / 文章 / 作品是内置分区，代码在 index.html 里；扩展分区（如留言板）在本目录。

## 新增一个分区（如「相册」）

1. 复制 `_template.js` 重命名为 `gallery.js`，改 `id`（路由地址）、`label`（导航文字）和 `render`（内容）；
2. 在 `index.html` 底部「分区模块引入区」加一行 `<script src="views/gallery.js"></script>`；
3. 保存刷新：顶部导航自动出现新分区，地址为 `#/gallery`。

## 留言板维护

- 整个留言板逻辑在 `board.js`，改样式或行为只动这个文件；
- 文件顶部的 `BLOG_BOARD_SEEDS` 是新访客看到的初始留言，可自由增删；
- 访客提交的留言存在访客自己的浏览器里（localStorage），换浏览器看不到——这是纯静态方案的限制，需要全站共享留言就得接后端。

## ctx 接口

`render(el, ctx)` 的 ctx 与插件系统一致：`SITE / ARTICLES / WORKS / state / articleViews / esc / toast / fmtNow / storeGet / storeSet / refreshPlugins`。
