# 日常维护手册（改博客看这里）

> ⚠️ **先读这条（2026-08 动态化改造后）**：
> 网站**正式运行在自己的服务器上**（47.97.125.235 · Nginx 托管静态页 + Strapi 提供接口）。
> **GitHub 仓库只是源码备份**——`git push` 之后线上**不会**自动变化！
> 把改动更新到线上的唯一方式是 **scp 上传**（见第五节）。
>
> 日常发文请走**管理后台**（第二节），本仓库 `content/` 目录现在是**兜底数据源**
> （仅当 Strapi 挂掉时网站才会显示它），平时不用动。

## 〇、速查表：我想做 X，该去哪里

| 我想… | 去哪里 | 说明 |
|---|---|---|
| 发一篇新文章 | 后台 Content Manager → Post | 发布即上线，无需碰任何文件 |
| 发一个新作品 | 后台 Content Manager → Work | 同上 |
| 审核访客投稿 | 后台 → Work / Post，筛选「草稿」 | 见第三节 |
| 管理/删除注册用户 | 后台 → Settings → User & Permissions Plugin → Users | 见第四节 |
| 改留言板内容 | 后台 → Message | 只删不改。额度制见第八节 |
| 管理自己的评论/留言 | 前台「我的」页 → 💬 我的评论面板 | 管自己的；管别人的去后台删。见第八节 |
| 删除违规文章/作品评论区内容 | 评论无后台界面（存 Comment 集合）| SSH 或让 AI 用脚本删；见第八节 |
| **改导航栏 Logo 文字** | `site.js` 的 `name` → scp 两文件 → 升版本号 | **见 6.2 实例** |
| 改博客名/签名/头像/背景 | 本地 `site.js` → scp 上传 → `?v=` 升级 | 见第六节（各字段控制哪里看 6.1） |
| 手改 index.html 前后 | 过一遍安全清单 | 见 6.3 |
| 改插件/样式/功能代码 | 本地对应文件 → scp 上传 → `?v=` 升级 | 见第五、六节 |
| 源码备份 | git 三连（GitHub） | 见第九节 |
| 看文章按年月归档 | 导航「归档」`#/archive` | 自动按日期分组，无需维护 |
| 文章里放代码 | 正文写 `<pre><code>` | 自动加复制按钮+高亮；标注语言可写 `<code class="language-js">` |
| 手机装成 App / 离线 | 浏览器「添加到主屏幕」 | PWA 已启用，见第十一节 |
| 让文章被搜索引擎收录 | 不用手动做 | 服务器每天 04:40 自动生成 `/p/<id>.html`，见第十一节 |
| 回复别人的评论 | 评论区每条下面的「回复」 | 支持一层缩进展示，见 12.1 |
| 给文章加封面图 | 后台 Post 编辑页 → cover 字段传图 | 列表自动变左图右文，见 12.2 |
| 看访问量 / 7 天趋势 | 不用管 | 右栏「站点统计」自建统计，见 12.3 |
| 改后端（Strapi）功能 | 改 schema/控制器 → scp → `pm2 restart strapi` | 见第十二节 |

## 一、网站现在是怎么工作的（30 秒版）

```
访客浏览器
   │  https://kuqis.cloud
   ▼
Nginx（你的服务器 47.97.125.235）
   ├─ 静态文件 ← /var/www/my-site/          （页面骨架/插件/样式）
   └─ /api/* /admin → 反代 Strapi(:1337)     （文章/作品/留言/用户数据）
                     └─ MySQL 数据库

内容加载策略（js/api-loader.js）：
   优先拉 Strapi 接口 → 成功：显示后台内容
                      → 失败：自动回退本地 content/*.js 兜底，网站永远打得开
```

所以：**后台发的内容 = 正式内容**；`content/` 里的旧文章只在后端故障时才会被访客看到。

## 二、日常发文（后台操作，约 3 分钟）

1. 浏览器打开 https://kuqis.cloud/admin 登录；
2. Content Manager → **Post**（文章）或 **Work**（作品）→ 右上 *Create new entry*；
3. 字段照提示填写：
   - 文章：title / date(YYYY-MM-DD) / category / tags(JSON 数组如 `["随笔"]`) / summary / contentHtml（正文直接写 HTML）；
   - 作品：title / desc / tag / version / size / file(下载链接 http 开头) / detail；
   - 配图：Media Library 先传图，复制 `/uploads/xxx.png` 地址贴进正文 `<img>` 标签；
4. 右上 **Publish**（发布）→ 打开首页刷新即见。
5. 发完文章顺手确认 rss.xml 已更新：服务器每天 04:17 自动从数据库重新生成，
   急着要就 SSH 手动跑一次 `node /opt/my-site/tools/update-rss.mjs`。

> 💡 后台创建的内容**立即发布**不受投稿审核影响；只有用户从前台投稿的才进草稿队列。

## 三、审核访客投稿（作品 + 文章）

用户在「我的」页投稿后会进入**草稿**队列等你把关：

1. 后台 → Content Manager → **Work**（作品）或 **Post**（文章）；
2. 右上筛选器把「发布状态」切成 **草稿** —— 待审投稿全在这；
3. 内容 OK → 打开条目点右上 **Publish** 发布；垃圾内容直接删除；
4. 投稿人在「我的 → 我的投稿」能看到自己稿子的状态（待审核/已发布）；
5. 用户投稿的作品/文章详情页会自动显示「👤 投稿账号名」（authorName 字段）；
   你自己后台发的不带作者行。

**安全机制**（自动的，别手动破坏）：
- 投稿接口强制 `status:'draft'`，登录用户无法自行发布；
- 通用创建接口对登录用户关闭（路由只留只读 + submit/mine 专用路由）；
- 注册/登录/投稿都过 Nginx 写限流（每分钟约 10 次/IP，超限 429）；
- **投稿正文渲染前会过前端白名单过滤器 `sanitizeHtml`（在 index.html，2026-09-10 上线）**：
  `<script>/<iframe>/表单` 等标签、`on*` 事件属性、`javascript:` 链接一律剥除。
  站长自己发布的正文也同样过一遍——所以写正文时别用表单/脚本类标签（会被剥掉），
  排版用 `<p> <h3> <img> <a> <table> <blockquote> 等正常标签不受影响；
- 权限由服务器 `src/index.js` 启动钩子自动授予/回收，改权限改那个文件。

## 四、用户管理（注册账号在哪、封禁开关在哪）

- 入口：后台 → 左下角 **Settings ⚙️ → User & Permissions Plugin → Users**。
  **Content Manager 里看不到用户，别在那找。**
- 删除测试/垃圾账号：列表勾选删除即可；
- ⚠️ 用户编辑页的 **Blocked** 开关 = 封禁，打开后对方无法登录。
  「喵拉喵丘无法登录」事故就是它被误开导致的——平时不要碰；
- 目前还没有「忘记密码」邮件找回（未配 SMTP）。用户密码忘了只能请站长在
  Users 编辑页直接设置新密码。
- 登录后用户可在「我的」页 **🔑 修改密码**（旧密码 + 新密码×2，走 /api/auth/change-password）。

## 四点五、留言板额度制 + 文章/作品评论区

### 留言板（views/board.dynamic.js）—— 额度制

| 身份 | 额度 | 计数依据 |
|---|---|---|
| 游客 | 每 IP 仅 **1** 条 | 服务端读 X-Real-Ip（Nginx 覆写的真实地址，伪造头无效） |
| 注册登录 | 每账号 **3** 条 | 按 uid 计数 |

- 发留言统一走 `POST /api/messages/send`（服务端校验额度）；旧的匿名直发接口已对公众关闭；
- 登录用户可在「我的 → 💬 我的评论」删除旧留言腾额度；
- 额度数值改在服务器 `src/api/message/controllers/message.js` 顶部的
  `GUEST_LIMIT / USER_LIMIT`，改完 `pm2 restart strapi`。

### 文章/作品评论区（views/comments.js）

- 每篇文章、每个作品详情页底部有**独立评论区**，互不串台；
- 数据存 Strapi 的 **Comment** 集合：targetType(post/work) + targetId 定位归属，
  uid 绑定发表人；**游客可看不可评**；
- 接口：`GET /api/comments/list` 公开读；`submit` / `remove` / `mine` 登录专用。

### 我的评论管理（登录用户）

「我的」页底部面板聚合三处发言（文章评论/作品评论/留言板），每条标注所在位置，
带删除按钮（服务端校验"只能删自己的"）。

### 清理违规内容

- 留言：后台 Content Manager → Message 删除；
- 评论区内容后台暂无界面（Comment 未接入 Content Manager）：SSH 让 AI 按条件删最快；
  长期可把 Comment 接入后台（找 AI 改 schema 配置）。

## 五、把改动更新到线上（scp 上传，必看）

本地 `my-site/` 改完代码后，按需上传到服务器同路径：

```powershell
# 单文件示例：上传改过的插件并升级版本号
scp my-site/plugins/pet.js root@47.97.125.235:/var/www/my-site/plugins/pet.js
scp my-site/index.html root@47.97.125.235:/var/www/my-site/index.html
```

常用目标路径对照：

| 本地 | 服务器 |
|---|---|
| index.html / site.js | /var/www/my-site/ |
| js/*.js、plugins/*.js | /var/www/my-site/js/ 、 /plugins/ |
| views/*.js | /var/www/my-site/views/ |
| content/**（兜底内容） | /var/www/my-site/content/ |

上传完记得做两件事：
1. **index.html 里对应文件的 `?v=N` 数字加一**（静态资源现在有 30 天浏览器长缓存，
   不升版本号老访客 30 天内都看不到新文件！见第七节）；
2. 上传新的 index.html（它本身不缓存，即时生效）。

改完最后 git 三连做源码备份（第九节）——push 不影响线上，纯粹防丢。

## 六、改站点信息 / 插件 / 分区（代码层）

- **站点信息**：`site.js`（名字/签名/头像/背景/页脚）→ 上传 + `site.js?v=` 升级；
- **插件**：`plugins/` 一文件一插件。下线改 `enabled:false`；台词等改完升 `?v=`
  （如 `pet.js?v=15 → v16`）；点赞/统计/留言板已是云端版（`*.dynamic.js`）；
- **分区**：`views/` 一文件一分区（account=我的 / board.dynamic=留言墙 / about / links）；
- **兜底文章**：想新增"后端挂了也能看"的文章，复制 `content/posts/_template.js`
  并在 index.html「内容库引入区」加引入行，**同时**把它追加进 `js/api-loader.js`
  的 LOCAL_FILES 清单（两处都要，否则回退时不加载）。

### 6.1 各配置项控制哪里（2026-08 改版后）

| site.js 字段 | 显示位置 |
|---|---|
| `name` | ①导航栏 Logo（**只显示这个名字，无任何后缀**）②浏览器标签页标题 ③分享卡片标题 —— **这是"站名"，别填人名** |
| `ownerName` | **作者/站长称呼**：首页「你好，我是 …」、关于页大名字、头像占位符。留空自动回退站名。**个人向位置都读它** |
| `tagline` | 仅首页横幅「你好，我是…」下方的一行小字（导航栏已不显示它） |
| `intro` | 首页横幅简介段落 |
| `footer` | 页脚一行字 |
| `description` | 搜索引擎/分享卡片的描述文字 |

> 为什么拆成两个字段：站名和作者名是两回事——站名叫「Kuqi's Web」，但自我介绍里应该自称「Kuqi」。
> 个人向位置（问候语/关于页）读 `ownerName`；品牌向位置（Logo/标题）读 `name`。

> 导航栏 Logo 的渲染代码在 index.html 里，就一行：
> `document.getElementById("logo").textContent = SITE.name;`
> ——只输出 name 本身。想加后缀/图标才需要动这行（改完记得升 index.html 里 site.js 的 ?v=）。

### 6.2 实例：手动改导航栏 Logo 文字（照抄即可）

假设想把「Kuqi's Web」改成别的名字：

1. 打开 `site.js`，改第一项：
   ```js
   name: "新名字",
   ```
   （名字里有英文单引号也没关系，代码会自动转义）
2. 打开 `index.html`，搜 `site.js?v=`，把数字加一：
   ```html
   <script src="site.js?v=11"></script>   →   <script src="site.js?v=12"></script>
   ```
3. 上传两个文件：
   ```powershell
   scp C:\Users\wishdream\Desktop\DSH\my-site\site.js root@47.97.125.235:/var/www/my-site/site.js
   scp C:\Users\wishdream\Desktop\DSH\my-site\index.html root@47.97.125.235:/var/www/my-site/index.html
   ```
4. 刷新网站（手机端强制刷新），导航栏即显示新名字；标签页标题同步变。

### 6.3 手改 index.html 前后的安全清单（血泪教训）

index.html 是整站的"壳"，一处手误全站变形。编辑前后过一遍：

**改完后必须确认的 4 件事**：
- [ ] 第一行是完整的 `<!DOCTYPE html>`（开头一个字符都不能少——曾因丢了 `<` 全站错乱）
- [ ] 没有在 CSS 行里多敲字符（如 `;--`、孤立的数字）；改完样式刷新看效果是否生效
- [ ] 变量名拼写完整：如 `var(--text)` 不是 `var(--tet)`；字体声明里没有多余前缀
- [ ] 用浏览器打开本地文件先看一眼，正常再上传

**上传前最后一步（可选但推荐）**：
```powershell
node tools-test\verify-live.js    # 部署后自动检查首行/标题/字体等关键点
```

### 6.4 相关联动点备忘

- 改 `name` 后自动同步的：标签页标题、分享卡片 og:title（都在 index.html 由 JS 动态写入，无需手改静态 meta）；
- 静态 `<head>` 里的 `<title>` 和 og 标签只是"爬虫兜底值"，最好顺手一起改保持一致；
- RSS 里的标题在服务器脚本 `/opt/my-site/tools/update-rss.mjs` 顶部的 TITLE 常量里（每天 04:17 自动生成）。

## 七、缓存与版本号 ?v= 规则（重要性↑↑）

动态化后 Nginx 对静态资源启用了 **30 天长缓存**（js/css/图片/音视频）：

- **index.html、rss.xml、sitemap.xml、接口**：不缓存，永远最新；
- **其他静态文件**：缓存 30 天 ⇒ **改已存在的文件必须升它的 `?v=`，否则老访客看不到**；
- 新增文件不需要 `?v=`。

口诀不变：「改旧文件 → 升版本号」，但现在忘了升的后果是 **30 天**不可见（以前只有几分钟）。

## 八、大文件上传（>100MB 走 GitHub Releases）

安装包超过 GitHub 单文件上限，放 Releases 托管：
1. 仓库页 → Releases → Draft a new release → 建 tag（如 `v1.8.0`）→ 拖入 zip → Publish；
2. 复制附件直链（形如 `https://github.com/.../releases/download/v1.8.0/xxx.zip`）；
3. 填进后台 Work 的 file 字段（或本地兜底作品的 file 字段）。

## 九、源码备份：git 三连 + 应急推送

```bash
git add -A
git commit -m "一句话说明"
git push
```

- push 成功 ≠ 线上更新（线上靠 scp，见第五节）；这一步只为源码不丢；
- **github.com 直连被污染时**（报 Could not connect / Connection reset）走应急通道：
  ```powershell
  $env:GH_TOKEN="ghp_你的令牌"; python tools/api-push.py
  ```
  - 走 api.github.com 的 API 合成提交（Python 通道通常可达）；
  - 多个未推送提交会一次推完；含图片等二进制也没问题；
  - 若曾用 DIFF_BASE 场景推过（历史分叉），网络恢复后执行
    `git pull --rebase && git push` 归位；
  - 令牌在 github.com/settings/tokens 生成（勾 repo 权限），**用完撤销**。

## 十、数据备份与恢复（2026-09 起已自动化）

**现状**：服务器每天凌晨 3:10 自动备份（cron 已装好，勿动）：
- 数据库全量：`/root/backups/db_YYYY-MM-DD.sql.gz`（保留 14 天）
- 媒体库上传文件：`/root/backups/uploads_YYYY-MM-DD.tar.gz`（保留 14 天）
- 脚本：`/opt/my-site/tools/backup-db.sh`，日志：`/var/log/backup-db.log`

**异地副本**：每周一上午 9:30 由 WorkBuddy 定时任务自动把服务器上最新一份拉到本地
`C:\Users\wishdream\Desktop\DSH\服务器备份\`（本地保留 4 份）。
这样即使服务器整台出事，数据也不会全丢。

**2026-09-10 已做恢复演练**：最新备份可完整恢复（47 张表、文章数据齐全）。

### 手动恢复方法（照抄即可，SSH 到服务器后）

```bash
# 1. 用某天的备份恢复数据库（会覆盖 strapi_db 现有数据！）
gunzip -c /root/backups/db_2026-09-10.sql.gz | mysql strapi_db
# 2. 恢复媒体库上传文件（解压回原路径）
tar xzf /root/backups/uploads_2026-09-10.tar.gz -C /
# 3. 重启 Strapi
pm2 restart strapi
```

> 恢复会**覆盖**现有数据，拿不准先问 AI。想先验证备份好不好使，
> 恢复到临时库试试：`mysql -e "CREATE DATABASE restore_test"`，把第 1 步的
> `strapi_db` 换成 `restore_test`，测完 `mysql -e "DROP DATABASE restore_test"`。

### 手动备份一次（做危险操作前建议先跑）

```bash
/bin/bash /opt/my-site/tools/backup-db.sh
```

## 十一、前端功能地图（2026-09-13 新增）

本轮给前端加了一批阅读体验与可发现性功能，都**不需要日常维护**，这里只讲"坏了去哪看"和"改动的坑"。

### 新增了什么

| 功能 | 文件 | 说明 |
|---|---|---|
| 文章目录 TOC + 阅读时长 | index.html（`buildToc` / `readingMinutes`） | 标题 ≥3 个才显示；点击平滑滚动，不会污染 `#/post/x` 路由 |
| 图片灯箱 | index.html（`openLightbox`） | 点正文图片放大，多图可 ← → 切换，Esc/点背景关闭 |
| 返回列表保留滚动位置 | index.html（`route()` 里 `lastListScroll`） | 从详情返回同一个列表才恢复，切换筛选/换页仍回顶部 |
| 分类统计可点击 | plugins/categories.js（**v2**） | 点分类名跳 `#/articles/tag/分类` |
| 404 兜底页 | index.html（`renderNotFound`） | 未匹配的 `#/xxx` 显示友好提示，不再静默回首页 |
| 上/下一篇 + 相关文章 | index.html（`relatedPosts`） | 相关度=标签重合×2 + 同分类×1，取前 3 |
| 代码块复制 + 轻量高亮 | index.html（`enhanceCodeBlocks`） | 先转义再着色；语言提示写在 `<code class="language-js">` 效果最好 |
| 列表分页 | index.html（每页 10 篇 + 加载更多） | 文章多了也不会一次渲染全部 |
| 归档页 | views/archive.js（**新文件**） | 分区 id `archive`，导航自动出现 |
| 正文搜索 + 命中高亮 | index.html（`ensureTextIndex` / `hilite`） | 索引首次搜索时才建，首屏无额外开销 |
| 分享 + RSS 入口 | index.html（`shareBar`）、页脚、views/about.js | 分享地址指向 SEO 骨架页 |
| PWA 可安装 + 离线 | manifest.webmanifest、sw.js、assets/img/icon-256.png、icon.svg | 手机可"添加到主屏幕"，弱网可读缓存页 |
| SEO 骨架页 | tools/build-seo-pages.mjs | 每篇文章生成 `/p/<id>.html`，含 OG 标签与 JSON-LD |

### 三个必须记住的坑

1. **`sw.js` 必须免缓存**：Nginx 已加 `location = /sw.js { no-store }`。
   它不在这条规则里的话，Service Worker 会永远不更新。**改 `sw.js` 内容后，把里面的 `VERSION` 数字 +1**（第 12 行附近），旧缓存会自动清掉。
2. **PWA 出问题怎么回滚**：删掉服务器上的 `/var/www/my-site/sw.js`，让访客强刷一次即可（注册失效后浏览器会自动注销）。
   插件系统的任何改动都不影响它，SW 只缓存外壳，不缓存接口。
3. **新增文件不需要升 `?v=`，改已有文件必须升**——本轮 `categories.js` 升到 v2、`about.js` 升到 v4，就是这个原因。

### SEO 骨架页（搜索引擎收录用）

- 生成脚本：`/opt/my-site/tools/build-seo-pages.mjs`；
- 定时：crontab 每天 **04:40**（排在 04:17 的 RSS 之后），日志 `/var/log/build-seo-pages.log`；
- 产出：`/var/www/my-site/p/<id>.html` + 重新生成 `sitemap.xml`；
- **发完文章想要立刻被收录**：SSH 手动跑一次
  ```bash
  /usr/bin/node /opt/my-site/tools/build-seo-pages.mjs
  ```
- 特性：接口不通时直接退出、不动任何文件；文章删了重跑会自动清理对应骨架页。
- 访问 `https://kuqis.cloud/p/4.html` 会看到文章信息并**自动跳转**到 `#/post/4`。

## 十二、后端功能：评论回复 / 文章封面 / 自建统计（2026-09-13 新增）

这三项动了 Strapi 的数据结构，都在后端 `/opt/my-site/backend/` 里完成的。
**改后端源码的通用流程**：改文件 → `scp` 上传 → `pm2 restart strapi`
（Strapi 启动时会自动把 schema 变更同步到 MySQL，无需手工建表）。
本次改动前的原文件备份在服务器 `/root/backend-bak-2026-09-13/`，本地留档在 `DSH/backend-改动/`。

### 12.1 评论二级回复

- **数据**：`Comment` 集合新增 `parentId`（0 = 顶级评论）。数据层支持任意层级，**前端统一压成一层缩进**显示（类似微博/知乎）；
- **发表**：评论区每条评论旁有「回复」按钮 → 输入框提示"正在回复 @某人" → 提交时带 `parentId`；点「取消」可退回发顶级评论；
- **删除**：删除自己的评论时，会**连带删除其下的整棵回复树**（服务端递归，不会留孤儿回复）；
- **校验**：服务端会拒绝"回复不存在的评论"和"跨内容回复"（可回复的评论必须在同一条文章/作品下）；
- **维护**：违规评论仍在后台看不到（Comment 未接入 Content Manager），走 SSH/AI 删。

### 12.2 文章封面图

- **后台**：Content Manager → Post 编辑页新增 **cover** 媒体字段，从 Media Library 传图或选图即可；
- **效果**：设了封面的文章，在文章列表/首页自动变成「左图右文」卡片（96×96 缩略图，移动端 76×76）；没设封面的保持原来的纯文字版式；
- **兜底**：`content/posts/*.js` 里的兜底文章也可以在文件里加 `cover: "图片地址"`；
- **接口**：`js/api-loader.js` 的文章查询已加 `populate[cover][fields][0]=url`（媒体字段需显式展开，别删这段）。

### 12.3 自建访问统计（已替换第三方不蒜子）

- **数据**：新增 `visit` 集合，按天聚合 `{date, count}`，**不记录 IP/UA**（省空间也无隐私问题）；
- **接口**：`POST /api/visits/hit`（打点，+1）、`GET /api/visits/summary`（总访问量/今日/最近 7 天）；两个都是公开接口，写接口受 Nginx 限流保护；
- **前端**：右栏「站点统计」显示 总访问量 / 今日访问 + 最近 7 天柱状图；**每次页面加载打点一次**（SPA 重绘不会重复计数）；
- **好处**：数据完全自持，不再依赖 `busuanzi.ibruce.info`；想加"累计访客"等指标改 `plugins/site-stats.dynamic.js` 即可；
- **手动修正数据**（比如清掉测试数据）：
  ```bash
  mysql strapi_db -e "UPDATE visits SET count=0 WHERE date='2026-09-13'"
  ```

## 十三、常见问题

| 现象 | 处理 |
|---|---|
| 点「登录」毫无反应 | 手机/浏览器还在跑旧脚本：强制刷新（Ctrl+F5 / 清站点缓存）。历史原因是隐藏必填框拦截校验，v5 已修复 |
| 登录报「账号被管理员封禁」 | 后台 Users 里找到该账号，编辑页把 **Blocked** 关掉 |
| 登录报「操作太频繁」 | 触发了写接口限流，等一分钟再试 |
| 访客说投稿不见了 | 大概率还在草稿待审（正常），后台筛「草稿」处理 |
| 改了代码线上没变化 | ① scp 了吗（push 不算！）② `?v=` 升了吗 ③ 强刷 |
| 首页能开但文章/作品是旧的几篇 | Strapi 挂了，网站正在用本地兜底内容。SSH 看 `pm2 status`，重启 strapi |
| 接口报 429 | 限流触发，一分钟自动恢复；频繁误伤可调 conf.d/00-ratelimit.conf 的 rate |
| push 被拒 / rejected | `git pull --rebase` 后再 push |
| push 连不上 github.com | 应急推送见第九节 |
| 图片裂图 | 检查大小写、图片是否在与 js 同名文件夹 |
| RSS 没更新 | 服务器每日 04:17 自动生成；手动：`node /opt/my-site/tools/update-rss.mjs` |
| 想先看本地效果 | my-site 目录用静态服务器打开即可（接口失败自动走兜底数据） |
