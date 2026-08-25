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
| 改留言板内容 | 后台 → Message | 只删不改 |
| **改导航栏 Logo 文字** | `site.js` 的 `name` → scp 两文件 → 升版本号 | **见 6.2 实例** |
| 改博客名/签名/头像/背景 | 本地 `site.js` → scp 上传 → `?v=` 升级 | 见第六节（各字段控制哪里看 6.1） |
| 手改 index.html 前后 | 过一遍安全清单 | 见 6.3 |
| 改插件/样式/功能代码 | 本地对应文件 → scp 上传 → `?v=` 升级 | 见第五、六节 |
| 源码备份 | git 三连（GitHub） | 见第九节 |

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
- 权限由服务器 `src/index.js` 启动钩子自动授予/回收，改权限改那个文件。

## 四、用户管理（注册账号在哪、封禁开关在哪）

- 入口：后台 → 左下角 **Settings ⚙️ → User & Permissions Plugin → Users**。
  **Content Manager 里看不到用户，别在那找。**
- 删除测试/垃圾账号：列表勾选删除即可；
- ⚠️ 用户编辑页的 **Blocked** 开关 = 封禁，打开后对方无法登录。
  「喵拉喵丘无法登录」事故就是它被误开导致的——平时不要碰；
- 目前还没有「忘记密码」邮件找回（未配 SMTP）。用户密码忘了只能请站长在
  Users 编辑页直接设置新密码。

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

## 十、常见问题

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
