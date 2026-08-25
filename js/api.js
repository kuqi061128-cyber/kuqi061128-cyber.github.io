/* ============================================================
 * api.js —— 与 Strapi 后端通信的轻量封装（零依赖，原生 fetch）
 *
 * 放置位置: my-site/js/api.js
 * 加载顺序: 在 index.html 中位于 api-loader.js 之前
 *
 * 同域部署（本方案默认）API_BASE 留空 "" 即可；
 * 若以后把 Strapi 单独部署到别的域名，改成 "https://api.kuqis.cloud"。
 * ============================================================ */
window.DSH_API = (function () {

  var API_BASE = "";

  function getToken() {
    try { return localStorage.getItem("jwt") || ""; } catch (e) { return ""; }
  }

  /* 基础请求: 自动带登录令牌, 非 2xx 抛出可读错误 */
  function request(method, path, body) {
    var headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    var tk = getToken();
    if (tk) headers["Authorization"] = "Bearer " + tk;

    return fetch(API_BASE + path, {
      method: method,
      headers: headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    }).then(function (res) {
      return res.json()["catch"](function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var msg = (data && data.error && data.error.message) ? data.error.message : ("HTTP " + res.status);
          throw new Error(msg);
        }
        return data;
      });
    });
  }

  return {
    base: API_BASE,
    get:  function (path)       { return request("GET", path); },
    post: function (path, body) { return request("POST", path, body || {}); },

    /* 相对路径转绝对地址（Strapi 上传文件返回 /uploads/xx.png 这类相对路径） */
    abs: function (u) {
      if (!u) return u;
      if (u.indexOf("http:") === 0 || u.indexOf("https:") === 0 ||
          u.indexOf("//") === 0 || u.indexOf("data:") === 0) return u;
      return API_BASE + u;
    },

    /* 给任意请求加超时保护（毫秒），超时走 reject —— 加载器用它触发本地回退 */
    withTimeout: function (promise, ms) {
      return Promise.race([
        promise,
        new Promise(function (_, rej) {
          setTimeout(function () { rej(new Error("timeout")); }, ms || 6000);
        })
      ]);
    }
  };
})();
