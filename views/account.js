/* ============================================================
 * 分区模块：我的（用户系统）
 *   - 未登录：登录 / 注册表单
 *   - 已登录：账号卡片、退出登录、投稿表单、我的投稿（含审核状态）
 *
 * 后端约定：
 *   POST /api/auth/local          {identifier,password} → {jwt|token, user}
 *   POST /api/auth/local/register {username,email,password}
 *   POST /api/works/submit        {data:{...}} → 强制草稿待审
 *   GET  /api/works/mine          → 自己的投稿(含待审核)
 *
 * 登录态存 localStorage：jwt + user(JSON)，留言板自动识别身份
 * ============================================================ */
(function () {

  /* ---------- 全局认证工具（其他模块可复用） ---------- */
  window.DSH_AUTH = {
    user() {
      try { return JSON.parse(localStorage.getItem("user") || "null"); } catch (e) { return null; }
    },
    token() { return localStorage.getItem("jwt") || ""; },
    save(jwt, user) {
      localStorage.setItem("jwt", jwt);
      localStorage.setItem("user", JSON.stringify(user));
    },
    logout() {
      localStorage.removeItem("jwt");
      localStorage.removeItem("user");
    },
  };

  const S = {
    id: "account",
    label: "我的",
    order: 35,   // 作品(30)之后、留言板(40)之前

    render(el, ctx) {
      const esc = ctx.esc;
      const me = window.DSH_AUTH.user();

      el.innerHTML =
        '<div class="view-head"><h2 class="view-title">👤 我的</h2></div>' +
        '<div id="accountBody"></div>';

      const body = el.querySelector("#accountBody");
      if (!me) S.renderAuth(body, esc);
      else S.renderProfile(body, ctx, esc, me);
    },

    /* ============ 未登录：登录 / 注册 ============ */
    renderAuth(body, esc) {
      body.innerHTML =
        '<article class="post-detail" style="max-width:520px;margin:0 auto">' +
          '<div class="view-head" style="margin-bottom:6px"><h3>登录</h3><span style="font-size:12px;color:var(--muted)">注册即可投稿作品</span></div>' +
          '<div style="display:flex;gap:8px;margin-bottom:14px">' +
            '<button id="tabLogin" class="chip" style="cursor:pointer;border:0">登录</button>' +
            '<button id="tabReg" class="chip" style="cursor:pointer;border:0;background:transparent;color:var(--accent);border:1px solid rgba(56,189,248,.25)">注册新账号</button>' +
          '</div>' +
          '<form id="authForm">' +
            '<input id="fUser" placeholder="用户名或邮箱 *" required style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;margin-bottom:10px">' +
            '<input id="fMail" type="email" placeholder="邮箱 *" required style="display:none;width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;margin-bottom:10px">' +
            '<input id="fPass" type="password" placeholder="密码 *（至少6位）" required minlength="6" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;margin-bottom:10px">' +
            '<button type="submit" id="fGo" style="width:100%;padding:11px;border:0;border-radius:8px;' +
              'background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:15px;cursor:pointer">登 录</button>' +
            '<div id="fTip" style="margin-top:10px;font-size:13px;text-align:center;min-height:18px;color:var(--muted)"></div>' +
          '</form>' +
        '</article>';

      let mode = "login";
      const tip = (t, ok) => {
        const n = body.querySelector("#fTip");
        n.textContent = t;
        n.style.color = ok ? "#2f9e44" : "#d02b20";
      };

      body.querySelector("#tabLogin").addEventListener("click", () => {
        mode = "login";
        body.querySelector("#fMail").style.display = "none";
        body.querySelector("#fGo").textContent = "登 录";
      });
      body.querySelector("#tabReg").addEventListener("click", () => {
        mode = "register";
        body.querySelector("#fMail").style.display = "block";
        body.querySelector("#fGo").textContent = "注 册";
      });

      body.querySelector("#authForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const api = window.DSH_API;
        const u = body.querySelector("#fUser").value.trim();
        const p = body.querySelector("#fPass").value;
        if (!u || !p) return;

        tip(mode === "login" ? "登录中…" : "注册中…", true);
        const req = mode === "login"
          ? api.post("/api/auth/local", { identifier: u, password: p })
          : api.post("/api/auth/local/register", {
              username: u,
              email: body.querySelector("#fMail").value.trim(),
              password: p,
            });

        req.then((res) => {
          const jwt = res.jwt || res.token;
          if (!jwt || !res.user) throw new Error("响应异常");
          window.DSH_AUTH.save(jwt, res.user);
          location.hash = "#/account";
          location.reload();   // 简单可靠：整页刷新让所有插件感知登录态
        })["catch"]((err) => tip("❌ " + err.message, false));
      });
    },

    /* ============ 已登录：账号卡 + 投稿 + 我的列表 ============ */
    renderProfile(body, ctx, esc, me) {
      body.innerHTML =
        '<article class="post-detail">' +
          /* 账号卡 */
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
            '<div><b style="font-size:17px">👋 ' + esc(me.username || me.email) + '</b>' +
            (me.email ? '<div style="font-size:13px;color:var(--muted)">' + esc(me.email) + '</div>' : '') + '</div>' +
            '<button id="btnOut" style="padding:7px 18px;border:1px solid var(--line);border-radius:999px;' +
              'background:transparent;color:var(--muted);cursor:pointer">退出登录</button>' +
          '</div>' +

          /* 投稿表单 */
          '<h3 style="margin:22px 0 10px;padding-left:12px;border-left:3px solid var(--accent);font-size:16px">🚀 投稿作品</h3>' +
          '<p style="font-size:13px;color:var(--muted);margin-bottom:12px">提交后进入待审核，站长确认后会在作品页展示。</p>' +
          '<form id="subForm">' +
            '<input id="sTitle" placeholder="作品名称 *" required maxlength="60" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;margin-bottom:10px">' +
            '<input id="sDesc" placeholder="一句话简介" maxlength="120" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;margin-bottom:10px">' +
            '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">' +
              '<input id="sTag" placeholder="分类标签，如 工具" maxlength="12" style="flex:1;min-width:110px;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit">' +
              '<input id="sVer" placeholder="版本号，如 v1.0" maxlength="20" style="flex:1;min-width:110px;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit">' +
              '<input id="sSize" placeholder="大小，如 12MB" maxlength="20" style="flex:1;min-width:110px;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit">' +
            '</div>' +
            '<input id="sFile" placeholder="下载链接（http(s):// 开头，可留空）" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;margin-bottom:10px">' +
            '<textarea id="sDetail" placeholder="详细介绍（支持 HTML：p / h3 / img 等），可留空" style="width:100%;min-height:80px;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;resize:vertical"></textarea>' +
            '<button type="submit" id="sGo" style="margin-top:10px;width:100%;padding:11px;border:0;border-radius:8px;' +
              'background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:15px;cursor:pointer">提 交 投 稿</button>' +
            '<div id="sTip" style="margin-top:8px;font-size:13px;text-align:center;min-height:18px;color:var(--muted)"></div>' +
          '</form>' +

          /* 我的投稿 */
          '<h3 style="margin:22px 0 10px;padding-left:12px;border-left:3px solid var(--accent);font-size:16px">📋 我的投稿</h3>' +
          '<div id="mineList"><div style="color:var(--muted);font-size:13px;padding:8px 0">加载中…</div></div>' +
        '</article>';

      /* 退出 */
      body.querySelector("#btnOut").addEventListener("click", () => {
        window.DSH_AUTH.logout();
        location.reload();
      });

      /* 投稿提交 */
      const tip = (t, ok) => {
        const n = body.querySelector("#sTip");
        n.textContent = t;
        n.style.color = ok ? "#2f9e44" : "#d02b20";
      };
      body.querySelector("#subForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const g = (id) => body.querySelector(id).value.trim();
        const payload = {
          title: g("#sTitle"),
          desc: g("#sDesc"),
          tag: g("#sTag") || "待分类",
          version: g("#sVer"),
          size: g("#sSize"),
          file: g("#sFile"),
          detail: g("#sDetail"),
          date: new Date().toISOString().slice(0, 10),
        };
        if (payload.file && !/^https?:\/\//i.test(payload.file)) return tip("❌ 下载链接必须以 http(s):// 开头", false);

        const btn = body.querySelector("#sGo");
        btn.disabled = true;
        tip("提交中…", true);
        window.DSH_API.post("/api/works/submit", { data: payload })
          .then(() => {
            tip("✅ 投稿成功！等待站长审核，可在下方「我的投稿」查看进度", true);
            e.target.reset();
            loadMine();
          })
          ["catch"]((err) => {
            tip("❌ " + err.message + (err.message.indexOf("403") > -1 ? "（登录可能已过期，请退出重登）" : ""), false);
          })
          ["finally"](() => { btn.disabled = false; });
      });

      /* 我的投稿列表 */
      function loadMine() {
        const box = body.querySelector("#mineList");
        window.DSH_API.get("/api/works/mine")
          .then((res) => {
            const rows = res.data || [];
            if (!rows.length) {
              box.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:8px 0">还没有投稿记录</div>';
              return;
            }
            box.innerHTML = rows.map((w) => {
              const pending = w.status !== "已发布";
              return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;' +
                'padding:9px 4px;border-bottom:1px dashed rgba(128,128,128,.25);font-size:14px">' +
                '<span>' + esc(w.title || "") + '</span>' +
                '<span style="font-size:12px;white-space:nowrap;color:' + (pending ? '#eab308' : '#2f9e44') + '">' +
                  w.status + '</span></div>';
            }).join("");
          })
          ["catch"](() => {
            box.innerHTML = '<div style="color:#d02b20;font-size:13px;padding:8px 0">加载失败（登录可能过期，请重新登录）</div>';
          });
      }
      loadMine();
    },
  };

  registerSection(S);
})();
