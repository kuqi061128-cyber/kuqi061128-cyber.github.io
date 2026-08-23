/* ============================================================
 * 插件：桌宠（屏幕浮动 · column: "float"）
 * 交互形式移植自 DSH 小鲸鱼挂件（dsh-whale-widget）：
 *   - 常驻屏幕角落，可任意拖拽，四边/四角自动吸附
 *   - 贴左边缘时整体水平镜像翻转（文字保持正向）
 *   - 按压 Q 弹（底部锚定）+ 按压/松手音效（缺失静默降级）
 *   - 单击 = 加权随机台词（气泡可关），首次点击给博客点赞
 *     · GIF 形象：台词写进 touch.gif 自带的气泡框
 *     · 其他形象：白色气泡，点气泡换一句
 *   - 聊天状态（回复图 + 放大）5 秒自动收起
 *   - 双击 = 跳转留言板
 *   - ☰ 菜单：大小 / 聊天放大 / 气泡开关 / 形象 / 音效 / 音量 / 音效组
 *   - 基础尺寸随浏览器窗口自适应，配置存在访客浏览器本地
 * 素材在本插件自己的文件夹 plugins/pet/ 里，换形象直接替换图片
 * ============================================================ */
(function () {
  const DIR = "plugins/pet/";
  /* 形象配置：idle=待机图 touch=被点击后的回复图 full=是否圆形照片框 */
  const BODY = {
    gif:    { idle: DIR + "idle.gif?v=2",  touch: DIR + "touch.gif?v=2", full: false, sayInPic: true },
    photo:  { idle: DIR + "body.jpg?v=2",  touch: DIR + "body.jpg?v=2",  full: true },
    whale:  { idle: DIR + "alt.png?v=2",   touch: DIR + "rua.gif?v=2",   full: false },
  };
  const BODY_KEYS = ["gif", "photo", "whale"];
  const SOUNDS = {
    duck: { press: DIR + "Ya1.mp3", release: DIR + "Ya2.mp3" },   // 小黄鸭
    fx1:  { press: DIR + "D1.mp3",  release: DIR + "D2.mp3" },    // 音效1
  };
  /* 台词与权重（数字越大越常出现） */
  const TALK = [
    ["摸摸我，给博客点个赞喵！", 3],
    ["今天也要元气满满喵～", 2],
    ["双击我可以去留言板抢沙发喵！", 2],
    ["把我拖到屏幕边角，我会自动贴边喵～", 2],
    ["点左上角的 ☰ 可以调我的大小和音效喵！", 2],
    ["博客又更新了好东西喵！", 2],
    ["拖到顶上我也能挂在天花板喵～", 1],
    ["谢谢你来看我们喵！", 1],
    ["喵呜～", 1],
  ];
  const GIF = DIR + "rua.gif?v=2";
  const CHAT_MS = 5000;   // 聊天状态持续时间（参照鲸鱼挂件：气泡 5 秒自动收起）

  /* touch.gif 画面里自带气泡框（像素实测：水平 6%~72%、垂直 8%~47%）
     台词文字写进气泡内部这个区域，缩放自动跟随；位置不合适时改这几个百分比即可 */
  const SAY = { left: "17%", top: "11%", width: "49%", height: "28%" };

  /* ---- 本地配置（含旧版 side 字段迁移） ---- */
  const cfg = Object.assign(
    { sideX: "right", sideY: "bottom", x: 24, y: 24, scale: 1, chatScale: 1.6,
      bubble: true, sound: true, vol: 0.5, set: "duck", body: "gif" },
    (function () { try { return JSON.parse(localStorage.getItem("dsh_pet") || "{}"); } catch (e) { return {}; } })()
  );
  if (cfg.side) { cfg.sideX = cfg.side; delete cfg.side; }   // 旧版只有左右
  function save() { try { localStorage.setItem("dsh_pet", JSON.stringify(cfg)); } catch (e) {} }

  function pickTalk() {
    const total = TALK.reduce(function (s, t) { return s + t[1]; }, 0);
    let r = Math.random() * total;
    for (const [text, w] of TALK) { if ((r -= w) < 0) return text; }
    return TALK[0][0];
  }

  /* ---- 音效（缺失静默降级） ---- */
  function play(kind) {
    if (!cfg.sound) return;
    try {
      const a = new Audio(SOUNDS[cfg.set][kind]);
      a.volume = cfg.vol;
      a.play().catch(function () {});
    } catch (e) {}
  }

  /* ---- 基础尺寸随窗口自适应（鲸鱼挂件同款行为） ---- */
  function baseSize() {
    return Math.round(Math.max(90, Math.min(140, Math.min(window.innerWidth, window.innerHeight) * 0.13)));
  }

  /* ---- 样式（一次性注入） ---- */
  let styleAdded = false;
  function ensureStyle() {
    if (styleAdded) return;
    styleAdded = true;
    const st = document.createElement("style");
    st.textContent =
      ".blog-pet{position:fixed;z-index:90;user-select:none;-webkit-user-select:none;" +
      "transition:left .3s ease,right .3s ease,top .3s ease,bottom .3s ease;touch-action:none}" +
      ".blog-pet.dragging{transition:none}" +
      ".bp-flipwrap{display:block}" +
      ".bp-flipwrap.flip{transform:scaleX(-1)}" +   /* 贴左边缘时镜像（台词文字另行保持正向） */
      /* 舞台：尺寸、浮动/Q弹/回弹动画都在这层，图片和气泡文字一起动，不会突兀 */
      ".bp-stage{position:relative;width:calc(var(--bp-base,120px)*var(--bp-scale,1));" +
      "height:calc(var(--bp-base,120px)*var(--bp-scale,1));transform-origin:50% 100%;" +
      "transition:transform .18s;animation:bpBob 3s ease-in-out infinite alternate}" +
      ".bp-body{width:100%;height:100%;display:block;cursor:grab}" +
      ".bp-body.img-full{border-radius:50%;border:3px solid rgba(56,189,248,.5);" +
      "background:rgba(15,23,42,.4);object-fit:cover}" +
      ".blog-pet.squish .bp-stage{transform:scaleY(.8) scaleX(1.14);animation:none}" +
      ".blog-pet.squish .bp-body{cursor:grabbing}" +
      ".blog-pet.pop .bp-stage{animation:bpPop .35s}" +
      "@keyframes bpBob{to{transform:translateY(-5px)}}" +
      "@keyframes bpPop{40%{transform:scaleY(1.15) scaleX(.92)}}" +
      ".bp-menu-btn{position:absolute;top:-6px;left:-6px;width:26px;height:26px;border-radius:50%;" +
      "background:var(--card,#1e293b);border:1px solid rgba(255,255,255,.15);color:#e2e8f0;" +
      "font-size:13px;line-height:24px;text-align:center;cursor:pointer;opacity:0;" +
      "transition:.2s;z-index:2;backdrop-filter:blur(4px)}" +
      ".blog-pet:hover .bp-menu-btn{opacity:1}" +
      ".bp-panel{position:absolute;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%) translateY(6px);" +
      "width:190px;background:rgba(30,41,59,.92);border:1px solid rgba(255,255,255,.15);border-radius:12px;" +
      "padding:12px 14px;font-size:12px;color:#e2e8f0;opacity:0;pointer-events:none;transition:.2s;" +
      "backdrop-filter:blur(8px);z-index:3;box-shadow:0 8px 24px rgba(0,0,0,.35)}" +
      ".bp-panel.open{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}" +
      ".bp-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}" +
      ".bp-row:last-child{margin-bottom:0}" +
      ".bp-row input[type=range]{width:100px;accent-color:#38bdf8}" +
      ".bp-row select,.bp-mini{background:rgba(15,23,42,.6);color:#e2e8f0;border:1px solid rgba(255,255,255,.15);" +
      "border-radius:6px;font-size:12px;padding:2px 6px;cursor:pointer}" +
      ".bp-bubble{position:absolute;bottom:calc(100% + 12px);left:50%;transform:translateX(-50%) scale(.8);" +
      "max-width:230px;background:#fff;color:#334155;border-radius:12px;padding:8px 14px;font-size:13px;" +
      "line-height:1.5;opacity:0;pointer-events:none;transition:.2s;z-index:2;cursor:pointer;" +
      "box-shadow:0 6px 18px rgba(0,0,0,.3)}" +
      ".bp-bubble.show{opacity:1;pointer-events:auto;transform:translateX(-50%) scale(1)}" +
      ".bp-bubble::after{content:'';position:absolute;top:100%;left:50%;margin-left:-6px;" +
      "border:6px solid transparent;border-top-color:#fff}" +
      ".bp-bubble img{display:block;max-width:180px;border-radius:8px;margin-top:6px}" +
      ".bp-say{position:absolute;display:flex;align-items:center;justify-content:center;" +
      "text-align:center;font-weight:700;color:#4a3728;line-height:1.3;" +
      "font-size:calc(9px*var(--bp-scale,1));pointer-events:none;opacity:0;transition:.15s;z-index:2;" +
      "word-break:break-all}" +
      ".bp-say.show{opacity:1}";
    document.head.appendChild(st);
  }

  let bubbleTimer = null;
  let touchTimer = null;

  function showBubble(el, html) {
    const b = el.querySelector('[data-role="bubble"]');
    b.innerHTML = html;
    b.classList.add("show");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { b.classList.remove("show"); }, 5000);
  }
  function hideBubble(el) {
    clearTimeout(bubbleTimer);
    el.querySelector('[data-role="bubble"]').classList.remove("show");
  }

  function bodyDef() { return BODY[cfg.body] || BODY.gif; }

  /* 被点击：切换到回复图并按 chatScale 放大，CHAT_MS 后自动收起（文字、大小一并还原） */
  function playTouch(el) {
    const img = el.querySelector(".bp-body");
    const b = bodyDef();
    if (!img || b.touch === b.idle) return;
    img.src = b.touch;
    el.style.setProperty("--bp-scale", cfg.scale * (cfg.chatScale || 1));
    clearTimeout(touchTimer);
    touchTimer = setTimeout(function () {
      img.src = b.idle;
      el.style.setProperty("--bp-scale", cfg.scale);
      const say = el.querySelector('[data-role="say"]');
      if (say) { say.classList.remove("show"); say.textContent = ""; }
    }, CHAT_MS);
  }

  /* 四边 + 四角吸附定位（鲸鱼挂件同款），并处理镜像与台词文字换边 */
  function applyPos(el) {
    el.style.top = cfg.sideY === "top" ? cfg.y + "px" : "auto";
    el.style.bottom = cfg.sideY === "top" ? "auto" : cfg.y + "px";
    el.style.left = cfg.sideX === "left" ? cfg.x + "px" : "auto";
    el.style.right = cfg.sideX === "left" ? "auto" : cfg.x + "px";
    const flip = cfg.sideX === "left";
    const wrap = el.querySelector(".bp-flipwrap");
    if (wrap) wrap.classList.toggle("flip", flip);
    const say = el.querySelector('[data-role="say"]');
    if (say) {   /* 图片镜像后气泡跑到图右侧：文字区同步换到右边缘，保持落在气泡里 */
      say.style.left = flip ? "auto" : SAY.left;
      say.style.right = flip ? SAY.left : "auto";
    }
  }

  function applyCfg(el) {
    el.style.setProperty("--bp-base", baseSize() + "px");
    el.style.setProperty("--bp-scale", cfg.scale);
    const img = el.querySelector(".bp-body");
    if (img) {
      const b = bodyDef();
      img.src = b.idle;
      img.classList.toggle("img-full", b.full);
    }
  }

  const P = {
    id: "pet",
    column: "float",
    order: 90,
    enabled: true,

    render(el, ctx) {
      ensureStyle();
      el.innerHTML =
        '<div class="bp-menu-btn" data-act="menu" title="设置">☰</div>' +
        '<div class="bp-stage">' +
          '<div class="bp-flipwrap"><img class="bp-body" draggable="false" alt="桌宠"></div>' +
          '<div class="bp-say" data-role="say" style="left:' + SAY.left + ';top:' + SAY.top + ';width:' + SAY.width + ';height:' + SAY.height + '"></div>' +
        '</div>' +
        '<div class="bp-bubble" data-role="bubble"></div>' +
        '<div class="bp-panel" data-role="panel">' +
          '<div class="bp-row"><span>大小</span><input type="range" min="0.6" max="2" step="0.05" value="' + cfg.scale + '" data-cfg="scale"></div>' +
          '<div class="bp-row"><span>聊天放大</span><input type="range" min="1" max="3" step="0.1" value="' + (cfg.chatScale || 1.6) + '" data-cfg="chatScale"></div>' +
          '<div class="bp-row"><span>气泡</span><input type="checkbox"' + (cfg.bubble ? " checked" : "") + ' data-cfg="bubble"></div>' +
          '<div class="bp-row"><span>形象</span><button class="bp-mini" data-act="body">切换形象</button></div>' +
          '<div class="bp-row"><span>音效</span><input type="checkbox"' + (cfg.sound ? " checked" : "") + ' data-cfg="sound"></div>' +
          '<div class="bp-row"><span>音量</span><input type="range" min="0" max="1" step="0.05" value="' + cfg.vol + '" data-cfg="vol"></div>' +
          '<div class="bp-row"><span>音效组</span><select data-cfg="set">' +
            '<option value="duck"' + (cfg.set === "duck" ? " selected" : "") + '>小黄鸭</option>' +
            '<option value="fx1"' + (cfg.set === "fx1" ? " selected" : "") + '>音效1</option>' +
          '</select></div>' +
        '</div>';
      applyCfg(el);
      applyPos(el);
    },

    init(el, ctx) {
      /* 窗口尺寸变化时重算基础尺寸 */
      window.addEventListener("resize", function () {
        el.style.setProperty("--bp-base", baseSize() + "px");
      });

      /* ---- 拖拽 + 按压 + 点击 ---- */
      let drag = null;
      el.addEventListener("pointerdown", function (e) {
        if (e.target.closest(".bp-panel") || e.target.closest(".bp-menu-btn") ||
            e.target.closest(".bp-bubble")) return;
        drag = { lastX: e.clientX, lastY: e.clientY, moved: false };
        el.classList.add("squish");
        play("press");
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        e.preventDefault();
      });
      el.addEventListener("pointermove", function (e) {
        if (!drag) return;
        const dx = e.clientX - drag.lastX, dy = e.clientY - drag.lastY;
        drag.lastX = e.clientX; drag.lastY = e.clientY;
        if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
        drag.moved = true;
        el.classList.add("dragging");
        const r = el.getBoundingClientRect();
        el.style.right = el.style.bottom = el.style.top = el.style.left = "auto";
        const nx = Math.max(0, Math.min(window.innerWidth - r.width, r.left + dx));
        const ny = Math.max(0, Math.min(window.innerHeight - r.height, r.top + dy));
        el.style.left = nx + "px";
        el.style.top = ny + "px";
      });
      el.addEventListener("pointerup", function () {
        if (!drag) return;
        el.classList.remove("squish");
        play("release");
        if (drag.moved) {
          /* 四边四角吸附：离哪条边近贴哪条，两条都近就进角落 */
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const d = [
            ["left", cx], ["right", window.innerWidth - cx],
            ["top", cy], ["bottom", window.innerHeight - cy],
          ].sort(function (a, b) { return a[1] - b[1]; });
          const snap = new Set([d[0][0]]);
          if (d[1][1] < 140) snap.add(d[1][0]);   // 第二近的边也够近 → 角落组合
          cfg.sideX = snap.has("left") ? "left" : "right";
          cfg.sideY = snap.has("top") ? "top" : "bottom";
          cfg.x = 24;
          cfg.y = snap.has("top")
            ? Math.max(12, Math.round(r.top))
            : Math.max(12, Math.round(window.innerHeight - r.bottom));
          el.classList.remove("dragging");
          applyPos(el);
          save();
        } else {
          /* 单击 = 点赞（首次）+ 回复动画 + 加权随机台词 */
          el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
          const b = bodyDef();
          let line = null;
          if (!ctx.state.liked) {
            ctx.state.likes += 1; ctx.state.liked = true;
            ctx.storeSet("dsh_likes", ctx.state.likes);
            ctx.storeSet("dsh_liked", true);
            ctx.refreshPlugins();
            ctx.toast("摸摸成功，感谢点赞 ❤️");
            line = "谢谢摸摸！已给博客点赞 ❤️";
          }
          if (!cfg.bubble) { drag = null; return; }   // 气泡关闭：只 Q 弹 + 音效 + 点赞
          playTouch(el);
          const text = line || pickTalk();
          const say = el.querySelector('[data-role="say"]');
          if (b.sayInPic && say) {
            /* GIF 自带气泡框：台词写进图片气泡里，聊天期间每点一次直接换一句 */
            hideBubble(el);
            say.textContent = text;
            say.classList.add("show");
          } else {
            const bubble = el.querySelector('[data-role="bubble"]');
            if (bubble.classList.contains("show")) { hideBubble(el); }
            else if (!line && Math.random() < 0.18) {
              showBubble(el, 'Rua——！<img src="' + GIF + '" alt="rua">');
            } else {
              showBubble(el, text);
            }
          }
        }
        drag = null;
      });
      /* 双击 = 去留言板 */
      el.addEventListener("dblclick", function () {
        hideBubble(el);
        ctx.toast("带你去留言板喵～");
        window.location.hash = "#/board";
      });

      /* ---- 菜单与设置 ---- */
      el.addEventListener("click", function (e) {
        if (e.target.closest('[data-act="menu"]')) {
          el.querySelector('[data-role="panel"]').classList.toggle("open");
        } else if (e.target.closest('[data-act="body"]')) {
          const cur = BODY[cfg.body] ? cfg.body : "gif";
          cfg.body = BODY_KEYS[(BODY_KEYS.indexOf(cur) + 1) % BODY_KEYS.length];
          clearTimeout(touchTimer);
          applyCfg(el); save();
        } else if (e.target.closest(".bp-bubble")) {
          showBubble(el, pickTalk());   // 点白色气泡：换一句
        }
      });
      el.addEventListener("input", function (e) {
        const k = e.target.getAttribute("data-cfg");
        if (!k) return;
        const t = e.target.type;
        cfg[k] = t === "checkbox" ? e.target.checked : (t === "range" ? Number(e.target.value) : e.target.value);
        if (k === "scale" || k === "body") applyCfg(el);
        if (k === "chatScale" && touchTimer) el.style.setProperty("--bp-scale", cfg.scale * cfg.chatScale);
        if (k === "bubble" && !cfg.bubble) {
          hideBubble(el);
          const say = el.querySelector('[data-role="say"]');
          if (say) { say.classList.remove("show"); say.textContent = ""; }
        }
        save();
        if (k === "vol" || k === "set") play("release");
      });
    },
  };

  registerPlugin(P);
})();
