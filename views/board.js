/* ============================================================
 * 分区模块：留言板
 * 整个留言板（表单 + 列表 + 提交逻辑）都在本文件，更新无需动 index.html
 *
 * 说明：访客的留言保存在其浏览器本地（localStorage），
 * 下面的种子留言只在访客第一次打开、还没有任何留言时显示。
 * ============================================================ */

/* 种子留言：新访客看到的初始留言（改这里即可换初始内容） */
window.BLOG_BOARD_SEEDS = [
  
];

(function () {
  const AVATAR_COLORS = ["#38bdf8", "#818cf8", "#f472b6", "#34d399", "#fbbf24", "#f87171"];

  function msgListHtml(ctx) {
    const list = ctx.state.messages;
    return list.length
      ? list.map((m, i) => {
          const color = AVATAR_COLORS[(m.name.charCodeAt(0) + i) % AVATAR_COLORS.length];
          return '<div class="msg-item">' +
            '<div class="msg-avatar" style="background:' + color + '">' + ctx.esc((m.name || "客")[0]) + '</div>' +
            '<div class="msg-bubble"><div class="msg-head"><span class="msg-name">' + ctx.esc(m.name) + '</span>' +
            '<span class="msg-time">' + ctx.esc(m.time) + '</span></div>' +
            '<div class="msg-text">' + ctx.esc(m.text) + '</div></div></div>';
        }).join("")
      : '<div class="empty">还没有留言，来抢个沙发吧～</div>';
  }

  const S = {
    id: "board",       // 路由地址：#/board
    label: "留言板",    // 顶部导航标签文字
    order: 40,         // 排在导航里的位置（内置分区：首页10/文章20/作品30）

    render(el, ctx) {
      el.innerHTML =
        '<div class="view-head"><h2 class="view-title">💬 留言板</h2></div>' +
        '<div class="board-form">' +
        '<input id="boardName" placeholder="你的昵称（可留空）" maxlength="12">' +
        '<textarea id="boardText" placeholder="随便说点什么，留言会保存在浏览器本地…" maxlength="200"></textarea>' +
        '<button class="btn btn-primary" id="boardSubmit">发表留言</button></div>' +
        '<div id="msgListBox">' + msgListHtml(ctx) + '</div>';

      el.querySelector("#boardSubmit").addEventListener("click", function () {
        const text = el.querySelector("#boardText").value.trim();
        if (!text) { ctx.toast("留言内容不能为空"); return; }
        const name = el.querySelector("#boardName").value.trim() || "游客";
        ctx.state.messages.unshift({ name: name, time: ctx.fmtNow(), text: text });
        ctx.storeSet("dsh_msgs", ctx.state.messages);
        el.querySelector("#boardText").value = "";
        el.querySelector("#msgListBox").innerHTML = msgListHtml(ctx);
        ctx.refreshPlugins();   // 同步刷新右栏「站点统计」的留言数
        ctx.toast("留言发表成功 ✅");
      });
    },
  };

  registerSection(S);
})();
