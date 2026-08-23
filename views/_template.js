/* ============================================================
 * 分区模板（本文件不会被加载；想加新分区，如「相册」，复制本文件）
 *
 * 新增分区步骤：
 *   1. 复制本文件到本目录，重命名（如 gallery.js）
 *   2. 修改 id（路由地址用，英文）、label（导航标签文字）、render
 *   3. 在 index.html 底部「分区模块引入区」加一行：
 *        <script src="views/gallery.js"></script>
 *   4. 保存刷新——顶部导航自动多出一个新分区，链接为 #/gallery
 *
 * 字段说明：
 *   id     分区标识（英文，路由地址 #/id 依赖它，发布后不要再改）
 *   label  顶部导航显示的文字
 *   order  导航排序：内置分区 首页10 / 文章20 / 作品30，自定义分区按数字插入
 *   render 必填：绘制分区内容。el 是中栏主容器（#mainView），直接写 innerHTML
 *
 * ctx 提供的接口（与插件一致）：
 *   SITE / ARTICLES / WORKS / state / articleViews / esc / toast /
 *   fmtNow / storeGet / storeSet / refreshPlugins
 * ============================================================ */
(function () {
  const S = {
    id: "my-section",
    label: "新分区",
    order: 50,

    render(el, ctx) {
      el.innerHTML =
        '<div class="view-head"><h2 class="view-title">🧩 新分区</h2></div>' +
        '<div class="post-card"><h4>这里是新分区的内容</h4>' +
        '<p class="post-sum">可用的样式类：post-card（卡片）、works-grid（网格）、' +
        'board-form（表单）、empty（空状态）等，参考 views/board.js 与 index.html 的用法。</p></div>';
    },
  };

  registerSection(S);
})();
