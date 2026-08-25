/* ============================================================
 * 评论区组件：文章详情 / 作品详情 内嵌使用
 *
 * 用法（index.html 的 renderPost / renderWork 里）：
 *   <div id="cmtBox"></div> 放进详情 HTML；
 *   渲染后调用 window.DSH_COMMENTS.mount(容器, targetType, targetId)
 *
 * 后端：
 *   GET  /api/comments/list?targetType=&targetId=   公开读取
 *   POST /api/comments/submit {data:{...}}          登录用户发表
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

  window.DSH_COMMENTS = {
    mount(el, targetType, targetId) {
      if (!el) return;
      const me = window.DSH_AUTH && window.DSH_AUTH.user();
      const api = window.DSH_API;

      el.innerHTML =
        '<article class="post-detail" style="margin-top:16px;padding:22px 24px">' +
          '<h3 style="font-size:16px;margin-bottom:14px;padding-left:12px;border-left:3px solid var(--accent)">💬 评论区</h3>' +
          '<div class="cmtList" style="margin-bottom:14px"><div style="color:var(--muted);font-size:13px;padding:6px 0">评论加载中…</div></div>' +
          (me
            ? '<form class="cmtForm">' +
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

      function load() {
        api.get('/api/comments/list?targetType=' + targetType + '&targetId=' + targetId)
          .then((res) => {
            const rows = res.data || [];
            if (!rows.length) {
              listBox.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:6px 0">还没有评论，来抢沙发～</div>';
              return;
            }
            listBox.innerHTML = rows.map((r) =>
              '<div style="padding:10px 2px;border-bottom:1px dashed rgba(128,128,128,.25)">' +
                '<div style="display:flex;justify-content:space-between;font-size:13px">' +
                  '<b>👤 ' + esc(r.authorName) + '</b>' +
                  '<span style="color:var(--muted);font-size:12px">' + timeAgo(r.createdAt) + '</span>' +
                '</div>' +
                '<div style="margin-top:5px;line-height:1.7;font-size:14px">' + esc(r.content) + '</div>' +
              '</div>').join('');
          })
          ['catch'](() => {
            listBox.innerHTML = '<div style="color:#d02b20;font-size:13px;padding:6px 0">评论加载失败</div>';
          });
      }

      const form = el.querySelector('.cmtForm');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = el.querySelector('.cmtInput');
          const tipEl = el.querySelector('.cmtTip');
          const btn = el.querySelector('.cmtGo');
          const content = input.value.trim();
          if (!content) return;
          btn.disabled = true;
          tipEl.textContent = '发布中…';
          tipEl.style.color = 'var(--muted)';
          api.post('/api/comments/submit', {
            data: { targetType, targetId, content },
          })
            .then(() => {
              input.value = '';
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
