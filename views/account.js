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
            /* 注意：邮箱框不能带 required——隐藏必填字段会静默拦截表单提交；
               切到注册模式时由 JS 动态设置 required */
            '<input id="fMail" type="email" placeholder="邮箱 *" style="display:none;width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;margin-bottom:10px">' +
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

      const mailInput = body.querySelector("#fMail");
      body.querySelector("#tabLogin").addEventListener("click", () => {
        mode = "login";
        mailInput.style.display = "none";
        mailInput.required = false;   // 隐藏字段绝不能带 required（会静默拦截提交）
        body.querySelector("#fGo").textContent = "登 录";
      });
      body.querySelector("#tabReg").addEventListener("click", () => {
        mode = "register";
        mailInput.style.display = "block";
        mailInput.required = true;
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
        })["catch"]((err) => {
          const m = err.message || "";
          let msg;
          if (m.indexOf("Invalid identifier or password") > -1) {
            msg = mode === "login"
              ? "❌ 账号或密码不对（密码至少6位，注意大小写）"
              : "❌ 注册似乎成功了但自动登录失败，请手动登录一次";
          } else if (m.indexOf("429") > -1) {
            msg = "❌ 操作太频繁啦，请等一分钟再试";
          } else if (m.indexOf("taken") > -1 || m.indexOf("Username") > -1 || m.indexOf("Email") > -1) {
            msg = "❌ 用户名或邮箱已被注册，换一个试试";
          } else if (m.indexOf("password") > -1 && mode === "register") {
            msg = "❌ 密码至少需要 6 位";
          } else {
            msg = "❌ " + m;
          }
          tip(msg, false);
        });
      });
    },

    /* ============ 已登录：账号卡 + 投稿(作品/文章) + 我的列表 ============ */
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

          /* 修改密码（折叠面板） */
          '<details style="margin-top:16px">' +
            '<summary style="cursor:pointer;font-size:14px;color:var(--accent);user-select:none">🔑 修改密码</summary>' +
            '<form id="pwForm" style="margin-top:12px">' +
              '<input id="pCur" type="password" placeholder="当前密码 *" required autocomplete="current-password" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;margin-bottom:10px">' +
              '<input id="pNew" type="password" placeholder="新密码 *（至少6位）" required minlength="6" autocomplete="new-password" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;margin-bottom:10px">' +
              '<input id="pNew2" type="password" placeholder="确认新密码 *" required minlength="6" autocomplete="new-password" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;margin-bottom:10px">' +
              '<button type="submit" id="pGo" style="width:100%;padding:9px;border:1px solid rgba(56,189,248,.35);border-radius:8px;' +
                'background:transparent;color:var(--accent);font-size:14px;cursor:pointer">更 新 密 码</button>' +
              '<div id="pTip" style="margin-top:8px;font-size:13px;text-align:center;min-height:18px;color:var(--muted)"></div>' +
            '</form>' +
          '</details>' +

          /* 投稿类型切换 + 表单 */
          '<h3 style="margin:22px 0 10px;padding-left:12px;border-left:3px solid var(--accent);font-size:16px">✍️ 我要投稿</h3>' +
          '<p style="font-size:13px;color:var(--muted);margin-bottom:12px">提交后进入待审核，站长确认后会在对应栏目展示。</p>' +
          '<div style="display:flex;gap:8px;margin-bottom:12px">' +
            '<button id="tabWork" class="chip" style="cursor:pointer;border:0">🚀 投稿作品</button>' +
            '<button id="tabPost" class="chip" style="cursor:pointer;border:0;background:transparent;color:var(--accent);border:1px solid rgba(56,189,248,.25)">📝 投稿文章</button>' +
          '</div>' +
          '<form id="subForm">' +
            '<div id="workFields">' +
              '<input id="sDesc" placeholder="一句话简介" maxlength="120" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;margin-bottom:10px">' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">' +
                '<input id="sTag" placeholder="分类标签，如 工具" maxlength="12" style="flex:1;min-width:110px;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit">' +
                '<input id="sVer" placeholder="版本号，如 v1.0" maxlength="20" style="flex:1;min-width:110px;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit">' +
                '<input id="sSize" placeholder="大小，如 12MB" maxlength="20" style="flex:1;min-width:110px;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit">' +
              '</div>' +
              '<input id="sFile" placeholder="下载链接（http(s):// 开头，可留空）" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;margin-bottom:10px">' +
            '</div>' +
            '<div id="postFields" style="display:none">' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">' +
                '<input id="pCat" placeholder="分类，如 教程 / 随笔" maxlength="20" style="flex:1;min-width:110px;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit">' +
                '<input id="pTags" placeholder="标签，逗号分隔，如 教程,前端" maxlength="60" style="flex:2;min-width:160px;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit">' +
              '</div>' +
              '<textarea id="pSummary" placeholder="摘要（一两句话，展示在列表卡片上）" maxlength="200" style="width:100%;min-height:54px;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;resize:vertical;margin-bottom:10px"></textarea>' +
              '<textarea id="pContent" placeholder="正文（支持 HTML：<p>段落</p>、<h3>小标题</h3>、<img src=图片地址> 等）*" style="width:100%;min-height:140px;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;resize:vertical"></textarea>' +
            '</div>' +
            '<input id="sTitle" placeholder="标题 *" required maxlength="60" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;margin-bottom:10px">' +
            '<button type="submit" id="sGo" style="width:100%;padding:11px;border:0;border-radius:8px;' +
              'background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:15px;cursor:pointer">提 交 投 稿</button>' +
            '<div id="sTip" style="margin-top:8px;font-size:13px;text-align:center;min-height:18px;color:var(--muted)"></div>' +
          '</form>' +

          /* 我的投稿 */
          '<h3 style="margin:22px 0 10px;padding-left:12px;border-left:3px solid var(--accent);font-size:16px">📋 我的投稿</h3>' +
          '<div id="mineList"><div style="color:var(--muted);font-size:13px;padding:8px 0">加载中…</div></div>' +

          /* 我的评论 */
          '<h3 style="margin:22px 0 10px;padding-left:12px;border-left:3px solid var(--accent);font-size:16px">💬 我的评论</h3>' +
          '<p style="font-size:13px;color:var(--muted);margin-bottom:8px">你在文章/作品/留言板的全部发言，可在此删除。</p>' +
          '<div id="myCmts"><div style="color:var(--muted);font-size:13px;padding:8px 0">加载中…</div></div>' +
        '</article>';

      const g = (sel) => body.querySelector(sel);

      /* 退出 */
      g("#btnOut").addEventListener("click", () => {
        window.DSH_AUTH.logout();
        location.reload();
      });

      /* 修改密码 */
      const tipP = (t, ok) => {
        const n = g("#pTip");
        n.textContent = t;
        n.style.color = ok ? "#2f9e44" : "#d02b20";
      };
      g("#pwForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const cur = g("#pCur").value;
        const n1 = g("#pNew").value;
        const n2 = g("#pNew2").value;
        if (n1.length < 6) return tipP("❌ 新密码至少 6 位", false);
        if (n1 !== n2) return tipP("❌ 两次输入的新密码不一致", false);
        if (n1 === cur) return tipP("❌ 新密码不能和当前密码相同", false);

        const btn = g("#pGo");
        btn.disabled = true;
        tipP("更新中…", true);
        window.DSH_API.post("/api/auth/change-password", {
          currentPassword: cur,
          password: n1,
          passwordConfirmation: n2,
        })
          .then((res) => {
            // 接口返回新令牌，顺手续期本地登录态
            if (res.jwt || res.token) window.DSH_AUTH.save(res.jwt || res.token, res.user || me);
            tipP("✅ 密码已更新，下次登录请使用新密码", true);
            e.target.reset();
          })
          ["catch"]((err) => {
            const m = err.message || "";
            if (m.indexOf("currentPassword") > -1 || m.indexOf("Invalid") > -1) tipP("❌ 当前密码不对", false);
            else if (m.indexOf("429") > -1) tipP("❌ 操作太频繁啦，请等一分钟再试", false);
            else tipP("❌ " + m, false);
          })
          ["finally"](() => { btn.disabled = false; });
      });

      /* 投稿类型切换 */
      let subKind = "work";
      function setKind(k) {
        subKind = k;
        const onWork = k === "work";
        g("#workFields").style.display = onWork ? "" : "none";
        g("#postFields").style.display = onWork ? "none" : "";
        const tOn = 'cursor:pointer;border:0', tOff = 'cursor:pointer;border:0;background:transparent;color:var(--accent);border:1px solid rgba(56,189,248,.25)';
        g("#tabWork").style.cssText = onWork ? tOn : tOff;
        g("#tabPost").style.cssText = onWork ? tOff : tOn;
      }
      g("#tabWork").addEventListener("click", () => setKind("work"));
      g("#tabPost").addEventListener("click", () => setKind("post"));

      const tip = (t, ok) => {
        const n = g("#sTip");
        n.textContent = t;
        n.style.color = ok ? "#2f9e44" : "#d02b20";
      };

      /* 提交 */
      g("#subForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const api = window.DSH_API;
        const title = g("#sTitle").value.trim();
        if (!title) return tip("❌ 标题必填", false);
        const btn = g("#sGo");
        btn.disabled = true;

        let req;
        if (subKind === "work") {
          req = api.post("/api/works/submit", { data: {
            title,
            desc: g("#sDesc").value.trim(),
            tag: g("#sTag").value.trim() || "待分类",
            version: g("#sVer").value.trim(),
            size: g("#sSize").value.trim(),
            file: g("#sFile").value.trim(),
            date: new Date().toISOString().slice(0, 10),
          }});
        } else {
          req = api.post("/api/posts/submit", { data: {
            title,
            category: g("#pCat").value.trim() || "投稿",
            tags: g("#pTags").value.trim(),
            summary: g("#pSummary").value.trim(),
            contentHtml: g("#pContent").value,
            date: new Date().toISOString().slice(0, 10),
          }});
        }

        tip("提交中…", true);
        req.then(() => {
          tip(subKind === "work" ? "✅ 作品投稿成功！等待审核，进度见下方列表" : "✅ 文章投稿成功！等待审核，进度见下方列表", true);
          g("#sTitle").value = "";
          e.target.querySelectorAll("textarea,input[placeholder*='简介'],input[placeholder*='摘要']").forEach(n => n.value = "");
          loadMine();
        })["catch"]((err) => {
          const m = err.message || "";
          if (m.indexOf("429") > -1) return tip("❌ 操作太频繁啦，请等一分钟再试", false);
          if (m.indexOf("403") > -1) return tip("❌ 登录可能已过期，请退出后重新登录", false);
          tip("❌ " + m, false);
        })["finally"](() => { btn.disabled = false; });
      });

      /* 我的投稿列表（作品+文章合并） */
      function loadMine() {
        const box = g("#mineList");
        const auth = { Authorization: "Bearer " + window.DSH_AUTH.token() };
        Promise.all([
          window.DSH_API.get("/api/works/mine").then(r => (r.data || []).map(w => ({ ...w, kind: "🚀 作品" })))["catch"](() => []),
          window.DSH_API.get("/api/posts/mine").then(r => (r.data || []).map(p => ({ ...p, kind: "📝 文章" })))["catch"](() => []),
        ]).then(([works, posts]) => {
          const rows = works.concat(posts);
          if (!rows.length) {
            box.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:8px 0">还没有投稿记录</div>';
            return;
          }
          box.innerHTML = rows.map((w) => {
            const pending = w.status !== "已发布";
            return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;' +
              'padding:9px 4px;border-bottom:1px dashed rgba(128,128,128,.25);font-size:14px">' +
              '<span>' + w.kind + ' · ' + esc(w.title || "") + '</span>' +
              '<span style="font-size:12px;white-space:nowrap;color:' + (pending ? '#eab308' : '#2f9e44') + '">' +
                w.status + '</span></div>';
          }).join("");
        });
      }
      loadMine();

      /* 我的评论（文章/作品评论 + 留言板），可删除 */
      function loadMyCmts() {
        const box = g("#myCmts");
        Promise.all([
          window.DSH_API.get("/api/comments/mine")["catch"](() => null),
          window.DSH_API.get("/api/messages/mine")["catch"](() => null),
        ]).then(([cmts, msgs]) => {
          const rows = [
            ...(((cmts && cmts.data) || []).map(c => ({ src: "comment", id: c.id, location: c.location, text: c.content, at: c.createdAt }))),
            ...(((msgs && msgs.data) || []).map(m => ({ src: "message", id: m.id, location: m.location || "💬 留言板", text: m.content, at: m.createdAt }))),
          ];
          if (!rows.length) {
            box.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:8px 0">还没有发表过评论或留言</div>';
            return;
          }
          box.innerHTML = rows.map((r) =>
            '<div class="myCmtRow" data-src="' + r.src + '" data-id="' + r.id + '" ' +
              'style="padding:10px 4px;border-bottom:1px dashed rgba(128,128,128,.25)">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:13px">' +
                '<span style="color:var(--accent)">' + esc(r.location) + '</span>' +
                '<button class="cmtDel" style="flex:none;font-size:12px;padding:3px 12px;border:1px solid var(--line);' +
                  'border-radius:999px;background:transparent;color:#d02b20;cursor:pointer">删除</button>' +
              '</div>' +
              '<div style="margin-top:4px;line-height:1.7;font-size:14px">' + esc(r.text) + '</div>' +
              '<div style="margin-top:3px;font-size:12px;color:var(--muted)">' + esc((r.at || "").slice(0, 16).replace("T", " ")) + '</div>' +
            '</div>').join("");
        });
      }
      loadMyCmts();

      /* 删除按钮事件委托 */
      g("#myCmts").addEventListener("click", (e) => {
        const btn = e.target.closest(".cmtDel");
        if (!btn) return;
        const row = btn.closest(".myCmtRow");
        const src = row.dataset.src;
        const id = Number(row.dataset.id);
        if (!confirm("确定删除这条" + (src === "comment" ? "评论" : "留言") + "吗？删除后不可恢复。")) return;
        btn.disabled = true;
        btn.textContent = "删除中…";
        window.DSH_API.post(src === "comment" ? "/api/comments/remove" : "/api/messages/remove", { data: { id } })
          .then(() => loadMyCmts())
          ["catch"](() => { btn.disabled = false; btn.textContent = "删除"; alert("删除失败，请稍后再试"); });
      });
    },
  };

  registerSection(S);
})();
