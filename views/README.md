# 分区模块说明

博客顶部导航的扩展分区存放在本目录，**一个分区一个文件**。

## 文件一览

| 文件 | 分区 |
|---|---|
| board.js | 留言板（旧版 giscus 实现，已停用） |
| board.dynamic.js | 留言板（**当前使用**：匿名留言，数据存 Strapi Message 集合） |
| about.js | 关于（自我介绍 + 建站故事 + 链接，内容直接改本文件） |
| links.js | 网站推荐（数据在 content/links/ 目录，一个网站一个文件；动态模式下优先读 Strapi Link 集合） |
| _template.js | 新分区模板（不会被加载） |

首页 / 文章 / 作品是内置分区，代码在 index.html 里；扩展分区（如留言板）在本目录。

## 新增一个分区（如「相册」）

1. 复制 `_template.js` 重命名为 `gallery.js`，改 `id`（路由地址）、`label`（导航文字）和 `render`（内容）；
2. 在 `index.html` 底部「分区模块引入区」加一行 `<script src="views/gallery.js"></script>`；
3. 保存刷新：顶部导航自动出现新分区，地址为 `#/gallery`。

## 留言板维护

- 留言板是云端匿名留言墙：访客填昵称直接留言，无需任何账号；
- 数据存 Strapi 的 Message 集合，管理去 https://kuqis.cloud/admin → Content Manager → Message（只删不改）；
- 服务器 Nginx 已对写接口限流防灌水（配置在 /etc/nginx/conf.d/00-ratelimit.conf）。

## ctx 接口

`render(el, ctx)` 的 ctx 与插件系统一致：`SITE / ARTICLES / WORKS / state / articleViews / esc / toast / fmtNow / storeGet / storeSet / refreshPlugins`。
