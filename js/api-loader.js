/* ============================================================
 * api-loader.js —— 动态内容加载器（本改造的核心）
 *
 * 职责:
 *   1. 优先从 Strapi 拉取 文章/作品/友链，转换后调用引擎原有的
 *      registerPost / registerWork / registerSite 注册进内存；
 *   2. 接口失败或超时(6秒)时，按原顺序注入本地 content/*.js 回退，
 *      保证网站永远能打开（纯静态兜底）；
 *   3. 完成后 resolve window.DSH_CONTENT_READY，index.html 的启动脚本
 *      会等它就绪再渲染。
 *
 * 部署: my-site/js/api-loader.js，替换 index.html 原「内容库引入区」
 * ============================================================ */
(function () {

  var API = window.DSH_API;

  /* ---------- 可调参数 ---------- */
  var TIMEOUT_MS = 6000;

  /* 回退用的本地内容清单：与原 index.html「内容库引入区」保持一致
     （新增纯静态备用文章时在这里补一行即可，平时不用管） */
  var LOCAL_FILES = [
    "content/links/01-deepseek.js",
    "content/links/02-github.js",
    "content/links/03-bilibili.js",
    "content/links/04-kk.js",
    "content/links/05-siliconflow.js",
    "content/links/06-modelscope.js",
    "content/posts/2026-08-20-welcome.js",
    "content/posts/2026-08-12-zero-dep-blog.js",
    "content/posts/2026-08-05-august-notes.js",
    "content/posts/2026-08-22-publish-guide.js",
    "content/works/01-dsh-desktop.js"
  ];

  /* ---------- 工具 ---------- */

  /* 接口记录 → 引擎内容对象。保留引擎认识的全部业务字段，
     剥掉 Strapi 内部字段；媒体对象转成绝对 URL 字符串 */
  function mapItem(raw) {
    var SKIP = {
      documentId: 1, createdAt: 1, updatedAt: 1, publishedAt: 1,
      locale: 1, localizations: 1, createdBy: 1, updatedBy: 1, user: 1
    };
    var out = {};
    for (var k in raw) {
      if (!Object.prototype.hasOwnProperty.call(raw, k) || SKIP[k]) continue;
      var v = raw[k];

      /* 媒体字段（v5 populate 后为含 url 的对象） */
      if (v && typeof v === "object" && typeof v.url === "string") { out[k] = API.abs(v.url); continue; }
      /* v4 兼容：{ data: { attributes: {...} } } */
      if (v && typeof v === "object" && v.data && v.data.attributes) v = v.data.attributes;

      out[k] = v;
    }
    /* 字段名对齐引擎约定 */
    if (raw.contentHtml != null) out.content = raw.contentHtml;

    out._dir = ""; /* API 模式下没有同名文件夹约定（导入时已改写为绝对地址） */
    return out;
  }

  /* 顺序注入一组本地 <script>（async=false 保证执行顺序） */
  function loadLocalScripts(files) {
    return new Promise(function (resolve) {
      var i = 0;
      function next() {
        if (i >= files.length) { resolve(); return; }
        var s = document.createElement("script");
        s.src = files[i++];
        s.async = false;
        s.onload = next;
        s.onerror = function () { console.warn("[api-loader] 回退文件加载失败:", s.src); next(); };
        document.head.appendChild(s);
      }
      next();
    });
  }

  /* ---------- 主流程 ---------- */

  function fetchAll() {
    var q = "?pagination[pageSize]=200";
    return Promise.all([
      API.withTimeout(API.get("/api/posts" + q + "&sort=date:desc"), TIMEOUT_MS),
      API.withTimeout(API.get("/api/works" + q + "&populate=*"), TIMEOUT_MS),
      API.withTimeout(API.get("/api/links" + q), TIMEOUT_MS)
    ]);
  }

  function registerFromApi(results) {
    var posts = results[0].data || [];
    var works = results[1].data || [];
    var links = results[2].data || [];

    posts.forEach(function (p) { window.registerPost(mapItem(p)); });
    works.forEach(function (w) { window.registerWork(mapItem(w)); });
    links.forEach(function (l) { window.registerSite(mapItem(l)); });

    console.log("[api-loader] 已从后台加载 " +
      posts.length + " 篇文章 / " + works.length + " 个作品 / " + links.length + " 个推荐");
  }

  window.DSH_CONTENT_READY =
    fetchAll()
      .then(registerFromApi)
      ["catch"](function (err) {
        console.warn("[api-loader] 后台不可用(" + err.message + ")，回退到本地静态内容");
        return loadLocalScripts(LOCAL_FILES);
      });
})();
