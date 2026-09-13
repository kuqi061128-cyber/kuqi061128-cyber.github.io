#!/usr/bin/env node
/* ============================================================
 * build-seo-pages.mjs —— 为每篇文章生成可被搜索引擎收录的静态骨架页
 *
 * 背景：站点用 hash 路由（#/post/1），搜索引擎只把根地址当独立页面，
 *       文章无法被收录、分享卡片也抓不到文章信息。
 *       本脚本为每篇文章生成 /p/<id>.html：内含真实标题/摘要/OG 标签/
 *       JSON-LD 结构化数据 + 正文摘要段落，访客打开会自动跳转到 SPA 正文。
 *
 * 产出：
 *   /var/www/my-site/p/<id>.html   （每篇一个）
 *   /var/www/my-site/sitemap.xml   （重新生成：根地址 + 全部骨架页）
 *
 * 用法（服务器）：
 *   node /opt/my-site/tools/build-seo-pages.mjs
 * 可配环境变量：
 *   STRAPI_URL  默认 http://127.0.0.1:1337
 *   OUT_DIR     默认 /var/www/my-site
 *   SITE_URL    默认 https://kuqis.cloud
 *   SITE_NAME   默认 Kuqi's Web
 *
 * 幂等：重复执行覆盖同名文件；数据库中已删除的文章，其骨架页会被清理。
 * 安全：接口不可用时直接退出，不改动任何文件。
 * ============================================================ */

import fs from "node:fs/promises";
import path from "node:path";

const STRAPI_URL = process.env.STRAPI_URL || "http://127.0.0.1:1337";
const OUT_DIR = process.env.OUT_DIR || "/var/www/my-site";
const SITE_URL = (process.env.SITE_URL || "https://kuqis.cloud").replace(/\/+$/, "");
const SITE_NAME = process.env.SITE_NAME || "Kuqi's Web";
const OG_IMAGE = SITE_URL + "/assets/background.jpg";
const PAGE_DIR = path.join(OUT_DIR, "p");

const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const stripTags = (html) =>
  String(html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ").trim();

function pageHtml(p) {
  const id = p.id;
  const title = p.title || "未命名";
  const url = SITE_URL + "/p/" + id + ".html";
  const spaUrl = "/#/post/" + id;
  const text = stripTags(p.contentHtml).slice(0, 300);
  const desc = (p.summary || text).slice(0, 150);
  const date = p.date || "";
  const author = p.authorName || SITE_NAME;
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    datePublished: date,
    description: desc,
    articleSection: p.category || "",
    keywords: Array.isArray(p.tags) ? p.tags.join(",") : (p.tags || ""),
    author: { "@type": "Person", name: author },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: url,
  };
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} - ${esc(SITE_NAME)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(OG_IMAGE)}">
<meta name="twitter:card" content="summary">
<meta http-equiv="refresh" content="0;url=${esc(spaUrl)}">
<link rel="icon" href="/assets/img/dsh.ico">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>
  body{margin:0;background:#0f172a;color:#e2e8f0;font-family:"PingFang SC","Microsoft YaHei",-apple-system,sans-serif;line-height:1.75}
  main{max-width:760px;margin:0 auto;padding:48px 22px}
  h1{font-size:24px;line-height:1.4;margin:0 0 10px}
  .meta{color:#94a3b8;font-size:13px;margin:0 0 18px}
  p{font-size:15px;color:#cbd5e1}
  a{color:#38bdf8}
</style>
</head>
<body>
<main>
  <h1>${esc(title)}</h1>
  <p class="meta">${esc(date)}${p.category ? " · " + esc(p.category) : ""} · ${esc(author)}</p>
  <p>${esc(text)}</p>
  <p><a href="${esc(spaUrl)}">如果页面没有自动跳转，点这里阅读全文 →</a></p>
</main>
<script>location.replace(${JSON.stringify(spaUrl)});</script>
</body>
</html>
`;
}

function sitemapXml(posts) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    `  <url>\n    <loc>${SITE_URL}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
  ].concat(posts.map((p) => {
    const lm = /^\d{4}-\d{2}-\d{2}$/.test(p.date || "") ? p.date : today;
    return `  <url>\n    <loc>${SITE_URL}/p/${p.id}.html</loc>\n    <lastmod>${lm}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
  }));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

async function main() {
  const t0 = Date.now();
  const api = STRAPI_URL + "/api/posts?pagination[pageSize]=500&sort=date:desc";

  let posts;
  try {
    const res = await fetch(api, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    posts = (json.data || []).filter((p) => p && p.id != null);
  } catch (err) {
    console.error("[seo] 拉取文章失败，未改动任何文件：" + err.message);
    process.exit(1);
  }

  await fs.mkdir(PAGE_DIR, { recursive: true });

  const keep = new Set();
  let written = 0;
  for (const p of posts) {
    const file = path.join(PAGE_DIR, p.id + ".html");
    keep.add(p.id + ".html");
    await fs.writeFile(file, pageHtml(p), "utf8");
    written++;
  }

  /* 清理数据库中已不存在的文章骨架页 */
  let removed = 0;
  const existing = await fs.readdir(PAGE_DIR).catch(() => []);
  for (const name of existing) {
    if (!name.endsWith(".html")) continue;
    if (!keep.has(name)) { await fs.unlink(path.join(PAGE_DIR, name)); removed++; }
  }

  await fs.writeFile(path.join(OUT_DIR, "sitemap.xml"), sitemapXml(posts), "utf8");

  console.log(`[seo] 生成 ${written} 篇骨架页，清理 ${removed} 篇，sitemap 已更新，耗时 ${Date.now() - t0}ms`);
}

main().catch((e) => { console.error("[seo] 执行出错：" + e.message); process.exit(1); });
