# Claude

中文 | [English](README.md)

把 DSH Web GUI 的观感重做成 claude.ai 应用界面的样子：暖米色画布、衬线正文、
珊瑚色强调。以纯资产目录形态收录，与皮肤中心包的其余主题并列。

## 是什么

- **纯资产**：`skin.json`（v2 清单）+ `skin.css`（完整的 `--dsw-*` token
  重映射）+ `patches.css`（自由选择器层）。无 package.json、无构建步骤；
  皮肤中心是唯一加载器。
- **应用配色，不是营销配色**：画布取 claude.ai 应用本身的暖米色
  `#faf9f5`，强调色取应用实际的珊瑚橙 `#d97757`（营销页用的是另一个值
  `#cc785c`，本主题有意不用）。
- **衬线正文**：markdown 正文、标题与引用走 Newsreader 衬线体，界面外壳走
  Inter，代码走 JetBrains Mono。四个 woff2 全部自托管在 `assets/fonts/`，
  不发起任何外部请求；中文回退到系统 Noto Serif CJK SC。
- **暖黑深色模式**：`#181715` 而非纯黑，亮暗两套各 97 条别名 token。
- **278 个 `--dsw-*` token 全部显式声明**，不依赖加载器的 token 自动派生。

## 配色

- 浅色：画布 `#faf9f5`、层级 `#f5f0e8` / `#efe9de` / `#e8e0d2`、主文字
  `#141413`、强调 `#d97757`。
- 深色：画布 `#181715`、层级 `#1f1e1b` / `#252320`、主文字 `#faf9f5`、
  强调 `#d97757`。

## 预览

`preview/light.jpg` 与 `preview/dark.jpg` 是真实运行界面的截图（1920x1080）：
亮色与暗色各一张，画布色值与设计值一致。

## 完整版本在项目主仓库

本目录只包含皮肤。完整版本（皮肤源文件 + 三个**可选**插件）位于
<https://github.com/aklnaaw/dsh-claude-theme>：

- **Claude 插件**（`brand-plugin`）：把侧栏的鲸鱼标志与品牌文案换成 Claude 星芒与字标，
  加一个浏览器标签页图标，提供可改的显示名与头像，以及**加载动画三选一**
  （星芒 / 螃蟹 / 关闭）。
- **皮肤插件**（`plugins/skin`）：除了不靠皮肤中心装载皮肤，它还提供
  **设置 → Claude-X** 这一页——上面那些开关都在里面。
- **Clawd 插件**（`crab-plugin`）：输入框上沿一只可点的像素蟹，眼睛跟随鼠标、
  会眨眼、戳一下会跳起来说话。

### 皮肤中心装不到这些

皮肤中心**只收 CSS，不收插件**，所以它加载的这份皮肤里一个 JS 都没有。下面这些
是插件才做得到的，**走皮肤中心不会有**：

| 功能 | 需要装 |
| --- | --- |
| 侧栏的星芒标记和「Claude」字标 | `brand-plugin` |
| 名字、副标题、头像 | `brand-plugin` |
| 关闭侧栏底部那行 | `brand-plugin` |
| 「深度求索中」旁的加载动画 | `brand-plugin` |
| 字体切换 | `plugins/font-switcher` |

只装 `brand-plugin` 就能用：改名和换头像走侧栏底部那一行的弹窗。再装上
`plugins/skin` 会多出 **设置 → Claude-X** 页，所有开关都在那里，也可以从那里选皮肤。

```bash
dsh plugin --profile web add <仓库路径>/brand-plugin
dsh plugin --profile web add <仓库路径>/plugins/skin
```

安装方式与截图见该仓库的 README。

**关于「加载动画」。** 那个功能里的星形素材属于 Anthropic，本项目按非官方粉丝复刻的用途引用；它与本目录（纯 CSS 资产）无关，是主仓库里插件提供的功能。

## 来源与版权

- 样式代码（`skin.css` / `patches.css`）：aklnaaw 原创，随本仓库以 MIT 发布。
- 内置字体 `assets/fonts/` 下四份 woff2，均为 SIL Open Font License 1.1，随附版权声明与许可全文（见目录内 `LICENSE`）：
  - `newsreader-normal.woff2`、`newsreader-italic.woff2`：Newsreader，Copyright 2020 The Newsreader Project Authors。
  - `inter-normal.woff2`：Inter，Copyright 2016 The Inter Project Authors。
  - `jetbrains-mono-normal.woff2`：JetBrains Mono，Copyright 2020 The JetBrains Mono Project Authors。
  - 四者均为 Google Fonts 的 latin 子集构建，不含中文；中文走系统字体回退。
- 预览图 `preview/light.jpg`、`preview/dark.jpg`：真实运行界面的截图，不含第三方美术素材。
- 本皮肤复刻 claude.ai 应用界面的观感。「Claude」与「Anthropic」是 Anthropic PBC 的商标；本皮肤为风格致敬，与 Anthropic 无隶属或背书关系。Anthropic 实际使用的 Copernicus 与 StyreneB 为商业授权字体，未包含在内，此处以开源的 Newsreader 与 Inter 替代。

## 已知限制

- 纯呈现层：只改浏览器样式，不触及模型请求。
- 工具调用卡片不是 claude.ai 的 1:1 复刻：claude.ai 没有对应组件，工具卡片
  是 DSH 特有界面，这里按 Claude 的卡片语言重绘，属于风格对齐。
- 本地皮肤不能运行 `hooks.mjs`（加载器只对官方市场来源放行），所以品牌替换
  只能做成独立插件。
- 内置字体是 latin 子集，不包含中文；中文走系统字体回退。
