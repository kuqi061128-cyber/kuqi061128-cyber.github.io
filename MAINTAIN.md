# 日常维护手册（改博客看这里）

> 部署相关（首次上线、域名）看 `DEPLOY.md`；各目录详细说明看 `content/README.md`、`plugins/README.md`、`views/README.md`。

## 〇、速查表：我想做 X，该动哪里

| 我想… | 要动的文件 | 还要做什么 |
|---|---|---|
| 发一篇新文章 | 复制 `content/posts/_template.js` 改名 | ① index.html 加引入行 ② `node tools/build-rss.js` ③ git 三连 |
| 发一个新作品 | 复制 `content/works/_template.js` 改名 | index.html 加引入行 → git 三连 |
| 给作品换新安装包（≤100MB） | 作品 js 里的 `file` | 包放 `downloads/` → git 三连 |
| 给作品换新安装包（>100MB） | 作品 js 里的 `file`/`version`/`size` | **先走 Releases 上传**（见四）→ git 三连 |
| 加一个推荐网站 | 复制 `content/links/_template.js` | index.html 加引入行 → git 三连 |
| 删一个推荐网站 | 删 `content/links/` 对应文件 | **index.html 删对应引入行** → git 三连 |
| 改博客名/签名/头像/背景 | `site.js` | index.html 里 `site.js?v=N` 加一 → git 三连 |
| 改桌宠台词/素材/插件代码 | `plugins/对应文件` | index.html 里该文件 `?v=N` 加一 → git 三连 |
| 下线/上线一个插件 | 插件文件里 `enabled` | 直接 git 三连（不用升版本） |
| 改留言板/评论区 | 基本不用改代码 | 去仓库 Discussions 页面管理评论 |
| 改完任何东西 | — | **最后一定是 git 三连**（见九），否则线上不变 |

## 一、改站点信息 → 只动 site.js

博客名、签名、头像、背景图/视频、压暗程度、页脚、站点简介全部在 **site.js** 里，每项都有中文注释。

注意：site.js 自己也有版本号。改完内容要去 index.html 把 `site.js?v=6` 的数字加一（如 → `?v=7`），否则老访客最多延迟 10 分钟才看到。

## 二、发一篇新文章（完整五步）

1. **复制模板**：`content/posts/_template.js` → 重命名为 `日期-英文Slug.js`（如 `2026-09-01-my-post.js`）；
2. **填内容**：打开新文件，填写 `id`（没用过的数字，发布后永远不要改，文章链接靠它）、标题、日期（YYYY-MM-DD）、分类、标签、摘要、正文；
3. **挂引入**：index.html 搜 `content/posts/`，在最后一篇下面加一行：
   `<script src="content/posts/2026-09-01-my-post.js"></script>`
4. **更新 RSS**：终端执行 `node tools/build-rss.js`；
5. **git 三连**（见第九节）。

文章插图：建与 js 文件同名的文件夹（`content/posts/2026-09-01-my-post/`），图片放里面，正文写裸文件名 `<img src="1.png">` 即可。

## 三、发新作品 / 更新作品版本

**新作品**：复制 `content/works/_template.js` 重命名（如 `02-my-app.js`），填内容（封面/详情图放同名文件夹），index.html 加引入行，git 三连。

**更新已有作品**（比如发新版安装包）：只改它自己那个文件——
- `file`：新包路径（≤100MB 填 `downloads/xxx.zip`；>100MB 填 Releases 链接，见下节）
- `version`：新版本号（如 `v1.8.0`）
- `size`：包大小（如 `150 MB`）
- `detail` 里的「更新日志」加一行新版本的说明
- index.html 里该作品的 `?v=` 加一
- git 三连

## 四、大文件上传（>100MB 必看，走 GitHub Releases）

git 单文件上限 100MB，安装包超了会被拒收（`downloads/*.zip` 已在 .gitignore 里排除，不会误提交）。以网页操作为例（发 v1.8.0 时照抄，把版本号换掉即可）：

1. 打开仓库页面 → **Releases** → **Draft a new release**；
2. **Choose a tag**：输入新 tag（如 `v1.8.0`）→ 点 "Create new tag"；
3. 标题写版本号，正文写更新日志；
4. 把 zip 包**拖进附件区**，等上传完成（大文件要几分钟）；
5. **Publish release** 发布；
6. 进入刚发布的 release 页面，**右键附件文件名 → 复制链接**（形如 `https://github.com/用户名/仓库名/releases/download/v1.8.0/xxx.zip`）；
7. 把链接填进作品 js 的 `file` 字段，按第三节更新 `version`/`size`/更新日志，git 三连。

## 五、管理推荐网站（"网站推荐"页）

一个站一个文件，在 `content/links/` 目录：

- **加站**：复制 `_template.js` 重命名（如 `07-example.js`），填 `name / url / desc / tag / color`（配色别和现有重复），index.html「内容库引入区」加对应引入行；
- **删站**：删文件 + **必须同时删 index.html 里对应那行 `<script>`**（否则控制台报 404）；
- **改站**：直接改它自己的文件，并在 index.html 里给它加/升 `?v=`。

## 六、管理插件（左右栏小工具）

插件一文件一插件，在 `plugins/` 目录：

- **新增**：复制 `plugins/_template.js` 写好 → index.html「插件库引入区」加一行（新文件不用 `?v=`）；
- **下线/上线**：改 `enabled: false / true`；
- **排序**：改 `order`（小靠前）；**换栏**：改 `column`（`left` / `right` / `float` 浮动）；
- **改代码**（如桌宠台词在 `plugins/pet.js` 顶部的 `TALK` 表）：改完在 index.html 升该文件 `?v=`。

## 七、加一个导航分区（如"相册"）

复制 `views/_template.js` 重命名（如 `gallery.js`），改 `id` / `label` / `render`，index.html「分区模块引入区」加一行，导航自动出现新标签（地址 `#/gallery`）。

## 八、留言板（giscus）维护

评论存在仓库的 **Discussions** 标签：仓库页面 → Discussions → 对应帖子，可置顶/回复/删除。giscus 配置在 site.js 的 `giscus` 段（一般不用动）。

## 九、更新到 GitHub（git 三连详解）

**在哪敲命令**：my-site 文件夹里**右键 → Open Git Bash here**（或打开终端后 `cd C:\Users\wishdream\Desktop\DSH\my-site`）。

```
git add -A                    # 第1步：收集所有改动（新增/修改/删除的文件全算上）
git commit -m "一句话说明"     # 第2步：打包成一次提交，说明写改了什么（中文随意）
git push                      # 第3步：推送到 GitHub，1~2 分钟后线上自动更新
```

**怎么确认成功**：
- push 后最后一行输出类似 `main -> main` 即成功；
- 打开仓库网页（github.com/kuqi061128-cyber/kuqi061128-cyber.github.io），首页最新 commit 是你刚才那句说明；
- 等 1~2 分钟刷新 kuqis.cloud 看效果。

**常见情况**：
- 第一次自己 push 会弹 GitHub 登录窗口，浏览器授权一次后 Windows 记住，以后不再问；
- push 报错带 `rejected` / `fetch first`：说明云端有你本地没有的提交（在别的电脑改过之类），先 `git pull --rebase` 再 `git push`；
- 改完忘了 git 三连 → 线上永远不变，这是"没生效"的最常见原因。

## 十、缓存版本号 ?v= 规则（"看不到变化"的解法）

**口诀：改了「已存在的文件」内容 → index.html 里对应 `<script>` 的 `?v=` 数字加一；新增文件 → 不用。**

- **例 A**：改了 `plugins/pet.js`（换台词）→ index.html 搜 `pet.js` → `?v=15` 改 `?v=16` → git 三连；
- **例 B**：改了 `site.js`（换签名）→ index.html 里 `site.js?v=6` 改 `?v=7` → git 三连；
- **例 C**：发了新文章 → 新文件不用 `?v=`，但记得 `node tools/build-rss.js` 更新 RSS。

## 十一、常见问题

| 现象 | 处理 |
|---|---|
| 改了代码线上没变化 | ① git 三连做了吗 ② 等 2 分钟 ③ `?v=` 升了吗 |
| push 被拒 / rejected | `git pull --rebase` 后再 push |
| 文章打不开/内容串了 | `id` 重复，或改了已发布的 `id` |
| 图片裂图 | 检查文件名大小写、图片是否在与 js 同名的文件夹里 |
| 上传超 100MB 失败 | 走 Releases（见第四节） |
| 想先看本地效果 | my-site 目录执行 `python -m http.server 8642` → 浏览器开 `http://localhost:8642` |
| 忘了跑 build-rss | 随时补跑 `node tools/build-rss.js` 再 git 三连 |
