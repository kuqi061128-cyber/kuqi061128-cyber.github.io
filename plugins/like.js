/* ============================================================
 * 插件：给博主点赞（左栏 · 互动）
 * 大圆心形按钮；与桌宠单击点赞共用同一份数据（dsh_likes），
 * 每位访客只计一次，存在访客本地；live=true 保证两处计数同步
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

  const P = {
    id: "like",
    column: "left",
    order: 30,
    enabled: true,
    live: true,

    render(el, ctx) {
      ensureStyle();
      el.innerHTML =
        '<div class="widget-title"><span><span class="ico">💗</span>给博主点赞</span></div>' +
        '<div class="like-box">' +
          '<button class="like-btn' + (ctx.state.liked ? " done" : "") + '" data-act="like">' +
            (ctx.state.liked ? "❤️" : "🤍") + "</button>" +
          '<div class="like-count">' + ctx.state.likes + "</div>" +
          '<div class="like-hint">' + (ctx.state.liked ? "感谢你的点赞喵～" : "点一下，给博主充点电喵～") + "</div>" +
        "</div>";
    },

    init(el, ctx) {
      el.addEventListener("click", e => {
        const btn = e.target.closest('[data-act="like"]');
        if (!btn) return;
        btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop");
        if (ctx.state.liked) { ctx.toast("已经点过赞啦，谢谢你的心意 ❤️"); return; }
        ctx.state.likes += 1;
        ctx.state.liked = true;
        ctx.storeSet("dsh_likes", ctx.state.likes);
        ctx.storeSet("dsh_liked", true);
        ctx.refreshPlugins();
        ctx.toast("感谢点赞 ❤️");
      });
    },
  };

  registerPlugin(P);
})();
