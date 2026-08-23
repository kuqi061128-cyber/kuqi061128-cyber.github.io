/* ============================================================
 * 作品模板（本文件不会被加载，复制一份作为新作品）
 *
 * 发布步骤：
 *   1. 复制本文件到本目录，重命名（如 07-my-app.js）
 *   2. 填写下面各项（id 改成没用过的数字）
 *   3. 在 index.html 底部「内容库引入区」加一行：
 *        <script src="content/works/07-my-app.js"></script>
 *   4. 保存刷新，作品即出现在列表里
 *
 * 字段说明：
 *   id        唯一编号（链接 #/work/编号 依赖它；发布后不要再改，忘写会自动补）
 *   title     作品名
 *   desc      一句话简介（显示在卡片和详情页开头）
 *   tag       类型标签（如 网页 / 游戏 / 工具 / 设计）
 *   emoji     封面图标（coverImg 未设置时的占位图样）
 *   cover     封面渐变背景（coverImg 未设置时使用）
 *   coverImg  可选：展示图片。直接写裸文件名（如 "cover.png"），图片放在与本
 *            js 同名的文件夹里（如 content/works/07-my-app/cover.png）；
 *            也可以写 assets/ 开头的全站路径或 http(s) 外链
 *   date      可选：发布/更新日期，格式 YYYY-MM-DD
 *   file      可选：下载包路径（downloads/ 目录）或外部 https 链接，填了出现下载按钮
 *   version   可选：版本号（如 "v1.0"）
 *   size      可选：包大小提示（如 "36 MB"）
 *   detail    可选：详情页介绍正文，支持 <p> <h3> <ul><li> <img> 等标签；
 *            <img src="截图.png"> 同样支持裸文件名，自动定位到自己文件夹
 * ============================================================ */
registerWork({
  id: 7,                             // ← 改成没用过的编号
  title: "我的新作品",
  desc: "一句话简介，显示在作品卡片上。",
  tag: "工具",
  emoji: "🧩",
  cover: "linear-gradient(135deg,#38bdf8,#34d399)",
  // coverImg: "assets/img/xxx.png",
  date: "2026-09-01",
  // file: "downloads/xxx.zip", version: "v1.0", size: "36 MB",
  detail: `
    <p>这里写详细介绍。</p>
    <h3>功能亮点</h3>
    <ul><li>特点一</li><li>特点二</li></ul>
  `,
});
