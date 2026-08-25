# 分区模块说明

博客顶部导航的扩展分区存放在本目录，**一个分区一个文件**。

## 文件一览

| 文件 | 分区 |
|---|---|
| board.js | 留言板（旧版 giscus 实现，已停用） |
| board.dynamic.js | 留言板（**当前使用**：云端留言墙 + 额度制，游客 1 条/IP、登录 3 条/号） |
| account.js | 我的（**当前使用**：注册登录 / 投稿作品文章 / 修改密码 / 我的评论管理） |
| comments.js | 评论区组件（非分区；被 index.html 详情页调用，渲染评论列表 + 发表框） |
| about.js | 关于（自我介绍 + 建站故事 + 链接，内容直接改本文件） |
| links.js | 网站推荐（数据在 content/links/ 目录，一个网站一个文件；动态模式下优先读 Strapi Link 集合） |
| _template.js | 新分区模板（不会被加载） |

首页 / 文章 / 作品是内置分区，代码在 index.html 里；扩展分区（如留言板）在本目录。

## 新增一个分区（如「相册」）

1. 复制 `_template.js` 重命名为 `gallery.js`，改 `id`（路由地址）、`label`（导航文字）和 `render`（内容）；
2. 在 `index.html` 底部「分区模块引入区」加一行 `<script src="views/gallery.js"></script>`；
3. 保存刷新：顶部导航自动出现新分区，地址为 `#/gallery`。

## 留言板维护（额度制）

- 游客按 IP 限 **1** 条；注册登录后每账号 **3** 条（服务端强制，额度在
  message 控制器顶部 GUEST_LIMIT/USER_LIMIT 调整）；
- 数据存 Strapi 的 Message 集合，管理去 https://kuqis.cloud/admin → Content Manager → Message（只删不改）；
- 用户自己可在「我的 → 我的评论」删除自己的留言腾额度；
- Nginx 写接口限流防灌水（配置在 /etc/nginx/conf.d/00-ratelimit.conf）。

## 评论区维护（文章/作品）

- 详情页评论区由 views/comments.js 组件渲染，数据存 Strapi 的 Comment 集合；
- 仅登录用户可评论；删除走归属校验（只能删自己的），用户自助入口同「我的评论」面板；
- 违规内容清理：Comment 未接入后台界面，需 SSH 让 AI 按条件删除。

## ctx 接口

`render(el, ctx)` 的 ctx 与插件系统一致：`SITE / ARTICLES / WORKS / state / articleViews / esc / toast / fmtNow / storeGet / storeSet / refreshPlugins`。
