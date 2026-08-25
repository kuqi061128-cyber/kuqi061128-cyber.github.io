/* ============================================================
 * 插件：给博主点赞（左栏 · 互动）—— 全网真实计数版
 * 替换原 plugins/like.js 使用；记得在 index.html 把 ?v= 升一位
 *
 * 数据源: Strapi Like 集合（Public 可 create/find）
 *   - 打开页面: GET /api/likes?pagination[pageSize]=1 → meta.pagination.total
 *   - 点赞:    POST /api/likes {}
 *   - 防重复:  沿用访客本地 dsh_liked 标记
 *   - 后端不可用时自动退回原来的本地计数逻辑（离线也不报错）
 * ============================================================ */
(function () {
  let styleAdded = false;
  function ensureStyle() {
    if (styleAdded) return;
    styleAdded = true;
    const st = document.createElement("style");
    st.textContent =
      ".like-box{text-align:center;padding:6px 0}" +
      ".like-btn{width:64px;height:64px;border-radius:50%;border:none;cursor:pointer;" +
      "background:rgba(244,114,182,.12);color:var(--pink);font-size:28px;transition:.2s}" +
      ".like-btn:hover{transform:scale(1.08)}" +
      ".like-btn.done{background:rgba(244,114,182,.25)}" +
      ".like-btn.pop{animation:likePop .35s}" +
      "@keyframes likePop{40%{transform:scale(1.3)}}" +
      ".like-count{font-size:22px;font-weight:700;margin-top:8px}" +
      ".like-hint{color:var(--muted);font-size:12px}";
    document.head.appendChild(st);
  }

  /* ---- 全站真实总数，拉取成功后被所有组件共享 ---- */
  const shared = { total: null };

  /* 异步数据到达(或确认离线)后重绘当前挂件 */
  function rerender() {
    if (P._el && P._ctx) P.render(P._el, P._ctx);
  }

  function fetchTotal(api, fallback) {
    api.get("/api/likes?pagination[pageSize]=1").then(function (res) {
      const m = res.meta && res.meta.pagination;
      if (m && typeof m.total === "number") { shared.total = m.total; rerender(); }
    })["catch"](function () {
      shared.total = fallback;   // 后端不可用 → 立即回退本地值，不停留“同步中…”
      rerender();
    });
  }

  const P = {
    id: "like",
    column: "left",
    order: 30,
    enabled: true,
    live: true,

    render(el, ctx) {
      ensureStyle();
      P._el = el; P._ctx = ctx;
      const total = shared.total != null ? shared.total : ctx.state.likes;
      el.innerHTML =
        '<div class="widget-title"><span><span class="ico">💗</span>给博主点赞</span></div>' +
        '<div class="like-box">' +
          '<button class="like-btn' + (ctx.state.liked ? " done" : "") + '" data-act="like">' +
            (ctx.state.liked ? "❤️" : "🤍") + "</button>" +
          '<div class="like-count">' + total + "</div>" +
          '<div class="like-hint">' +
            (shared.total != null
              ? (ctx.state.liked ? "感谢你的点赞喵～" : "点一下，给博主充点电喵～")
              : "同步中…") +
          "</div>" +
        "</div>";
    },

    init(el, ctx) {
      const api = window.DSH_API;
      fetchTotal(api, ctx.state.likes);

      el.addEventListener("click", e => {
        const btn = e.target.closest('[data-act="like"]');
        if (!btn) return;
        btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop");

        if (ctx.state.liked) { ctx.toast("已经点过赞啦，谢谢你的心意 ❤️"); return; }

        /* 先乐观更新界面 */
        ctx.state.liked = true;
        ctx.storeSet("dsh_liked", true);

        api.post("/api/likes", { data: {} }).then(function () {
          /* Strapi 的 POST 返回单个实体（无 pagination），总数按现有值 +1 */
          shared.total = (shared.total || ctx.state.likes) + 1;
          ctx.toast("感谢点赞 ❤️ 已同步到云端");
        })["catch"](function () {
          /* 后端挂了 → 本地记账兜底，行为与旧版一致 */
          ctx.state.likes += 1;
          ctx.storeSet("dsh_likes", ctx.state.likes);
          ctx.toast("当前离线，点赞先记在你这里啦 ❤️");
        })["finally"](function () {
          ctx.refreshPlugins();
        });
      });
    },
  };

  registerPlugin(P);
})();
