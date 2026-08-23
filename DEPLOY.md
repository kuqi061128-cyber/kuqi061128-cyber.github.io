# 部署上线手册（GitHub Pages + 自定义域名）

> 前置条件：域名（审核中）、GitHub 账号。全部完成后，别人就能通过你的域名访问博客。

## 第一步：把代码推上 GitHub

1. 登录 GitHub，新建一个仓库：
   - 仓库名建议用 `博客名.github.io` 的形式（如 `kuqi.github.io`），这样 Pages 地址就是 `https://kuqi.github.io`；
   - 选 **Public**（免费账户的 Pages 只支持公开仓库）；
   - 其他选项都不勾，创建空仓库。
2. 在本目录（my-site）执行（把 `用户名` 换成你的 GitHub 用户名）：

   ```
   git remote add origin https://github.com/用户名/用户名.github.io.git
   git push -u origin main
   ```

## 第二步：开启 GitHub Pages

1. 仓库页面 → **Settings** → 左侧 **Pages**；
2. Source 选 **Deploy from a branch**，分支选 `main`、目录选 `/ (root)`，保存；
3. 等一两分钟，会出现 `https://用户名.github.io` 的访问地址，先点开验证博客正常。

## 第三步：绑定域名

1. 到域名注册商的 DNS 管理里加记录：
   - **CNAME** 记录：主机记录 `@`（或 `www`），记录值 `用户名.github.io`；
   - 部分注册商不支持 `@` 用 CNAME，则改用 **A 记录**指向 Pages 的 IP：
     `185.199.108.153`、`185.199.109.153`、`185.199.110.153`、`185.199.111.153`
2. 回到仓库 **Settings → Pages → Custom domain**，填入你的域名，保存；
3. 勾选 **Enforce HTTPS**（等证书签发完成，几分钟到几小时）；
4. 在仓库根目录放一个 `CNAME` 文件（内容就一行域名），防止每次推送后绑定丢失——**这步让 ZCode 来做**，提供域名即可。

## 第四步：上传应用安装包（超过 100MB 的 zip）

git 仓库放不下 149MB 的安装包（已通过 .gitignore 排除），改用 GitHub Releases 托管：

1. 仓库页面 → **Releases** → **Draft a new release**；
2. Tag 随意（如 `v1.2.0`），标题写版本号，把 `downloads/dsh-desktop-v1.2.0.zip` 拖进附件区发布；
3. 复制附件下载链接，把 `content/works/01-dsh-desktop.js` 里的
   `file: "downloads/dsh-desktop-v1.2.0.zip"` 改成这个链接（支持外链，下载按钮自动适配）；
4. 提交推送：`git add -A && git commit -m "下载改用 Release" && git push`。

## 日常更新流程

```
git add -A
git commit -m "一句话说明改了什么"
git push
```

推送后一两分钟线上自动更新。改了 JS 文件访客看不到变化时，让对方 Ctrl+F5，或给对应 `<script>` 标签加 `?v=数字`。

## 国内访客访问慢？（可选优化）

GitHub Pages 在国内速度时好时坏。域名 DNS 托管到 **Cloudflare**（免费）并开启代理（橙色云），SSL/TLS 模式设为 **Full**，通常能有明显改善。
