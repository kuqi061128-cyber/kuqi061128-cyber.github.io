/* ============================================================
 * sw.js —— Service Worker：外壳缓存 + 弱网离线
 *
 * 策略：
 *   - 接口(/api 等)与后台：永不缓存，直连网络（避免脏数据）
 *   - 页面导航：network-first，断网时回退缓存的 index.html
 *   - 同源静态资源：stale-while-revalidate（先给缓存，后台悄悄更新）
 *
 * 更新方式：改动本文件后把 VERSION +1，旧缓存会在下次激活时清掉。
 * 注意：本文件必须放在站点根目录，且服务端不能长缓存它
 *       （Nginx 已配 location = /sw.js { no-store }）。
 * ============================================================ */
var VERSION = "1";
var CACHE = "dsh-shell-v" + VERSION;
var SHELL = ["/", "/index.html", "/assets/img/icon-256.png"];

/* 这些前缀永远走网络，不做任何缓存 */
var NETWORK_ONLY = /^\/(api|admin|content-manager|upload|uploads|i18n|users-permissions|transfers|data-overview)(\/|$)/;

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        return c.add(new Request(u, { cache: "reload" }))["catch"](function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k.indexOf("dsh-") === 0 && k !== CACHE) return caches["delete"](k);
        return null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;          // 跨域（不蒜子/微博等）交给浏览器
  if (NETWORK_ONLY.test(url.pathname)) return;              // 接口：直连
  if (url.pathname === "/sw.js") return;                    // 自身不缓存

  /* 页面导航：优先网络，断网回退缓存的外壳 */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put("/index.html", copy)["catch"](function () {}); });
        }
        return res;
      })["catch"](function () {
        return caches.match("/index.html").then(function (r) {
          return r || caches.match("/") || new Response("离线中，请稍后重试", {
            status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
        });
      })
    );
    return;
  }

  /* 静态资源：stale-while-revalidate */
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.ok && res.type === "basic") {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy)["catch"](function () {}); });
        }
        return res;
      })["catch"](function () { return cached; });
      return cached || network;
    })
  );
});
