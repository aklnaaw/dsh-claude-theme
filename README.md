# Claude — DSH Web GUI 主题

把 DSH Web GUI 的观感重做成 claude.ai 应用界面的样子：暖米色画布、衬线正文、珊瑚色强调。

本仓库分发**两个互相独立的产物**：

| 产物 | 位置 | 安装方式 | 作用 |
| --- | --- | --- | --- |
| 皮肤 | `claude/` | 拷贝到 `$DSH_HOME/skins/claude/`，在设置里选中 | 配色、字体、圆角、组件外观 |
| 品牌插件 | `brand-plugin/` | `dsh plugin --profile web add link:<绝对路径>` + 重启 | 替换 DSH 鲸鱼标志与品牌文案 |
| 蟹插件 | `crab-plugin/` | `dsh plugin --profile web add link:<绝对路径>` + 重启 | 输入框上沿那只**可点**的 Clawd：跟随鼠标、会眨眼、戳了会说话 |

皮肤是纯资源目录，由已安装的皮肤中心插件 `@linxin666/dsh-client-ui-skin-center` 读取和渲染，本身不含任何可执行代码。品牌替换做不了皮肤的一部分（原因见[已知限制](#已知限制)），所以拆成了一个独立的 Cordis 客户端插件。

**状态**：皮肤已可用并已在本机激活（校验通过、零告警）。品牌插件代码已写好、已以 `link:` 接入 web profile，但**尚未在浏览器里验证**——它需要重启一次 DSH 才会进入启动图谱。

---

## 效果预览

![](claude/preview/light.jpg)

![](claude/preview/dark.jpg)

上图为 1440×900 的实际渲染。渲染方式：用无头 Chrome 直接加载**皮肤中心真实吐出的** `skin.css` 与 `patches.css`，并按官方默认令牌值铺底，因此图中的颜色、字体、圆角都是浏览器实测的计算样式，不是设计稿。复现脚本见 `scripts/render-harness/`。

---

## 特性

- **暖米色画布**：`#faf9f5` 取代默认的冷灰白，层级用 `#f5f0e8` / `#efe9de` / `#e8e0d2` 逐级压深。
- **278 个 `--dsw-*` token 全部显式声明**，亮色与深色各覆盖一套（其中 97 个别名 token 在两种模式下同名不同值）。没有依赖加载器的 token 自动派生（原因见[已知限制](#已知限制)）。
- **Newsreader 衬线正文**：markdown 正文、标题、引用走衬线体，界面外壳（按钮、菜单、标签）走 Inter，代码走 JetBrains Mono。
- **暖黑深色模式**：`#181715`，不是纯黑。
- **Clawd 像素蟹**：Claude Code 的官方吉祥物。**纯 CSS `box-shadow` 像素画**——不是图片、不发请求、不占资产体积，且完全跟随主题色。分两层：
  - **皮肤层**（无需插件）：输入框上沿的常驻蟹（不可点，伪元素）、问候语像素粒子。
  - **插件层**（`crab-plugin/`）：把同一只蟹换成**可交互**的真元素——眼睛跟随鼠标（四向帧）、空闲眨眼、戳一下会跳起来说一句话。装上插件后皮肤那只自动让位，永远只有一只。
- **字体内置**：4 个 woff2、364 KB，全部自托管在皮肤目录内，不发起任何外部请求。
- **圆角阶梯与药丸输入框**：`patches.css` 用 L3 自由选择器重排圆角、输入框、卡片与滚动条。
- **第三方插件融合**：对非官方插件的界面做了一层中性化处理，使其跟随 Claude 的卡片语言而不是自带配色。
- **切换即时生效**：皮肤中心在页面内原子切换，不刷新、不重启。

---

## 目录结构

```
dsh-claude-theme/
├── claude/                          # 皮肤（纯资源目录）
│   ├── skin.json                    # 清单 v2：id=claude、accent=#d97757、contributes
│   ├── skin.css                     # 278 个 --dsw-* token（亮 + 暗）+ @font-face
│   ├── patches.css                  # L3 自由选择器补丁
│   ├── assets/fonts/                # 自托管字体（latin 子集，共 364 KB）
│   │   ├── newsreader-normal.woff2  #   可变字重 200–800
│   │   ├── newsreader-italic.woff2  #   可变字重 200–800
│   │   ├── inter-normal.woff2       #   可变字重 100–900
│   │   ├── jetbrains-mono-normal.woff2  # 可变字重 100–800
│   │   ├── fonts.generated.css      # build-fonts.sh 的产物，被 gen-skin-css.py 内联
│   │   └── build-fonts.sh           # 重新下载上述 woff2
│   ├── preview/                     # 预览图（1440×900，亮/暗各一张）
│   ├── crab.generated.css           # Clawd 蟹（由 gen-crab.py 生成，勿手改）
│   └── patches.base.css             # 手写的 L3 选择器层（patches.css 的输入）
│       ├── light.jpg                #   1440×900
│       └── dark.jpg                 #   1440×900
├── crab-plugin/                     # 蟹插件（可交互 Clawd）
├── pet/                             # 宠物系统用的 Clawd（图集 + 清单）
├── brand-plugin/                    # 品牌插件 dsh-claude-brand
│   ├── package.json                 #   声明 dsh.bundle.patch 与 dsh.client.platform=web
│   ├── cordis.patch.yml             #   向 web roster 插入 dsh-claude-brand 行
│   └── lib/
│       ├── index.js                 #   host 半边：有意留空（无 host 状态、无 RPC）
│       └── client.js                #   浏览器半边：slot 注册 + 文案改写
├── scripts/
│   ├── gen-skin-css.py              # 由调色板重新生成 claude/skin.css
│   ├── validate-skin.mjs            # 用真实 skin-center 清洗器校验皮肤
│   ├── capture-preview.sh           # 截图做预览图（需要已认证 URL）
│   ├── render-harness/              # 无认证依赖的预览渲染 + 计算样式回读
│   ├── gen-crab.py                  # 生成 crab.generated.css 并合成 patches.css
│   └── gen-pet.py                   # 生成 Clawd 宠物目录的图集与清单
├── README.md                        # 本文件
├── README.en.md                     # 英文版
├── INSTALL.md                       # 逐步安装与排错
├── LICENSE                          # MIT（代码/CSS）+ 字体与商标声明
└── .gitignore
```

`scripts/` 的用法见 [`scripts/README.md`](scripts/README.md)。

---

## 安装

需要先装好皮肤中心插件 `@linxin666/dsh-client-ui-skin-center`（本皮肤在 **v0.3.23** 上测试）。

### 一、皮肤

拷贝整个 `claude/` 目录到 `$DSH_HOME/skins/` 下，目录名保持 `claude`：

```bash
# DSH_HOME 默认是 ~/.dsh
cp -r claude "$HOME/.dsh/skins/claude"
```

然后在 GUI 里打开 **设置 → 皮肤中心**，选中 **Claude**。切换是即时的，不需要重启。

验证是否被发现：

```bash
curl -s http://127.0.0.1:3080/api/skin-center/v2/catalog \
  | python3 -c "import json,sys; print([ (s['manifest']['id'], s.get('warnings')) for s in json.load(sys.stdin)['skins'] if s['manifest']['id']=='claude' ])"
```

应输出 `[('claude', [])]` —— 注意 `warnings` 为空。

### 二、品牌插件

> 代码已写好，但**尚未验证**：没有确认过它在本机页面里的实际效果，也没有在干净环境里装过一遍。

```bash
dsh plugin --profile web add link:/path/to/dsh-claude-theme/brand-plugin
# 然后重启 DSH 一次（客户端插件在启动时加载，不能热切换）
```

包名 `dsh-claude-brand`。插件做四件事：

1. 在 `sidebar.brand.mark` 和 `conversation.hero.brand.mark` 上以优先级 **-10** 注册，遮住官方占位的鲸鱼 logo，换成内联 SVG 的 Anthropic/Claude 放射状星芒标记（`currentColor`，随主题变色）。
2. 在 `sidebar.brand.name` 上把官方的字形轮廓替换成真文字 "Claude"。
3. 把 hero 标题（"探索未至之境" / "Into the Unknown"）换成按时间问候，并改写文档标题里的产品名。
4. 所有副作用都挂在 `ctx.effect` 上，停用插件时会还原。

关于优先级：slot 遮蔽是**数字越小越优先渲染**，所以 -10 压过官方品牌插件的 0；同优先级注册 `single` slot 会直接抛错。

完整的安装与排查步骤见 [`INSTALL.md`](INSTALL.md)。

---

## 配色

取自 claude.ai 应用界面本身，不是 claude.com 营销页。两者强调色不同：**营销页用 `#cc785c`，应用用 `#d97757`**，本项目有意采用应用值。

| 角色 | 亮色 | 用途 |
| --- | --- | --- |
| canvas | `#faf9f5` | 主画布底色 |
| soft | `#f5f0e8` | 一级层（侧栏等） |
| card | `#efe9de` | 二级层（卡片） |
| cream | `#e8e0d2` | 三级层（内嵌块） |
| hairline | `#e6dfd8` | 发丝边框 |
| ink | `#141413` | 主文字 |
| body | `#3d3d3a` | 次级文字 |
| muted | `#6c6a64` | 弱化文字 |
| accent | `#d97757` | 强调色 / 主按钮 |
| accent-active | `#a9583e` | 强调色按下态 |
| accent-soft | `#f3e0d8` | 强调色浅底 |

深色模式：

| 角色 | 深色 | 用途 |
| --- | --- | --- |
| dark | `#181715` | 暖黑画布（**不是**纯黑） |
| dark-soft | `#1f1e1b` | 一级层 |
| dark-el | `#252320` | 二级层 |
| dark-3 | `#2b2925` | 三级层 |
| on-dark | `#faf9f5` | 深色模式正文（沿用亮色画布值） |
| on-dark-soft | `#a09d96` | 深色模式弱化文字 |

---

## 字体说明

三个字族，全部是 Google Fonts 的 **latin 子集**、自托管在 `claude/assets/fonts/`：

| 字族 | 用途 | 文件 | 字重 |
| --- | --- | --- | --- |
| Newsreader | 正文、markdown、标题（衬线） | `newsreader-normal.woff2` + `newsreader-italic.woff2` | 200–800 可变 |
| Inter | 界面外壳（无衬线） | `inter-normal.woff2` | 100–900 可变 |
| JetBrains Mono | 代码 | `jetbrains-mono-normal.woff2` | 100–800 可变 |

每个文件都是可变字体，一个文件覆盖整个字重区间，所以每个（字族, 样式）只对应一条 `@font-face`。

**为什么自托管**：皮肤加载器会拒绝 `@import`、远程 URL / 协议相对 URL、绝对路径和 `../` 逃逸（HTTP 422）。CSS 里只能引用皮肤目录内的相对路径资产，所以字体必须随皮肤一起分发。

**中文不内置**：中文回退到系统字体 `Noto Serif CJK SC`（正文）/ `Noto Sans CJK SC`（界面）。CJK 字体每字重约 20 MB，随包分发不现实，所以有意不 vendor。这是 `scripts/gen-skin-css.py` 里的三个字族栈：

```
正文 SERIF: 'Newsreader','Noto Serif CJK SC','Source Han Serif SC','Songti SC',Georgia,serif
界面 SANS : 'Inter','Noto Sans CJK SC','PingFang SC','Microsoft YaHei',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif
代码 MONO : 'JetBrains Mono','Noto Sans Mono CJK SC',ui-monospace,SFMono-Regular,Menlo,monospace
```

---

## 已知限制

- **本地皮肤不能跑 `hooks.mjs`。** 加载器对任何没有官方市场来源的皮肤直接拒绝，返回 HTTP 403 `hooks-require-review`。这就是品牌替换只能做成独立插件、而不是皮肤钩子的原因。
- **远程字体被硬拒。** `@import`、远程/协议相对 URL、绝对路径、`../` 逃逸都会被清洗器拒绝（422）。字体只能放在皮肤目录内、用相对路径引用。
- **工具调用卡片不是 1:1 复刻。** claude.ai 没有对应组件，工具卡片是 DSH 特有的界面。这里只是按 Claude 的卡片语言（发丝边框、克制的圆角、暖色层）重绘，属于风格对齐而非还原。
- **蟹的像素几何来自第三方作者的免费作品。** 像素点阵数据取自酒馆扩展 [claude-web](https://github.com/claudenoshujin/claude-web)，作者 **lulu**，在**类脑社区免费分发**。原像素美术的功劳归该作者；本项目只复用了点阵几何，选择器、动画、配色与摆放均为自写。见下方[许可与声明](#许可与声明)。
- **宠物面板里的 Clawd 不是逐帧动画。** 宠物系统要 8×9 图集，而蟹只有一套静态像素几何，所以九格画的是同一只蟹（按行着色），不是九段动画。要真动画得补美术。
- **预览图来自渲染实验台而非真实登录会话。** 见 `scripts/render-harness/`：它加载的是皮肤中心真实吐出的 CSS，但页面外壳是等价复刻的，不是 DSH 本身。
- **品牌插件尚未验证。** 代码已在 `brand-plugin/lib/`，包名 `dsh-claude-brand`，已 `link:` 进 web profile，但还没有确认页面里的实际效果。
- **不依赖 token 自动派生。** 加载器的回退派生实际失效：在约 190 个未被覆盖的 token 上只能派生出约 1 个，其余保留出厂值。所以这里 278 个 token 全部显式声明，不留给派生。
- **强制作用域。** 所有 CSS 会被加载器强制加上 `html[data-dsh-skin="claude"]` 前缀，所以皮肤只能影响选中时页面，不会污染其他皮肤。

---

## 许可与声明

- 代码与 CSS：MIT，见 [`LICENSE`](LICENSE)。
- 内置字体：Newsreader、Inter、JetBrains Mono 均为 SIL Open Font License 1.1 授权，随附于 `claude/assets/fonts/`。
- 商标：这是**非官方粉丝复刻**。"Claude" 与 "Anthropic" 是 Anthropic PBC 的商标。本项目与 Anthropic 无任何隶属或背书关系。
- **Clawd 的署名。** Clawd（Claude Code 的像素蟹吉祥物）属于 Anthropic。本仓的蟹是**纯 CSS**：由 `scripts/gen-crab.py` 从像素点阵数据生成，不含任何图片文件。点阵几何源自酒馆扩展 [claude-web](https://github.com/claudenoshujin/claude-web)，作者 **lulu**，在**类脑社区免费分发**——原像素美术的功劳归该作者。本项目只复用几何数据，未从该仓库复制任何文件；选择器、动画、配色、摆放均为自写。
- **Copernicus 和 StyreneB 未包含在内。** 这两个是 Anthropic 实际使用的字体，属于商业授权字体，不能分发。本项目用开源的 Newsreader（替代 Copernicus 的衬线角色）和 Inter（替代 StyreneB 的无衬线角色）作为替代品——形似但不等同。

---

## 致谢

- 皮肤中心插件 [`@linxin666/dsh-client-ui-skin-center`](https://github.com/zhu1090093659/dsh-web)：提供了皮肤加载、清单校验、CSS 清洗与热切换的整套机制。
- Newsreader、Inter、JetBrains Mono 的字型作者与 Google Fonts 的 latin 子集构建。
- Anthropic 的 claude.ai 界面：本项目是照着它的观感做的复刻。
- 酒馆扩展 [claude-web](https://github.com/claudenoshujin/claude-web)（作者 **lulu**，类脑社区）：Clawd 像素几何数据的来源，也是配色与观感的重要参照。
