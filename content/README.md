# 内容库说明

博客的文章和作品全部存放在本目录，主页（index.html）不再写死任何内容。

```
content/
├── posts/                文章：一篇一个文件
│   ├── _template.js        文章模板（不会被加载）
│   ├── 2026-08-20-welcome.js
│   ├── 2026-08-17-grid-layout.js
│   ├── 2026-08-12-zero-dep-blog.js
│   ├── 2026-08-05-august-notes.js
│   └── 2026-08-22-publish-guide.js
├── works/                作品：一个作品一个文件
│   ├── _template.js        作品模板（不会被加载）
│   ├── 01-dsh-desktop.js
│   ├── 02-homepage.js
│   ├── 03-dashboard.js
│   ├── 04-snake-game.js
│   ├── 05-markdown-editor.js
│   └── 06-blog-icons.js
├── links/                网站推荐：一个网站一个文件
│   ├── _template.js        推荐模板（不会被加载）
│   └── 01-deepseek.js … 08-unsplash.js
downloads/                下载包：作品的应用压缩包放这里
```

## 发一篇新文章（三步）

1. 复制 `posts/_template.js`，重命名为 `日期-英文Slug.js`（如 `2026-09-01-my-post.js`），填写标题、日期、分类、标签、摘要、正文，`id` 用一个没用过的数字；
2. 打开 `index.html`，找到底部「内容库引入区」，加一行：
   `<script src="content/posts/2026-09-01-my-post.js"></script>`
3. 保存、刷新浏览器，文章即上线（列表、热门、分类、标签云都会自动更新）。

## 发布一个新作品（三步，和发文章一样）

1. 复制 `works/_template.js`，重命名（如 `07-my-app.js`），填写各项内容，`id` 用一个没用过的数字；
2. 打开 `index.html`，在底部「内容库引入区」加一行：
   `<script src="content/works/07-my-app.js"></script>`
3. 保存、刷新浏览器，作品即上线（列表卡片、详情页自动生成）。

**更新一个作品**（如发新版本安装包）：改它对应的那个文件（换 `file` 路径、改 `version`、在 `detail` 里补更新日志）即可。

## 添加一个推荐网站（三步）

1. 复制 `links/_template.js`，重命名（如 `09-example.js`），填好网站名、地址、推荐语、分类；
2. 在 `index.html` 底部「内容库引入区」加一行：
   `<script src="content/links/09-example.js"></script>`
3. 保存刷新，「网站推荐」分区自动多一张卡片。修改/下线某个推荐只动它自己的文件。

## 作品详情页

每个作品都有自己的介绍页（点击作品卡片封面/标题进入，链接形如 `#/work/1`）。在作品文件里写 `detail` 字段即可编写介绍正文（支持 `<p>` `<h3>` `<ul><li>` `<img>` 等标签），加上 `date` 可显示发布日期。`id` 是详情页链接的编号，发布后不要再改（忘写会自动补）。

## 图片的使用（作品/文章配图按"文件夹封装"，背景图独立）

**作品和文章的图片跟内容文件放在一起**：每个作品/文章可以有一个与自己 js 文件同名的文件夹，图片写裸文件名即可，系统自动定位：

```
content/works/01-dsh-desktop.js        ← 作品文件
content/works/01-dsh-desktop/          ← 它的图片（icon.png、simple_1.png…）

content/posts/2026-09-01-my-post.js    ← 文章文件
content/posts/2026-09-01-my-post/      ← 它的插图（1.png、2.png…）
```

```js
coverImg: "cover.png"                  // 作品封面：裸文件名 = 自己文件夹里的图
detail 里 <img src="shot1.png">        // 介绍插图：同样写裸文件名
文章 content 里 <img src="1.png">      // 文章插图：同样写裸文件名
```

三种写法都支持：**裸文件名**（自动定位到自己的文件夹）、**assets/ 开头**（全站资源）、**http(s) 链接**（外链）。

**全站资源保持独立**：背景图 `assets/background.png`、头像与网站图标 `assets/img/`，在 `site.js` 里配置。

图片建议：封面图宽度 ≥ 500px；单图体积 > 1MB 建议先压缩，页面加载更快。

## 给作品挂下载包（应用压缩包等）

1. 把压缩包放进 `my-site/downloads/` 目录（如 `my-app-v1.0.zip`）；
2. 在 `content/works/` 对应的作品文件上加三个字段：

```js
file: "downloads/my-app-v1.0.zip",   // 下载包路径，填了就出现「⬇ 下载」按钮
version: "v1.0",                     // 可选：显示在按钮上的版本号
size: "36 MB",                       // 可选：包大小提示
```

`file` 也可以填外部链接（网盘、官网等 `https://` 地址），会以新标签页打开。

当前已接入：`downloads/dsh-desktop-v1.2.0.zip`（DSH 桌面应用 v1.2.0，149 MB）。

## 注意事项

- 文章 `id` 必须唯一，且**发布后不要再改**（文章链接 `#/post/编号` 依赖它）；
- `date` 用 `YYYY-MM-DD` 格式，列表自动按日期倒序；
- `views` 是浏览量基数，真实浏览会自动叠加；
- 作品封面 `cover` 目前是渐变色，可改成 `url("assets/作品截图.png")` 使用真实截图（图片放进 assets 目录）；
- 纯静态方案没有服务端目录列表能力，所以新文章需要在 index.html 加一行引入；想彻底"丢文件即发布"需要构建工具或后端，目前为了保持零依赖没有采用。
