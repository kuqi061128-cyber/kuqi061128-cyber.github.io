/* 作品：DSH 桌面应用（新增作品请复制 _template.js）
 * 本作品的图片放在同名文件夹 content/works/01-dsh-desktop/ 里，
 * coverImg 和 <img> 直接写裸文件名（icon.png / simple_1.png / simple_2.png）即可 */
registerWork({
  id: 1,                    // 唯一编号，链接 #/work/1 依赖它，发布后不要再改
  title: "DSH 桌面应用",
  desc: "封装成桌面工具Deepseek Harness，当前版本 v1.2.0。",
  tag: "桌面应用",
  emoji: "🖥️",
  cover: "linear-gradient(135deg,#38bdf8,#818cf8)",
  coverImg: "icon.png",   // 展示图：图片在本作品自己的文件夹里，直接写文件名
  date: "2026-08-22",
  file: "downloads/dsh-desktop-v1.2.0.zip",  // 下载包：填了就出现下载按钮
  version: "v1.2.0",
  size: "149 MB",
  detail: `
    <p>DSH 桌面应用是一点击即启动的Deepseek Harness桌面工具，安装简单、开箱即用。</p>
    <img src="simple_1.jpg" alt="应用预览图">
    <h3>功能亮点</h3>
    <ul>
      <li>支持移动端与pc端互通</li>
      <li>轻量启动，不占后台资源</li>
      <li>界面简洁，常用功能一步直达</li>
    </ul>
    <img src="simple_2.png" alt="应用预览图">
    <h3>下载与安装</h3>
    <p>点击上方「立即下载」保存压缩包，解压后运行其中的安装程序，按提示完成安装即可。建议安装前关闭旧版本。</p>
    <h3>更新日志</h3>
    <p>v1.2.0：修复一批已知问题，优化整体稳定性。</p>
  `,
});
