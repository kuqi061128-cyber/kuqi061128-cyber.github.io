/* ============================================================
 * 分区模块：留言板 —— 云端留言墙版（替换 views/board.js）
 * 数据存 Strapi Message 集合；不再要求访客有 GitHub 账号。
 *
 * 权限前提 (后台 Roles):
 *   Public: Message → find ✅ create ✅
 *   Authenticated: Message → create ✅ （登录用户留言自动关联账号）
 *
 * 可选开关（改下方 CONFIG）：REQUIRE_LOGIN=true 时只有登录用户能留言
 * ============================================================ */
(function () {

  const CONFIG = {
    REQUIRE_LOGIN: false,   // true = 仅登录用户可留言（配合用户系统阶段开启）
    PAGE_SIZE: 50,
  };

  const S = {
    id: "board",
    label: "留言板",
    order: 40,

    render(el, ctx) {
      const api = window.DSH_API;
      const esc = ctx.esc;
      const jwt = localStorage.getItem("jwt");
      let me = null;
      try { me = JSON.parse(localStorage.getItem("user") || "null"); } catch (e) {}

      el.innerHTML =
        '<div class="view-head"><h2 class="view-title">💬 留言板</h2></div>' +

        /* 留言表单卡片 */
        '<div class="widget" style="padding:18px;margin-bottom:16px">' +
          '<form id="dshBoardForm">' +
            (me
              ? '<div style="font-size:13px;color:var(--muted);margin-bottom:10px">' +
                '👋 以 <b>' + esc(me.username || me.email) + '</b> 身份留言</div>'
              : '<input id="dshBName" placeholder="昵称 *" required maxlength="50" ' +
                'style="width:100%;padding:10px;border:1px solid #555;border-radius:8px;margin-bottom:10px;background:transparent;color:inherit">') +
            '<textarea id="dshBContent" required maxlength="1000" placeholder="说点什么吧…（支持纯文本）" ' +
              'style="width:100%;min-height:90px;padding:10px;border:1px solid #555;border-radius:8px;resize:vertical;background:transparent;color:inherit"></textarea>' +
            '<button type="submit" id="dshBSend" style="margin-top:10px;width:100%;padding:11px;border:0;' +
              'border-radius:8px;background:#4945ff;color:#fff;font-size:15px;cursor:pointer">发 布 留 言</button>' +
            '<div id="dshBTip" style="margin-top:8px;font-size:13px;text-align:center;min-height:18px"></div>' +
          '</form>' +
        '</div>' +

        /* 留言列表 */
        '<div class="widget" style="padding:14px"><div id="dshBList">' +
          '<div style="text-align:center;color:var(--muted);padding:24px 0">留言加载中…</div>' +
        '</div></div>';

      const listBox = el.querySelector("#dshBList");
      const tip = el.querySelector("#dshBTip");

      function say(text, ok) {
        tip.textContent = text;
        tip.style.color = ok ? "#2f9e44" : "#d02b20";
      }

      /* ---- 拉取并渲染列表 ---- */
      function loadList() {
        api.get("/api/messages?sort=createdAt:desc&pagination[pageSize]=" + CONFIG.PAGE_SIZE)
          .then(function (res) {
            const rows = res.data || [];
            if (!rows.length) {
              listBox.innerHTML = '<div style="text-align:center;color:var(--muted);padding:24px 0">还没有留言，来抢沙发吧～</div>';
              return;
            }
            listBox.innerHTML = rows.map(function (r) {
              const u = r.user && (r.user.username || r.user.email);
              const who = esc(u || r.name || "匿名");
              const when = r.createdAt ? new Date(r.createdAt).toLocaleString() : "";
              return '<div style="padding:12px 4px;border-bottom:1px solid rgba(128,128,128,.25)">' +
                       '<div style="display:flex;justify-content:space-between;font-size:13px">' +
                         '<b>' + who + '</b><span style="color:var(--muted)">' + when + '</span>' +
                       '</div>' +
                       '<div style="margin-top:6px;line-height:1.7">' + esc(r.content || "") + '</div>' +
                     '</div>';
            }).join("");
          })
          ["catch"](function (err) {
            listBox.innerHTML = '<div style="text-align:center;color:var(--muted);padding:24px 0">' +
              '留言加载失败：' + esc(err.message) + '<br>（请确认后台已建 Message 类型且 Public 勾选了 find/create）</div>';
          });
      }

      /* ---- 发布 ---- */
      el.querySelector("#dshBoardForm").addEventListener("submit", function (e) {
        e.preventDefault();
        if (CONFIG.REQUIRE_LOGIN && !jwt) { say("请先登录后再留言 ✋", false); return; }

        const content = el.querySelector("#dshBContent").value.trim();
        if (!content) return;
        const nameInput = el.querySelector("#dshBName");
        const name = me ? (me.username || me.email) : (nameInput && nameInput.value.trim());

        if (!name) { say("请填写昵称", false); return; }

        const sendBtn = el.querySelector("#dshBSend");
        sendBtn.disabled = true; say("发布中…", true);

        const payload = { data: { name: name, content: content } };
        void me; // 用户关联已简化: 留言以昵称记录

        api.post("/api/messages", payload)
          .then(function () {
            e.target.reset();
            say("✅ 发布成功！", true);
            loadList();
          })
          ["catch"](function (err) { say("❌ " + err.message, false); })
          ["finally"](function () { sendBtn.disabled = false; });
      });

      loadList();
    },
  };

  registerSection(S);
})();
