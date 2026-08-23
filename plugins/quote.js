/* ============================================================
 * 插件：每日一言（左栏 · 互动）
 * 语料库在下方 QUOTES 里增删即可；换成网络接口也只需改 render
 * ============================================================ */
(function () {
  const QUOTES = [
    ["山高路远，看世界，也找自己。", "题记"],
    ["种一棵树最好的时间是十年前，其次是现在。", "谚语"],
    ["把期望降低，把依赖变少，你会过得很好。", "网络"],
    ["凡是过往，皆为序章。", "莎士比亚"],
    ["星光不问赶路人，时光不负有心人。", "题记"],
    ["生活明朗，万物可爱，人间值得，未来可期。", "题记"],
    ["慢慢来，比较快。", "题记"],
    ["日拱一卒无有尽，功不唐捐终入海。", "古语"],
    ["Stay hungry, stay foolish.", "Steve Jobs"],
    ["代码如诗歌，贵在简洁。", "程序员语录"],
  ];

  const P = {
    id: "quote",
    column: "left",
    order: 20,
    enabled: true,

    render(el) {
      const [text, from] = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      el.innerHTML =
        '<div class="widget-title"><span><span class="ico">💬</span>每日一言</span>' +
        '<a class="widget-link" href="javascript:;" data-act="refresh">换一句 ↻</a></div>' +
        '<div class="quote-text">「 ' + text + ' 」</div>' +
        '<div class="quote-from">—— ' + from + '</div>';
    },
    init(el) {
      // 事件绑定在卡片容器上（事件委托），内容重绘不影响
      el.addEventListener("click", e => {
        if (e.target.closest('[data-act="refresh"]')) P.render(el);
      });
    },
  };

  registerPlugin(P);
})();
