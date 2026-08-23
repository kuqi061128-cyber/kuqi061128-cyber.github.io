/* ============================================================
 * RSS 生成脚本：node tools/build-rss.js
 * 读取 content/posts/ 下的文章生成根目录 rss.xml
 * 发新文章后跑一次再 git push（也可以攒几篇一起跑）
 * 站点地址/简介在下方 CFG 里改
 * ============================================================ */
const fs = require("fs");
const path = require("path");

const CFG = {
  siteUrl: "https://kuqis.cloud/",
  title: "Kuqi 博客",
  description: "Kuqi 的个人博客：分享教程、随笔、作品与下载。",
};

/* 模拟浏览器环境执行文章文件（文件里只是调用 registerPost） */
const posts = [];
global.window = {};
global.registerPost = def => posts.push(def);

const dir = path.join(__dirname, "..", "content", "posts");
for (const f of fs.readdirSync(dir).sort()) {
  if (!f.endsWith(".js") || f.startsWith("_")) continue;
  require(path.join(dir, f));
}

const escXml = s => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const items = posts
  .slice()
  .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  .map(a => {
    const url = CFG.siteUrl + "#/post/" + a.id;
    const pub = new Date(a.date + "T00:00:00+08:00").toUTCString();
    return "    <item>\n" +
      "      <title>" + escXml(a.title) + "</title>\n" +
      "      <link>" + url + "</link>\n" +
      "      <guid>" + url + "</guid>\n" +
      "      <pubDate>" + pub + "</pubDate>\n" +
      "      <description>" + escXml(a.summary) + "</description>\n" +
      "    </item>";
  })
  .join("\n");

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n' +
  '  <channel>\n' +
  '    <title>' + escXml(CFG.title) + '</title>\n' +
  '    <link>' + CFG.siteUrl + '</link>\n' +
  '    <atom:link href="' + CFG.siteUrl + 'rss.xml" rel="self" type="application/rss+xml"/>\n' +
  '    <description>' + escXml(CFG.description) + '</description>\n' +
  '    <language>zh-CN</language>\n' +
  '    <lastBuildDate>' + new Date().toUTCString() + '</lastBuildDate>\n' +
  items + "\n" +
  '  </channel>\n' +
  '</rss>\n';

const out = path.join(__dirname, "..", "rss.xml");
fs.writeFileSync(out, xml, "utf8");
console.log("rss.xml 已生成：" + posts.length + " 篇文章，" + Buffer.byteLength(xml) + " 字节");
