/* ============================================================
 * 评论区组件：文章详情 / 作品详情 内嵌使用
 *
 * 用法（index.html 的 renderPost / renderWork 里）：
 *   <div id="cmtBox"></div> 放进详情 HTML；
 *   渲染后调用 window.DSH_COMMENTS.mount(容器, targetType, targetId)
 *
 * 后端：
 *   GET  /api/comments/list?targetType=&targetId=   公开读取（含 parentId）
 *   POST /api/comments/submit {data:{...}}          登录用户发表
 *        parentId>0 表示回复某条评论（服务端校验必须在同一条内容下）
 *
 * 回复展示（2026-09-13 新增）：
 *   数据层支持任意层级，展示层统一压成**一层缩进**（类似微博/知乎）：
 *   回复的回复归到同一条顶级评论下，并标注「回复 @某人」。
 * ============================================================ */
(function () {

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function timeAgo(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  let styleAdded = false;
  function ensureStyle() {
    if (styleAdded) return;
    styleAdded = true;
    const st = document.createElement('style');
    st.textContent =
      '.cmt-item{padding:10px 2px;border-bottom:1px dashed rgba(128,128,128,.25)}' +
      '.cmt-head{display:flex;justify-content:space-between;font-size:13px;gap:10px}' +
      '.cmt-body{margin-top:5px;line-height:1.7;font-size:14px}' +
      '.cmt-act{margin-top:5px}' +
      '.cmt-reply-btn{background:none;border:0;color:var(--muted);cursor:pointer;font-size:12px;padding:0}' +
      '.cmt-reply-btn:hover{color:var(--accent)}' +
      '.cmt-kids{margin-top:4px;padding-left:12px;border-left:2px solid rgba(56,189,248,.25)}' +
      '.cmt-kids .cmt-item{border-bottom:none;padding:8px 2px 2px}' +
      '.cmt-at{color:var(--accent);font-size:12px;margin-top:2px}' +
      '.cmt-reply-hint{margin-top:8px;font-size:13px;color:var(--muted)}' +
      '.cmt-reply-hint b{color:var(--accent)}' +
      '.cmt-cancel{background:none;border:0;color:var(--muted);cursor:pointer;font-size:12px;text-decoration:underline}' +
      '.load-reply{background:none;border:0;color:var(--accent);cursor:pointer;font-size:12px;padding:0;margin-left:6px}';
    document.head.appendChild(st);
  }

  window.DSH_COMMENTS = {
    mount(el, targetType, targetId) {
      if (!el) return;
      ensureStyle();
      const me = window.DSH_AUTH && window.DSH_AUTH.user();
      const api = window.DSH_API;

      el.innerHTML =
        '<article class="post-detail" style="margin-top:16px;padding:22px 24px">' +
          '<h3 style="font-size:16px;margin-bottom:14px;padding-left:12px;border-left:3px solid var(--accent)">💬 评论区</h3>' +
          '<div class="cmtList" style="margin-bottom:14px"><div style="color:var(--muted);font-size:13px;padding:6px 0">评论加载中…</div></div>' +
          (me
            ? '<form class="cmtForm">' +
                '<div class="cmt-reply-hint" style="display:none"></div>' +
                '<textarea class="cmtInput" required maxlength="1000" placeholder="写下你的评论…（≤1000字）" ' +
                  'style="width:100%;min-height:70px;padding:10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;resize:vertical"></textarea>' +
                '<button type="submit" class="cmtGo" style="margin-top:8px;padding:8px 26px;border:0;border-radius:999px;' +
                  'background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:14px;cursor:pointer">发 表 评 论</button>' +
                '<span class="cmtTip" style="margin-left:10px;font-size:13px;color:var(--muted)"></span>' +
              '</form>'
            : '<div style="font-size:13px;color:var(--muted);padding:6px 0">' +
              '🔒 <a href="#/account" style="color:var(--accent)">注册登录</a> 后才能在这条内容下评论' +
              '</div>') +
        '</article>';

      const listBox = el.querySelector('.cmtList');
      const form = el.querySelector('.cmtForm');
      const hint = form && form.querySelector('.cmt-reply-hint');
      const input = form && form.querySelector('.cmtInput');
      const tipEl = form && form.querySelector('.cmtTip');
      let rows = [];
      let replyTo = null;    // 当前正在回复的评论对象
      let shown = 0;         // 顶级评论已展示条数（折叠用）
      const PAGE = 20;

      /* 数据可以是任意层级，展示时统一归到顶级祖先下（只缩进一层） */
      function buildTree(all) {
        const byId = {};
        all.forEach(r => { byId[r.id] = r; });
        const rootOf = (r) => {
          let cur = r, guard = 0;
          while (cur && (cur.parentId || 0) > 0 && byId[cur.parentId] && guard++ < 50) {
            cur = byId[cur.parentId];
          }
          return cur ? cur.id : r.id;
        };
        const kids = {};
        all.forEach(r => {
          if (!(r.parentId || 0)) return;
          const root = rootOf(r);
          if (root === r.id) return;                  // 忽略自引用等异常数据
          (kids[root] = kids[root] || []).push(r);
        });
        return { tops: all.filter(r => !(r.parentId || 0)), kids: kids, byId: byId };
      }

      function replyButton(r) {
        if (!me) return '';
        return '<div class="cmt-act"><button type="button" class="cmt-reply-btn" data-reply="' +
          r.id + '">回复</button></div>';
      }

      function itemHtml(r, byId, isKid) {
        const atName = (r.parentId && byId[r.parentId]) ? byId[r.parentId].authorName : '';
        return '<div class="cmt-item" data-cid="' + r.id + '">' +
          '<div class="cmt-head"><b>👤 ' + esc(r.authorName) + '</b>' +
            '<span style="color:var(--muted);font-size:12px">' + timeAgo(r.createdAt) + '</span></div>' +
          (isKid && atName ? '<div class="cmt-at">回复 @' + esc(atName) + '</div>' : '') +
          '<div class="cmt-body">' + esc(r.content) + '</div>' +
          replyButton(r) +
          '</div>';
      }

      function paint() {
        if (!rows.length) {
          listBox.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:6px 0">还没有评论，来抢沙发～</div>';
          return;
        }
        const t = buildTree(rows);
        const tops = t.tops.slice().sort((a, b) =>
          String(a.createdAt).localeCompare(String(b.createdAt)));
        const show = tops.slice(0, shown);
        listBox.innerHTML = show.map(r => {
          const kids = (t.kids[r.id] || []).slice().sort((a, b) =>
            String(a.createdAt).localeCompare(String(b.createdAt)));
          return itemHtml(r, t.byId, false) +
            (kids.length ? '<div class="cmt-kids">' +
              kids.map(k => itemHtml(k, t.byId, true)).join('') + '</div>' : '');
        }).join('') +
        (tops.length > shown
          ? '<div style="text-align:center;padding:10px 0"><button type="button" class="load-reply" ' +
            'style="font-size:13px">展开更早的评论（还有 ' + (tops.length - shown) + ' 条）</button></div>'
          : '');
      }

      function load() {
        api.get('/api/comments/list?targetType=' + targetType + '&targetId=' + targetId)
          .then((res) => {
            rows = res.data || [];
            const topCount = rows.filter(r => !(r.parentId || 0)).length;
            shown = Math.min(topCount, PAGE);
            paint();
          })
          ['catch'](() => {
            listBox.innerHTML = '<div style="color:#d02b20;font-size:13px;padding:6px 0">评论加载失败</div>';
          });
      }

      function clearReply() {
        replyTo = null;
        if (hint) { hint.style.display = 'none'; hint.innerHTML = ''; }
        if (input) input.placeholder = '写下你的评论…（≤1000字）';
      }

      /* 事件委托挂在整块评论容器上：回复按钮在列表里、取消按钮在表单里，
         两者都要能点到（此前漏了取消按钮导致回复态清不掉） */
      el.addEventListener('click', (e) => {
        if (e.target.closest('.cmt-cancel')) { clearReply(); return; }
        const more = e.target.closest('.load-reply');
        if (more) {
          const topCount = rows.filter(r => !(r.parentId || 0)).length;
          shown = Math.min(topCount, shown + PAGE);
          paint();
          return;
        }
        const btn = e.target.closest('[data-reply]');
        if (!btn || !form) return;
        const row = rows.find(r => r.id === Number(btn.dataset.reply));
        if (!row) return;
        replyTo = row;
        hint.style.display = '';
        hint.innerHTML = '正在回复 <b>@' + esc(row.authorName) + '</b>：' +
          '<button type="button" class="cmt-cancel">取消</button>';
        input.placeholder = '回复 @' + row.authorName + '…';
        input.focus();
      });

      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const btn = el.querySelector('.cmtGo');
          const content = input.value.trim();
          if (!content) return;
          btn.disabled = true;
          tipEl.textContent = '发布中…';
          tipEl.style.color = 'var(--muted)';
          const payload = { targetType, targetId, content };
          if (replyTo) payload.parentId = replyTo.id;   // 回复：带上被回复评论 id
          api.post('/api/comments/submit', { data: payload })
            .then(() => {
              input.value = '';
              clearReply();
              tipEl.textContent = '✅ 已发布';
              tipEl.style.color = '#2f9e44';
              load();
            })
            ['catch']((err) => {
              const m = err.message || '';
              tipEl.textContent = m.indexOf('429') > -1 ? '❌ 操作太频繁，等一分钟再试'
                : m.indexOf('403') > -1 || m.indexOf('401') > -1 ? '❌ 登录已过期，请重新登录'
                : '❌ ' + m;
              tipEl.style.color = '#d02b20';
            })
            ['finally'](() => { btn.disabled = false; });
        });
      }

      load();
    },
  };
})();
