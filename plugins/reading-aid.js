/* ============================================================
 * 插件：阅读辅助（column: "float"，挂在 body 上）
 *   1) 导航栏底部的阅读进度条（滚到哪亮到哪）
 *   2) 返回顶部按钮（下滚超过一屏后出现，避开右下角桌宠区域）
 * ============================================================ */
(function () {
  let styleAdded = false;
  function ensureStyle() {
    if (styleAdded) return;
    styleAdded = true;
    const st = document.createElement("style");
    st.textContent =
      /* 进度条贴在导航栏底边，响应式下导航高度变化也能跟着 */
      ".ra-progress{position:absolute;bottom:0;left:0;right:0;height:2px;z-index:21;" +
      "transform-origin:0 50%;transform:scaleX(0);" +
      "background:linear-gradient(90deg,var(--accent),var(--accent2));pointer-events:none}" +
      /* 返回顶部：默认透明不可点，滚过 400px 才出现；bottom 抬高避开桌宠 */
      ".ra-backtop{position:fixed;right:18px;bottom:190px;width:40px;height:40px;" +
      "border-radius:50%;border:1px solid var(--line);background:var(--card);" +
      "color:var(--text);font-size:18px;cursor:pointer;z-index:85;" +
      "opacity:0;pointer-events:none;transition:.25s;line-height:1}" +
      ".ra-backtop.show{opacity:1;pointer-events:auto}" +
      ".ra-backtop:hover{border-color:var(--accent);transform:translateY(-2px)}";
    document.head.appendChild(st);
  }

  const P = {
    id: "reading-aid",
    column: "float",
    className: "ra-host",
    order: 95,
    enabled: true,

    render(el) {
      ensureStyle();
      el.style.display = "none";   // 宿主容器不显示，真正的 UI 挂在导航和 body 上
    },

    init(el, ctx) {
      /* 进度条：挂在导航栏（sticky）内部底边 */
      const bar = document.createElement("div");
      bar.className = "ra-progress";
      document.querySelector("nav").appendChild(bar);

      /* 返回顶部按钮 */
      const btn = document.createElement("button");
      btn.className = "ra-backtop";
      btn.innerHTML = "↑";
      btn.title = "返回顶部";
      btn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      document.body.appendChild(btn);

      const update = () => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        bar.style.transform = "scaleX(" + (max > 0 ? h.scrollTop / max : 0) + ")";
        btn.classList.toggle("show", h.scrollTop > 400);
      };
      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      update();
    },
  };

  registerPlugin(P);
})();
