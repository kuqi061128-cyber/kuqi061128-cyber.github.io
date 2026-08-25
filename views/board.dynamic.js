/* ============================================================
 * 分区模块：留言板 —— 云端留言墙（额度制 v3）
 *
 * 额度规则（服务端强制）：
 *   游客     ：每个 IP 最多 1 条
 *   注册登录 ：每个账号最多 3 条，可在「我的 → 我的评论」删除旧留言腾额度
 *
 * 后端：
 *   GET  /api/messages          公开读取
 *   POST /api/messages/send     发留言（游客/登录统一入口）
 * ============================================================ */
(function () {

  const CONFIG = {
    PAGE_SIZE: 50,
  };

  const S = {
    id: "board",
    label: "留言板",
    order: 40,

    render(el, ctx) {
      const api = window.DSH_API;
      const esc = ctx.esc;
      const me = window.DSH_AUTH && window.DSH_AUTH.user();

      el.innerHTML =
        '<div class="view-head"><h2 class="view-title">💬 留言板</h2></div>' +

        '<div class="widget" style="padding:18px;margin-bottom:16px">' +
          (me
            ? '<div style="font-size:13px;color:var(--muted);margin-bottom:10px">' +
              '👋 以 <b>' + esc(me.username || me.email) + '</b> 身份留言（每账号限 3 条，' +
              '可在<a href="#/account" style="color:var(--accent)">我的评论</a>里删除旧的腾额度）</div>'
            : '<div style="font-size:13px;color:var(--muted);margin-bottom:10px">' +
              '🙋 游客按 IP 限留言 <b>1</b> 条；<a href="#/account" style="color:var(--accent)">注册登录</a>' +
              ' 后可留 3 条且能随时管理删除</div>') +
          '<form id="dshBoardForm">' +
            (me ? '' :
              '<input id="dshBName" placeholder="昵称 *" required maxlength="30" ' +
              'style="width:100%;padding:10px;border:1px solid #555;border-radius:8px;margin-bottom:10px;background:transparent;color:inherit">') +
            '<textarea id="dshBContent" required maxlength="500" placeholder="说点什么吧…（≤500字）" ' +
              'style="width:100%;min-height:90px;padding:10px;border:1px solid #555;border-radius:8px;resize:vertical;background:transparent;color:inherit"></textarea>' +
            '<button type="submit" id="dshBSend" style="margin-top:10px;width:100%;padding:11px;border:0;' +
              'border-radius:8px;background:#4945ff;color:#fff;font-size:15px;cursor:pointer">发 布 留 言</button>' +
            '<div id="dshBTip" style="margin-top:8px;font-size:13px;text-align:center;min-height:18px"></div>' +
          '</form>' +
        '</div>' +

        '<div class="widget" style="padding:14px"><div id="dshBList">' +
          '<div style="text-align:center;color:var(--muted);padding:24px 0">留言加载中…</div>' +
        '</div></div>';

      const listBox = el.querySelector("#dshBList");
      const tip = el.querySelector("#dshBTip");

      function say(text, ok) {
        tip.textContent = text;
        tip.style.color = ok ? "#2f9e44" : "#d02b20";
      }

      function loadList() {
        api.get("/api/messages?sort=createdAt:desc&pagination[pageSize]=" + CONFIG.PAGE_SIZE)
          .then((res) => {
            const rows = res.data || [];
            if (!rows.length) {
              listBox.innerHTML = '<div style="text-align:center;color:var(--muted);padding:24px 0">还没有留言，来抢沙发吧～</div>';
              return;
            }
            listBox.innerHTML = rows.map((r) => {
              const when = r.createdAt ? new Date(r.createdAt).toLocaleString() : "";
              return '<div style="padding:12px 4px;border-bottom:1px solid rgba(128,128,128,.25)">' +
                       '<div style="display:flex;justify-content:space-between;font-size:13px">' +
                         '<b>' + esc(r.name || "匿名") + '</b><span style="color:var(--muted)">' + when + '</span>' +
                       '</div>' +
                       '<div style="margin-top:6px;line-height:1.7">' + esc(r.content || "") + '</div>' +
                     '</div>';
            }).join("");
          })
          ["catch"](() => {
            listBox.innerHTML = '<div style="text-align:center;color:var(--muted);padding:24px 0">' +
              '留言加载失败（后端可能临时不可用）</div>';
          });
      }

      el.querySelector("#dshBoardForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const content = el.querySelector("#dshBContent").value.trim();
        if (!content) return;
        const nameInput = el.querySelector("#dshBName");
        const name = nameInput ? nameInput.value.trim() : "";

        const sendBtn = el.querySelector("#dshBSend");
        sendBtn.disabled = true;
        say("发布中…", true);

        const payload = { data: { content } };
        if (!me) payload.data.name = name || "游客";

        api.post("/api/messages/send", payload)
          .then(() => {
            say("✅ 发布成功！", true);
            e.target.reset();
            loadList();
          })
          ["catch"]((err) => {
            const m = err.message || "";
            say("❌ " + (m.indexOf("只能") > -1 || m.indexOf("上限") > -1 ? m
              : m.indexOf("429") > -1 ? "操作太频繁，等一分钟再试"
              : m), false);
          })
          ["finally"](() => { sendBtn.disabled = false; });
      });

      loadList();
    },
  };

  registerSection(S);
})();
