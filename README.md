| ![](cover/blue-maid.png) | ![](cover/orange-reading.png) |
| --- | --- |

> ~~**我看鲸小妹和克小妹也是一对苦命鸳鸯啊。**~~

# Claude — DSH Web GUI 主题

> ~~**Anthropic 觉得侵权可以联系我下架。**~~

把 DSH Web GUI 的观感重做成 claude.ai 应用界面的样子：暖米色画布、衬线正文、珊瑚色强调。

本仓库分发**三个产物**，其中两个插件**完全独立于皮肤**，可以单独安装：

| 产物 | 位置 | 需要皮肤中心？ | 安装方式 |
| --- | --- | --- | --- |
| 皮肤 | `claude/` | **需要** | 拷贝到 `$DSH_HOME/skins/claude/`，在设置里选中 |
| Claude 插件 | `brand-plugin/` | **不需要** | `dsh plugin --profile web add link:<绝对路径>` + 重启 |
| Clawd 插件 | `crab-plugin/` | **不需要** | `dsh plugin --profile web add link:<绝对路径>` + 重启 |

### 三者的依赖关系

**皮肤是纯资源目录**，不含任何可执行代码，由第三方皮肤中心 `@linxin666/dsh-client-ui-skin-center` 读取和渲染。它**必须**通过皮肤中心加载——这是皮肤这类产物的唯一入口。

**两个插件不经过皮肤中心**，它们是普通的 Cordis 客户端插件，由 DSH 自己的插件系统加载。它们只依赖官方的东西：

| 插件 | Cordis 服务 | CSS 变量 |
| --- | --- | --- |
| `brand-plugin` | `slots` | `--dsw-*`（官方主题服务提供） |
| `crab-plugin` | `timer` | `--dsw-*` + 自己定义的 `--dcc-*` |

**关键点**：两个插件都**不引用任何皮肤变量**（皮肤变量是 `--cl-*` 前缀，引用次数为 0）。Clawd 插件的像素帧数据是**内置**的，不依赖皮肤提供。

所以可以只装插件、不装皮肤——蟹和品牌替换照常工作，只是配色会跟随你当前用的主题。反过来只装皮肤不装插件也可以，皮肤自带问候语旁的像素粒子。

**为什么品牌替换不做成皮肤的一部分**：本地皮肤无法运行 `hooks.mjs`（加载器只对官方市场来源放行，见[已知限制](#已知限制)），而换品牌标记需要替换插槽占用者，那是插件才能做的事。

**状态**：三个产物都已在本机实测生效——皮肤校验零告警，Claude 插件与 Clawd 插件均已 `link:` 进 web profile 并通过真实页面 DOM 验证（侧栏是 Claude 星芒 SVG + 文字字标；输入框上沿有可交互的 Clawd）。

---

## 效果预览

![](claude/preview/light.jpg)

![](claude/preview/dark.jpg)

上图为真实运行界面的截图（1440×900）。采样验证：亮色画布 `rgb(250,249,245)` = `#faf9f5`，暗色画布 `rgb(24,23,21)` = `#181715`，均为设计值。

---

## 特性

- **暖米色画布**：`#faf9f5` 取代默认的冷灰白，层级用 `#f5f0e8` / `#efe9de` / `#e8e0d2` 逐级压深。
- **278 个 `--dsw-*` token 全部显式声明**，亮色与深色各覆盖一套（其中 97 个别名 token 在两种模式下同名不同值）。没有依赖加载器的 token 自动派生（原因见[已知限制](#已知限制)）。
- **Newsreader 衬线正文**：markdown 正文、标题、引用走衬线体，界面外壳（按钮、菜单、标签）走 Inter，代码走 JetBrains Mono。
- **暖黑深色模式**：`#181715`，不是纯黑。
- **Clawd 像素蟹**：Claude Code 的官方吉祥物。**纯 CSS `box-shadow` 像素画**——不是图片、不发请求、不占资产体积，且完全跟随主题色。分两层：
  - **皮肤层**（无需插件）：输入框上沿的常驻蟹（不可点，伪元素）、问候语像素粒子。
  - **插件层**（`crab-plugin/`）：把同一只蟹换成**可交互**的真元素——眼睛跟随鼠标（四向帧）、空闲眨眼、戳一下会跳起来说一句话。
  - 两者**互斥且互补**：皮肤用 `body:has(.dcc-crab)` 判断插件蟹是否真的在 DOM 里，在则让位、不在则自己顶上。所以任何一边失败，结果都是**恰好一只蟹**，不会出现两只、也不会一只都没有。
  - 插件**不走 Cordis slot，而是直接挂 DOM**（`[data-composer-card]`）。原因见下方「已知限制」。
- **字体内置**：4 个 woff2、364 KB，全部自托管在皮肤目录内，不发起任何外部请求。
- **圆角阶梯与药丸输入框**：`patches.css` 用 L3 自由选择器重排圆角、输入框、卡片与滚动条。
- **第三方插件融合**：对非官方插件的界面做了一层中性化处理，使其跟随 Claude 的卡片语言而不是自带配色。
- **可改的名字与头像**：侧栏底部、设置上方有一行头像 + 名字 + 副标题，点开就地编辑（名字、副标题、头像）。新装默认显示 `moon` 和内置头像；只存在这台浏览器里，不上传。**只对没有记录的新用户生效**——主动清空不会被默认值覆盖。
- **首页问候语轮换**：24 句轮换，第一句永远是时段问候（早上好/中午好/晚上好），其余每次打开页面换一句，并带上你设的名字。
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
│   ├── preview/                     # 预览图（1440×900）
│   │   ├── light.jpg
│   │   └── dark.jpg
│   ├── crab.generated.css           # 问候语像素粒子（gen-crab.py 生成，勿手改）
│   └── patches.base.css             # 手写的 L3 选择器层（patches.css 的输入）
├── crab-plugin/                     # Clawd 插件 dsh-claude-crab（自包含）
│   ├── package.json                 #   声明 dsh.bundle.patch 与 dsh.client.platform=web
│   ├── cordis.patch.yml             #   向 web roster 插入 dsh-claude-crab 行
│   ├── LICENSE                      #   MIT + Clawd 署名
│   ├── README.md                    #   插件自己的说明
│   ├── docs/preview.png             #   插件预览图
│   └── lib/
│       ├── index.js                 #   host 半边：有意留空
│       └── client.js                #   浏览器半边：内置像素帧 + DOM 挂载
├── pet/                             # 宠物系统用的 Clawd（图集 + 清单）
├── brand-plugin/                    # Claude 插件 dsh-claude-brand
│   ├── package.json                 #   声明 dsh.bundle.patch 与 dsh.client.platform=web
│   ├── cordis.patch.yml             #   向 web roster 插入 dsh-claude-brand 行
│   ├── assets/default-avatar.webp   #   内置默认头像（内联 data URL 的源文件）
│   └── lib/
│       ├── index.js                 #   host 半边：有意留空（无 host 状态、无 RPC）
│       └── client.js                #   浏览器半边：slot + 文案改写 + 名字头像编辑器
├── cover/                           # 封面图，两套配色
│   ├── cover-light.png              #   1920×1080，16:9，做视频封面
│   ├── cover-dark.png
│   ├── social-light.png             #   1280×640，2:1，给 GitHub 仓库卡片
│   └── social-dark.png
├── scripts/
│   ├── gen-skin-css.py              # 由调色板重新生成 claude/skin.css
│   ├── gen-crab.py                  # 生成问候语粒子并合成 patches.css
│   ├── gen-pet.py                   # 生成 Clawd 宠物目录的图集与清单
│   ├── gen-cover.py                 # 按两种比例渲染封面图
│   ├── gen-brand-avatar.py          # 把默认头像切进 Claude 插件
│   ├── cover-assets.json            # gen-cover.py 用的品牌图形数据
│   └── validate-skin.mjs            # 用真实 skin-center 清洗器校验皮肤
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

### 二、Claude 插件

> 已在本机真实页面验证生效。尚未在干净环境里装过一遍。

```bash
dsh plugin --profile web add link:/path/to/dsh-claude-theme/brand-plugin
# 然后重启 DSH 一次（客户端插件在启动时加载，不能热切换）
```

包名 `dsh-claude-brand`。插件做六件事：

1. 在 `sidebar.brand.mark` 和 `conversation.hero.brand.mark` 上以优先级 **-10** 注册，遮住官方占位的鲸鱼 logo，换成内联 SVG 的 Anthropic/Claude 放射状星芒标记（`currentColor`，随主题变色）。
2. 在 `sidebar.brand.name` 上把官方的字形轮廓替换成真文字 "Claude"。
3. 把 hero 标题（"探索未至之境" / "Into the Unknown"）换成轮换问候语，并改写文档标题里的产品名。
4. 声明浏览器标签页图标。页面本身没有任何 `<link rel="icon">`，浏览器会退回请求 `/favicon.svg`——那是 DSH 安装目录里的鲸鱼，升级会被覆盖。插件改为自己声明星芒，不去改不属于自己的文件。
5. 在设置里加一个 **名字** 页，用来改名字、副标题和头像。
6. 在侧栏底部、设置上方加一行头像 + 名字 + 副标题，点开就地编辑。

关于优先级：slot 遮蔽是**数字越小越优先渲染**，所以 -10 压过官方品牌插件的 0；同优先级注册 `single` slot 会直接抛错。

### 三、Clawd 插件

```bash
dsh plugin --profile web add link:/path/to/dsh-claude-theme/crab-plugin
# 同样重启 DSH 一次
```

包名 `dsh-claude-crab`。它**不依赖皮肤**——像素帧内置，配色走官方 `--dsw-*` 变量，所以单独装也能用。

装完应当**恰好一只蟹**：皮肤用 `body:has(.dcc-crab)` 检测插件蟹是否在 DOM 里，在则让位。任何一边失败，结果都是一只蟹，不会两只也不会零只。

完整的安装与排查步骤见 [`INSTALL.md`](INSTALL.md)。

**嫌麻烦可以丢给dsh或者Claude Code和codex让他们装**

---

## 已知限制

- **本地皮肤不能跑 `hooks.mjs`。** 加载器对任何没有官方市场来源的皮肤直接拒绝，返回 HTTP 403 `hooks-require-review`。这就是品牌替换只能做成独立插件、而不是皮肤钩子的原因。
- **远程字体被硬拒。** `@import`、远程/协议相对 URL、绝对路径、`../` 逃逸都会被清洗器拒绝（422）。字体只能放在皮肤目录内、用相对路径引用。
- **工具调用卡片不是 1:1 复刻。** claude.ai 没有对应组件，工具卡片是 DSH 特有的界面。这里只是按 Claude 的卡片语言（发丝边框、克制的圆角、暖色层）重绘，属于风格对齐而非还原。
- **蟹的像素几何来自第三方参考实现。** 像素点阵数据取自酒馆扩展 [claude-web](https://github.com/claudenoshujin/claude-web)，作者 **claudenoshujin**。原像素美术的功劳归该作者；本项目只复用了点阵几何，选择器、动画、配色与摆放均为自写。见下方[许可与声明](#许可与声明)。
- **宠物面板里的 Clawd 不是逐帧动画。** 宠物系统要 8×9 图集，而蟹只有一套静态像素几何，所以九格画的是同一只蟹（按行着色），不是九段动画。要真动画得补美术。
- **Clawd 插件不通过 slot 注册。** 早期版本把 React 组件注册进 `conversation.input.overlay`，但 slot 渲染抛错会被错误边界吞掉——插件确实加载了（皮肤让位），蟹却没出现，且看不到任何报错。现在改为直接挂到官方的 `[data-composer-card]` 上，自己完全掌握元素生命周期。代价是耦合 composer 的 DOM 契约而非 slot 体系；若该属性变更，插件蟹消失、皮肤蟹自动接管。
- **预览图是真实运行界面的截图。**
- **Claude 插件已在真实页面验证**（侧栏品牌标记是 Claude 星芒 SVG、品牌名为 "Claude"），但尚未在干净环境里装过。
- **不依赖 token 自动派生。** 加载器的回退派生实际失效：在约 190 个未被覆盖的 token 上只能派生出约 1 个，其余保留出厂值。所以这里 278 个 token 全部显式声明，不留给派生。
- **强制作用域。** 所有 CSS 会被加载器强制加上 `html[data-dsh-skin="claude"]` 前缀，所以皮肤只能影响选中时页面，不会污染其他皮肤。

---

## 许可与声明

- 代码与 CSS：MIT，见 [`LICENSE`](LICENSE)。
- 内置字体：Newsreader、Inter、JetBrains Mono 均为 SIL Open Font License 1.1 授权，随附于 `claude/assets/fonts/`。
- 商标：这是**非官方粉丝复刻**。"Claude" 与 "Anthropic" 是 Anthropic PBC 的商标。本项目与 Anthropic 无任何隶属或背书关系。
- **Clawd 的署名。** Clawd（Claude Code 的像素蟹吉祥物）属于 Anthropic。本仓的蟹是**纯 CSS**：由 `scripts/gen-crab.py` 从像素点阵数据生成，不含任何图片文件。点阵几何源自酒馆扩展 [claude-web](https://github.com/claudenoshujin/claude-web)，作者 **claudenoshujin**——原像素美术的功劳归该作者。本项目只复用几何数据，未从该仓库复制任何文件；选择器、动画、配色、摆放均为自写。
- **Copernicus 和 StyreneB 未包含在内。** 这两个是 Anthropic 实际使用的字体，属于商业授权字体，不能分发。本项目用开源的 Newsreader（替代 Copernicus 的衬线角色）和 Inter（替代 StyreneB 的无衬线角色）作为替代品——形似但不等同。

---

## 致谢

- 皮肤中心插件 [`@linxin666/dsh-client-ui-skin-center`](https://github.com/zhu1090093659/dsh-web)：提供了皮肤加载、清单校验、CSS 清洗与热切换的整套机制。
- Newsreader、Inter、JetBrains Mono 的字型作者与 Google Fonts 的 latin 子集构建。
- Anthropic 的 claude.ai 界面：本项目是照着它的观感做的复刻。
- 酒馆扩展 [claude-web](https://github.com/claudenoshujin/claude-web)（作者 **claudenoshujin**）：Clawd 像素几何数据的来源，也是配色与观感的重要参照。
