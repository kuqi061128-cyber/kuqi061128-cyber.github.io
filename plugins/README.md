# 插件库说明

博客左右两栏的插件全部在本目录里，**一个插件一个文件**，主页面（index.html）只负责加载和挂载。

## 文件一览

| 文件 | 栏目 | 插件 |
|---|---|---|
| clock.js | 左栏 | 实时时钟 |
| quote.js | 左栏 | 每日一言 |
| like.js | 左栏 | 给博主点赞（大圆心形按钮，与桌宠点赞共用数据） |
| pet.js | 浮动 | 桌宠（屏幕常驻：拖拽四边四角吸附、按压Q弹、音效、台词气泡、双击进留言板，首次点击给博客点赞；素材在 plugins/pet/） |
| site-stats.js | 右栏 | 站点统计 |
| hot-posts.js | 右栏 | 热门文章 |
| categories.js | 右栏 | 分类统计 |
| tag-cloud.js | 右栏 | 标签云 |
| reading-aid.js | 浮动 | 阅读辅助（导航底部阅读进度条 + 返回顶部按钮，自动避开桌宠区域） |
| _template.js | — | 开发模板（不会被加载） |

## 日常维护

- **升级插件**：直接改对应文件的 `render` / `init`，保存刷新即可，不用动 index.html。
- **下线插件**：把文件里 `enabled` 改成 `false`（保留代码，随时再上线）。
- **调整顺序**：改 `order`，数字越小越靠前。
- **换到另一栏**：把 `column` 在 `"left"` / `"right"` 之间切换。
- **新增插件**：复制 `_template.js` 改名（如 `weather.js`），改好后在 index.html 底部插件引入区加一行 `<script src="plugins/weather.js"></script>`。
- **彻底移除**：删掉插件文件，并移除 index.html 里对应的 `<script>` 行。

## 插件接口（ctx）

`render(el, ctx)` 与 `init(el, ctx)` 的第二个参数 ctx 提供：

- `SITE` / `ARTICLES` / `WORKS`：站点配置与文章、作品数据
- `state`：运行数据（messages 留言、likes 点赞、visits 访问量…）
- `articleViews(id)`：某篇文章总浏览量
- `esc(s)`：文本转义，输出用户内容时务必使用
- `toast(msg)`：气泡提示
- `fmtNow()`：当前时间字符串
- `storeGet(key, def)` / `storeSet(key, val)`：本地持久化（localStorage）
- `refreshPlugins()`：手动触发所有 live 插件重绘

注意事项：

1. 事件绑定请绑在 `el`（卡片容器）上做事件委托，这样 `live: true` 的重绘不会丢事件。
2. 定时器等资源请在 `destroy()` 里清理。
3. 本站是纯静态页面，插件的持久化都在访客浏览器本地；需要全站共享的数据要接后端。
