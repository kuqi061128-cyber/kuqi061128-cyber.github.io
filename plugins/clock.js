/* ============================================================
 * 插件：实时时钟（左栏 · 互动）
 * 更新本文件即可升级插件，无需改动 index.html
 * ============================================================ */
(function () {
  let timer = null;

  function tick() {
    const d = new Date(), p = n => String(n).padStart(2, "0");
    const weeks = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    document.getElementById("clockDate").textContent =
      d.getFullYear() + " 年 " + (d.getMonth() + 1) + " 月 " + d.getDate() + " 日 · " + weeks[d.getDay()];
    document.getElementById("clockTime").textContent =
      p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
    const h = d.getHours();
    document.getElementById("clockHello").textContent =
      h < 6 ? "夜深了，早点休息 🌙" :
      h < 12 ? "早上好，新的一天加油 ☀️" :
      h < 18 ? "下午好，记得喝水 🍵" : "晚上好，欢迎回来 🌆";
  }

  const P = {
    id: "clock",            // 唯一 ID
    column: "left",         // left=左栏互动插件 / right=右栏统计插件
    order: 10,              // 排序权重，数字越小越靠前
    enabled: true,          // 改成 false 即下线，不用删文件

    render(el) {            // 绘制内容（el 是整个 .widget 卡片）
      el.innerHTML =
        '<div class="widget-title"><span><span class="ico">🕐</span>实时时钟</span></div>' +
        '<div class="clock-date" id="clockDate"></div>' +
        '<div class="clock-time" id="clockTime">--:--:--</div>' +
        '<div class="clock-hello" id="clockHello"></div>';
      tick();
    },
    init() {                // 首次挂载后执行一次：启动定时器
      timer = setInterval(tick, 1000);
    },
    destroy() {             // 可选清理（页面刷新会自动重置）
      clearInterval(timer);
    },
  };

  registerPlugin(P);
})();
