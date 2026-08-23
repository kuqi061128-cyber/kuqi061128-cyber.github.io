# 分区模块说明

博客顶部导航的扩展分区存放在本目录，**一个分区一个文件**。

## 文件一览

| 文件 | 分区 |
|---|---|
| board.js | 留言板（giscus 真评论区，评论存仓库 Discussions；配置在 site.js 的 giscus 段） |
| links.js | 网站推荐（数据在 content/links/ 目录，一个网站一个文件） |
| _template.js | 新分区模板（不会被加载） |

首页 / 文章 / 作品是内置分区，代码在 index.html 里；扩展分区（如留言板）在本目录。

## 新增一个分区（如「相册」）

1. 复制 `_template.js` 重命名为 `gallery.js`，改 `id`（路由地址）、`label`（导航文字）和 `render`（内容）；
2. 在 `index.html` 底部「分区模块引入区」加一行 `<script src="views/gallery.js"></script>`；
3. 保存刷新：顶部导航自动出现新分区，地址为 `#/gallery`。

## 留言板维护

- 留言板由 giscus 驱动（评论区直接嵌入，访客用 GitHub 账号登录留言）；
- 评论数据存在**仓库的 Discussions 标签**里，置顶/回复/删除去仓库页面操作；
- 更换 giscus 仓库/分类：改 site.js 的 `giscus` 配置段（ID 在 https://giscus.app 生成）。

## ctx 接口

`render(el, ctx)` 的 ctx 与插件系统一致：`SITE / ARTICLES / WORKS / state / articleViews / esc / toast / fmtNow / storeGet / storeSet / refreshPlugins`。
