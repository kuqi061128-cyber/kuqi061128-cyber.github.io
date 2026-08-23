# 日常维护手册（改博客看这里）

> 部署相关（首次上线、域名）看 `DEPLOY.md`；各目录详细说明看 `content/README.md`、`plugins/README.md`、`views/README.md`。

## 一、改站点信息 → 只动 site.js

博客名、签名、头像、背景图/视频、页脚、站点简介都在 **site.js** 一个文件里，改完保存刷新即可，不用动 index.html。

## 二、发一篇新文章（三步）

1. 复制 `content/posts/_template.js`，重命名为 `日期-英文Slug.js`（如 `2026-09-01-my-post.js`），填写标题/日期/分类/标签/摘要/正文，`id` 用一个没用过的数字（发布后不要再改，文章链接靠它）；
2. 在 `index.html` 底部「内容库引入区」加一行：
   `<script src="content/posts/2026-09-01-my-post.js"></script>`
3. 更新 RSS：在本目录执行 `node tools/build-rss.js`（新文章进 rss.xml）。

文章插图：建一个与 js 文件同名的文件夹（`content/posts/2026-09-01-my-post/`），图片放进去，正文里直接写裸文件名 `<img src="1.png">`。

## 三、发一个新作品 / 更新作品

- 新作品：复制 `content/works/_template.js` 重命名（如 `02-my-app.js`），填好内容，在 index.html 加一行引入；封面/详情图放同名文件夹里写裸文件名。
- 更新作品（发新版本）：只改它自己那个文件——换 `file` 路径、改 `version`、在 `detail` 补更新日志。
- 下载包：小于 100MB 放 `downloads/` 目录；**超过 100MB 传 GitHub Releases**（git 推不上去），把附件链接填进 `file` 字段，详见 DEPLOY.md 第四步。

## 四、管理推荐网站（"网站推荐"页）

推荐网站一个站一个文件，全在 `content/links/` 目录：

- **加站**：复制 `content/links/_template.js` 重命名（如 `09-example.js`），填网站名/地址/推荐语/标签/颜色，再在 index.html「内容库引入区」加一行 `<script src="content/links/09-example.js"></script>`；
- **删站**：删掉对应 js 文件后，**必须同时删掉 index.html 里对应的那行 `<script>`**（否则浏览器控制台报 404）；
- **改站**：直接改它自己的文件，别的都不用动。

## 五、管理插件（左栏/右栏小工具）

插件全部在 `plugins/` 目录，一插件一文件：

- **新增**：复制 `plugins/_template.js` 改名（如 `weather.js`），写好后在 index.html「插件库引入区」加一行 `<script src="plugins/weather.js"></script>`；
- **下线**：把文件里 `enabled` 改成 `false`；
- **调顺序/换栏**：改 `order`（小靠前）和 `column`（`"left"` / `"right"` / `"float"` 浮动）。

桌宠素材和台词都在 `plugins/pet.js` 顶部配置区（BODY 形象、TALK 台词表、SAY 气泡文字位置）。

## 六、加一个导航分区（如"相册"）

复制 `views/_template.js` 重命名（如 `gallery.js`），改 `id`/`label`/`render`，在 index.html「分区模块引入区」加一行引入，导航自动出现新标签。

## 七、更新到 GitHub（日常三步）

在本目录（my-site）打开终端：

```
git add -A
git commit -m "一句话说明改了什么"
git push
```

推送后约 1~2 分钟线上自动更新（GitHub Pages 自动构建）。

**重要——缓存版本号规则**：改了 JS 文件或图片/视频后，如果访客反馈"看不到变化"，给 index.html 里对应 `<script>` 标签的 `?v=数字` 加一（如 `pet.js?v=15` → `?v=16`），让浏览器重新下载。site.js 里的头像/背景同理（`?v=` 写在 site.js 内部路径上）。

**口诀**：改了「已存在的文件」内容 → 升版本号；新增文件 → 不用（没人缓存过它）。注意 site.js 自己也有版本号（index.html 里 `site.js?v=N`），改它的内容同样要升。

### 实操举例

**例 A：改了桌宠台词（动了 plugins/pet.js）**
1. 改文件保存；2. index.html 里搜 `pet.js`，把 `?v=15` 改 `?v=16`；
3. 文件夹右键 → Open Git Bash here，执行：

```
git add -A
git commit -m "桌宠台词更新"
git push
```

**例 B：只改了 site.js 里的签名**
同样要在 index.html 里把 `site.js?v=6` 升成 `?v=7`（否则老访客最多延迟 10 分钟才看到），然后 git 三连。

**例 C：发新文章全流程**

```
cp content/posts/_template.js content/posts/2026-09-01-my-post.js   # 复制模板后用编辑器填内容
# index.html「内容库引入区」加一行 <script src="content/posts/2026-09-01-my-post.js"></script>（新文件不用 ?v=）
node tools/build-rss.js                                              # 更新 RSS
git add -A && git commit -m "新文章：标题" && git push
```

第一次自己 push 时会弹 GitHub 登录窗口，浏览器授权一次后 Windows 会记住，以后不再问。

## 八、留言板（giscus）维护

留言存在仓库的 **Discussions** 标签里，去仓库页面点 Discussions 即可置顶/回复/删除。配置在 site.js 的 `giscus` 段（更换仓库才需要动）。

## 九、常见问题

| 现象 | 处理 |
|---|---|
| 改了代码线上没变化 | 等 2 分钟构建；还不行检查 `?v=` 版本号有没有升 |
| 忘了跑 build-rss | 随时补跑 `node tools/build-rss.js` 再提交一次 |
| 文章打不开/串文章 | 多半是 `id` 重复或改了已发布的 `id` |
| 图片显示裂图 | 检查文件名大小写和文件夹位置（裸文件名必须与 js 同名文件夹对应） |
| 想看本地效果 | 在 my-site 目录执行 `python -m http.server 8642`，浏览器开 `http://localhost:8642` |
