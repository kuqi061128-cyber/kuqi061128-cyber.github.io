# 日常维护手册（改博客看这里）

> 部署相关（首次上线、域名）看 `DEPLOY.md`；各目录详细说明看 `content/README.md`、`plugins/README.md`、`views/README.md`。

## 〇、速查表：我想做 X，该动哪里

| 我想… | 要动的文件 | 还要做什么 |
|---|---|---|
| 发一篇新文章 | 复制 `content/posts/_template.js` 改名 | index.html 加引入行 → git 三连（RSS 推送后自动更新） |
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

## 二、发一篇新文章（完整四步）

1. **复制模板**：`content/posts/_template.js` → 重命名为 `日期-英文Slug.js`（如 `2026-09-01-my-post.js`）；
2. **填内容**：打开新文件，填写 `id`（没用过的数字，发布后永远不要改，文章链接靠它）、标题、日期（YYYY-MM-DD）、分类、标签、摘要、正文；
3. **挂引入**：index.html 搜 `content/posts/`，在最后一篇下面加一行：
   `<script src="content/posts/2026-09-01-my-post.js"></script>`
4. **git 三连**（见第九节）——推送后 GitHub Action 会自动重新生成 rss.xml，不用手动跑
   `node tools/build-rss.js`（本地想先看 RSS 效果时才需要手动跑一次）。

文章插图：建与 js 文件同名的文件夹（`content/posts/2026-09-01-my-post/`），图片放里面，正文写裸文件名 `<img src="1.png">` 即可。

### 举例：发一篇《九月小结》

新文件 `content/posts/2026-09-10-sept-notes.js` 的内容：

```js
registerPost({
  id: 6,                        // 现有用过 1~5，所以用 6
  title: "九月小结",
  date: "2026-09-10",
  category: "随笔",
  tags: ["随笔"],
  views: 0,
  summary: "九月做了什么、想了什么。",
  content: `
    <p>第一段正文……</p>
    <h3>小标题</h3>
    <p>更多内容……</p>
  `,
});
```

index.html「内容库引入区」最后加：`<script src="content/posts/2026-09-10-sept-notes.js"></script>`

然后终端：`node tools/build-rss.js` → git 三连。刷新首页，「最新文章」第一张就是它。

## 三、发新作品 / 更新作品版本

**新作品**：复制 `content/works/_template.js` 重命名（如 `02-my-app.js`），填内容（封面/详情图放同名文件夹），index.html 加引入行，git 三连。

**更新已有作品**（比如发新版安装包）：只改它自己那个文件——
- `file`：新包路径（≤100MB 填 `downloads/xxx.zip`；>100MB 填 Releases 链接，见下节）
- `version`：新版本号（如 `v1.8.0`）
- `size`：包大小（如 `150 MB`）
- `detail` 里的「更新日志」加一行新版本的说明
- index.html 里该作品的 `?v=` 加一
- git 三连

### 举例：DSH 应用从 v1.7.0 升到 v1.8.0，改哪些地方

打开 `content/works/01-dsh-desktop.js`，一共改四处（改前 → 改后）：

```
desc:  "…当前版本 v1.7.0。"            →  "…当前版本 v1.8.0。"
file:  "…/download/v1.7.0/DSH-v1.7.0.zip"  →  "…/download/v1.8.0/DSH-v1.8.0.zip"
version: "v1.7.0",                     →  "v1.8.0",
size:  "144 MB",                       →  "151 MB",
```

`detail` 的「更新日志」最后加一行：`<p>v1.8.0：新增了 xx 功能。</p>`

再到 index.html 把 `01-dsh-desktop.js?v=3` 改成 `?v=4`，git 三连。

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

### 举例：添加「硅基流动」（真实发生过）

新文件 `content/links/05-siliconflow.js`：

```js
registerSite({
  name: "硅基流动",
  url: "https://siliconflow.cn",
  desc: "国内直连的大模型 API 云服务，DeepSeek 等开箱即用。",
  tag: "AI",
  color: "#7c3aed",
});
```

index.html 引入区加：`<script src="content/links/05-siliconflow.js"></script>` → git 三连。

### 举例：删掉「哔哩哔哩」

① 删除文件 `content/links/03-bilibili.js`；
② index.html 里删掉 `<script src="content/links/03-bilibili.js"></script>` 这一行（**这步最容易忘**）；
③ git 三连。

## 六、管理插件（左右栏小工具）

插件一文件一插件，在 `plugins/` 目录：

- **新增**：复制 `plugins/_template.js` 写好 → index.html「插件库引入区」加一行（新文件不用 `?v=`）；
- **下线/上线**：改 `enabled: false / true`；
- **排序**：改 `order`（小靠前）；**换栏**：改 `column`（`left` / `right` / `float` 浮动）；
- **改代码**（如桌宠台词在 `plugins/pet.js` 顶部的 `TALK` 表）：改完在 index.html 升该文件 `?v=`。

### 举例：改桌宠台词（最常用）

`plugins/pet.js` 顶部找到 `TALK` 表，照格式加一行（数字是权重，越大越常出现）：

```js
const TALK = [
  ["摸摸我，给博客点个赞喵！", 3],
  ["今天也要元气满满喵～", 2],
  ["新台词放这里喵！", 2],      // ← 新加的
  ...
];
```

然后 index.html 里 `pet.js?v=15` → `?v=16` → git 三连。

### 举例：下线「标签云」

`plugins/tag-cloud.js` 里把 `enabled: true` 改成 `enabled: false` → git 三连（想恢复改回 true 即可）。

## 七、加一个导航分区（如"相册"）

复制 `views/_template.js` 重命名（如 `gallery.js`），改 `id` / `label` / `render`，index.html「分区模块引入区」加一行，导航自动出现新标签（地址 `#/gallery`）。

### 举例：加一个「朋友们」分区

新文件 `views/friends.js`（最简可用版）：

```js
(function () {
  const S = {
    id: "friends",      // 路由地址 #/friends
    label: "朋友们",     // 导航按钮文字
    order: 50,
    render(el) {
      el.innerHTML =
        '<div class="view-head"><h2 class="view-title">👫 朋友们</h2></div>' +
        '<div class="post-card"><h4>这里放朋友的主页链接</h4></div>';
    },
  };
  registerSection(S);
})();
```

index.html「分区模块引入区」加：`<script src="views/friends.js"></script>` → 刷新后导航多出「朋友们」。

## 八、留言板维护

留言板是**云端匿名留言墙**（views/board.dynamic.js）：访客填昵称直接留言，数据存 Strapi 的 Message 集合。
管理入口：https://kuqis.cloud/admin → Content Manager → **Message**（只删不改）。
防灌水：服务器 Nginx 已对写接口限流（/etc/nginx/conf.d/00-ratelimit.conf，按 IP 每分钟 10 次写入，超限返回 429）。

## 八点五、用户系统与投稿审核

访客可在「我的」页注册登录（views/account.js），登录后可投稿作品。

**日常审核流程**：
1. https://kuqis.cloud/admin → Content Manager → **Work**
2. 右上筛选器把「发布状态」切成 **草稿** —— 这里全是待审投稿
3. 看内容没问题 → 打开条目点右上 **Publish** 发布；垃圾内容直接删除
4. 用户在「我的 → 我的投稿」能看到自己稿子的状态（待审核/已发布）

**安全机制**（都是自动的，别手动改坏）：
- 用户投稿强制进草稿，无法自行发布（后端 /api/works/submit + 生命周期双保险）
- 通用创建接口已对登录用户关闭，只剩专用投稿路由
- 注册/登录/投稿都走 Nginx 写接口限流（每分钟约10次/IP）
- 权限由服务器 src/index.js 启动钩子自动授予（Authenticated：读全部+投稿+留言点赞；Public：只读+留言点赞）

**已知测试残留**：后台 Users 里可能有 e2etest20260825、visitor802863 两个测试账号，可直接删除。

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

### 举例：一次完整的操作过程（终端里长这样）

```
$ git add -A
$ git commit -m "新文章：九月小结"
[main 9abc123] 新文章：九月小结
 3 files changed, 25 insertions(+)
$ git push
Enumerating objects: ...
To https://github.com/kuqi061128-cyber/kuqi061128-cyber.github.io.git
   08a23f5..9abc123  main -> main        ← 看到这行 = 成功
```

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
| push 报 `Could not connect to github.com` | github.com 被网络污染（api 通道通常还通）。应急：`python tools/api-push.py ghp_你的令牌` 走 API 通道推；恢复后跑一次 `git pull --rebase && git push` 归位 |
| push/pull 报 `401 Bad credentials` | 令牌过期或被撤销：GitHub → Settings → Developer settings → Personal access tokens 重新生成一个，用新令牌操作 |
| 文章打不开/内容串了 | `id` 重复，或改了已发布的 `id` |
| 图片裂图 | 检查文件名大小写、图片是否在与 js 同名的文件夹里 |
| 上传超 100MB 失败 | 走 Releases（见第四节） |
| 想先看本地效果 | my-site 目录执行 `python -m http.server 8642` → 浏览器开 `http://localhost:8642` |
| RSS 没更新 | 正常会由 GitHub Action 自动更新；去仓库 Actions 页看是否跑失败，或本地补跑 `node tools/build-rss.js` 再 git 三连 |
