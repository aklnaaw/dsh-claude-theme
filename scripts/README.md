# scripts/

皮肤仓库的维护脚本。日常安装用不到它们——**装皮肤只需要拷贝 `claude/` 目录**。

| 脚本 | 作用 | 何时跑 |
| --- | --- | --- |
| `gen-skin-css.py` | 由调色板定义重新生成 `claude/skin.css` | 改了配色、字号或 `fonts.generated.css` 之后 |
| `gen-crab.py` | 由像素点阵生成 `claude/crab.generated.css`（问候语旁的小星星） | 改了蟹的画法或配色之后 |
| `gen-clawd-sprite.py` | 由一份 Lottie 动画生成 `brand-plugin` 里的螃蟹精灵图 | 换了源动画之后 |
| `gen-spark-data.py` | 由一份动画数据生成 `brand-plugin` 里的八种星芒形态 | 换了源数据之后 |
| `validate-skin.mjs` | 用真实的 skin-center 清洗器 + 清单校验器验证皮肤 | 每次改动 `claude/` 之后，提交前必跑 |
| `claude/assets/fonts/build-fonts.sh` | 重新下载 4 个 woff2 字体 | 换字体、加字重、或字体文件损坏时 |
| `capture-preview.sh` | 用 headless Chrome 截图做预览图 | 需要已认证 URL，只截亮色 |
| `render-harness/` | 无认证依赖的预览渲染 + 计算样式回读 | 批量重截或回归对比时用；当前预览图是真机截图（见下） |

所有路径都从脚本自身位置推导，因此**必须在任何目录下都能跑**；下面的命令假设当前目录是仓库根。

---

## gen-skin-css.py

`claude/skin.css` 是**生成产物**，不要手改——下次生成会被覆盖。

```bash
python3 scripts/gen-skin-css.py
```

输出：

```
wrote /path/to/dsh-claude-theme/claude/skin.css (24771 bytes)
light tokens: 97   dark tokens: 97   font decls: 182
```

它做四件事：

1. 读取脚本内 `C = dict(...)` 里的调色板常量（`canvas`、`ink`、`coral`、`dark` 等），以及 `LIGHT` / `DARK` 两张 token 映射表（各 97 条）。
2. 读取 `claude/assets/fonts/fonts.generated.css`（由 `build-fonts.sh` 生成），把其中的 `@font-face` 规则原样内联到 `skin.css` 顶部。**该文件不存在会直接抛错**，先跑 `build-fonts.sh`。
3. 拼接字体栈与字号声明（`SERIF` / `SANS` / `MONO` 三个栈、`BODY_SIZES` / `MD_SERIF` / `MD_SANS` / `MD_MONO` 四组字号），展开成 `--dsw-font-*` 与 `--ds-font-*` 声明。
4. 写出 `claude/skin.css`，结构为：`@font-face` 块 → 亮色 `:root { ... }` → 字体 `:root { ... }` → 深色 `body[data-ds-dark-theme] { ... }`。

生成后 `claude/skin.css` 的 token 构成（这是 278 这个数字的来源）：

| 位置 | `--dsw-*` 声明数 | 说明 |
| --- | --- | --- |
| 亮色 `:root` | 97 | 颜色 / 边框 / 标签 / 按钮等别名 token |
| 深色 `body[data-ds-dark-theme]` | 97 | 与亮色**同名同数量**，只换值 |
| 字体 `:root` | 181 | 字族栈 + 字号/字重/行高，另有 1 条非 `--dsw-` 的 `--ds-font-family-code` |
| **去重合计** | **278** | 亮暗两组别名只算一次 |

全文 `--dsw-` 出现 375 次（97 + 97 + 181），`grep -c -- '--dsw-'` 数的是这个值，别拿它当 token 数。

**不依赖 token 自动派生**：加载器的回退派生实际失效（约 190 个未覆盖 token 里只能派生出约 1 个），所以这里所有 token 都显式写出。往 `LIGHT` / `DARK` 里加 token 时保持两边同步。

改完记得跑校验：

```bash
python3 scripts/gen-skin-css.py && node scripts/validate-skin.mjs claude
```

---

## gen-clawd-sprite.py

`brand-plugin/lib/client.js` 里的 `CLAWD_SPRITE` 常量是**生成产物**，不要手改。

```bash
python3 scripts/gen-clawd-sprite.py [源 JSON 路径]
```

默认源是作者本地的 `~/卡工坊/clawd-loading-animation/Clawd-Laptop.json`——一份 108 KB、43 帧、12fps 的 Lottie 动画。

它做四件事：

1. 用 headless Chrome 加载内联的 lottie-web 运行时，把 43 帧逐帧渲染成 PNG（每批 8 帧，避免一个页面挂 43 个实例）。
2. 从渲染结果里回读像素网格。源动画是**逐帧切换**的（349 条静态路径、0 条补间），所以能压到原生格子：**34×23** 格，每格 50 Lottie 单位。
3. 去重——43 帧里只有 **20 个唯一画面**。剩下 23 帧是重复的，用一张序列表指回去。
4. 把 20 帧拼成一张 **1462×23** 的横向精灵图，PNG 编码后 base64 写回常量。

输出形如：

```
frames: 43 (20 unique)
grid:   34 x 23 cells
sprite: 1462 x 23 px
png:    1,203 bytes
```

**为什么要这么绕**：那个 Lottie 要 305 KB 的 lottie-web 才能播，而它只是 20px 的一个图标。压成精灵图后是 **1.2 KB**，用 CSS `steps(43)` 步进，零运行时。代价是丢了矢量性——放大会糊——但指示器只有 20px。

脚本**幂等**：源不变时重跑，写出的常量逐字节相同。

需要 `google-chrome-stable` 在 PATH 上，以及 Python 的 Pillow。

---

## gen-spark-data.py

`brand-plugin/lib/client.js` 里的 `SPARK_ORDER` / `SPARK_DATA` / `SPARK_CSS` 三个常量是**生成产物**，不要手改。

```bash
python3 scripts/gen-spark-data.py [源 JSON 路径]
```

默认源是作者本地的 `~/卡工坊/clawd-loading-animation/spark-animations.json`——一份 JSON，八个键各对应一套 `{svg, width, height, frameCount, speed}`。

和螃蟹不同，这些**本来就是 SVG、本来就逐帧**，所以脚本不渲染任何东西，只做文本变换：

1. **给所有 SVG id 加前缀**。八个条带会内联进同一个文档，而 `orbiting` 定义了 `<clipPath id="a">`——不加前缀的话它的 `url(#a)` 会解析到别的条带的定义上。
2. **生成 `SPARK_DATA`**：每条一个 `{frames, dur, svg}`，SVG 拆成 ≤110 字符的 JS 字符串块。
3. **生成 `SPARK_CSS`**：把 15.55 秒的周期切成八段，每段只有对应条带 `opacity:1`，其余为 0；条带内部各自用 `translateY(-100%)` + `steps(帧数, jump-end)` 滚动。

**两个关键细节**（都在脚本里注释了原因）：

- **先切块、再转义**。如果先转义再切，块边界可能落在反斜杠和它转义的字符之间，产出的字符串字面量根本解析不了。这个 bug 出过一次。
- **相邻槽位之间留 `0.001%` 的间隔**。两个相邻槽位若共用同一个百分比，后一个关键帧会覆盖前一个，结果某条永远不隐藏。

输出形如：

```
thinking    9 frames x  90ms =   810ms
writing     8 frames x  90ms =   720ms
waiting    16 frames x 600ms =  9600ms
...
cycle  : 15550ms
svg    : 162,675 chars
```

**注意 `waiting`**：600ms/帧（1.67fps），而它占 62% 的周期——加权平均只有 5.5fps。这是**官方原值**，不是脚本算错。官方把八种形态设计成按场景单用，连播会把它的低帧率暴露出来。想改的话改源数据的 `speed`，不要改这里。

脚本**幂等**，且带一道校验：生成后如果发现 `RUNNING_CSS` 上方那段注释被吃掉，会**报错退出**而不是静默丢失。

只需要 Python，不需要浏览器。

---

## validate-skin.mjs

不自己实现校验规则，而是**加载真实的 skin-center 模块**，调用它实际使用的两个函数，这样失败会在这里暴露，而不是静默地跑到浏览器里才出问题。

```bash
node scripts/validate-skin.mjs          # 默认校验 ./claude
node scripts/validate-skin.mjs claude   # 同上，显式指定皮肤目录
```

参数是**皮肤目录路径**（含 `skin.json` 的那个目录），不是仓库根。退出码：**全部通过为 0，任一失败为 1**，可直接用于 CI 或 pre-commit。

它按顺序检查三件事：

1. **清单**——调用 `validateSkinManifestV2(manifest)` 校验 `skin.json`。若该模块没有导出这个函数，则退化为只做 JSON 解析。
2. **样式表**——对 `contributes.stylesheet` 和 `contributes.patches` 指向的文件调用 `transformSkinCss(css, { skinId, filename, deriveFallbacks })`，也就是加载器在服务端真正跑的那套清洗 + 作用域化。`deriveFallbacks` 只在主样式表上开启。输出为空视为失败；warning 会打印出来（最多 8 条）。
3. **资产**——扫描两份 CSS 里所有 `url(...)`，确认每个相对路径在皮肤目录内真实存在。

另外会提示 `preview/light.jpg` / `preview/dark.jpg` 是否存在。**缺预览图只是 note，不会导致失败**（只有警告，不计入退出码）。

通过时的输出形如：

```
✓ skin.json: PASS (v2 validator)
✓ skin.css: PASS  (24771 -> 47401 bytes, 0 warning(s))
✓ patches.css: PASS  (9067 -> 11384 bytes, 0 warning(s))
✓ assets: 4 referenced, 0 missing
```

注意 `skin.css` 的字节数会从约 24.7 KB 涨到约 47 KB——作用域化要给每条选择器加上 `html[data-dsh-skin="claude"]` 前缀，几乎翻倍。

这里打印的是 **JavaScript 字符串长度（字符数）**，不是 UTF-8 字节数。HTTP 接口送出的同一份 CSS 会大几个字节，因为 `—`、`§`、`…` 这类字符一个占 3 字节。两个数字对不上是正常的，别当成 bug。

脚本会**自己找** skin-center，顺序是：

1. `$SKIN_CENTER_DIR`（显式覆盖，直接指向包目录）
2. `$DSH_HOME/profiles/*/node_modules/@linxin666/dsh-client-ui-skin-center`（遍历所有 profile，不只是 `web`）
3. DSH 安装目录自带的 `node_modules`

其中 `$DSH_HOME` 默认 `~/.dsh`，与 [INSTALL.md](../INSTALL.md) 的约定一致。找不到就列出所有尝试过的路径并以 **退出码 2** 结束（区别于校验失败的 1）。手动指定：

```bash
SKIN_CENTER_DIR=/path/to/dsh-client-ui-skin-center node scripts/validate-skin.mjs
```

---

## claude/assets/fonts/build-fonts.sh

重新下载内置字体，并重新生成 `fonts.generated.css`（`gen-skin-css.py` 会读它）。

```bash
bash claude/assets/fonts/build-fonts.sh
```

脚本会 `cd` 到自身所在目录，所以从哪跑都行。它：

1. 用固定的桌面 Chrome User-Agent 请求 Google Fonts `css2` 接口。**UA 是关键**：不带现代浏览器 UA 的话 Google 会返回 ttf 而不是 woff2。
2. 用 `awk` 只保留 `/* latin */` 那一段（丢掉 cyrillic / greek / vietnamese 等子集），提取 `font-style`、`font-weight` 区间和 woff2 URL。
3. 下载 woff2，文件名为 `<字族小写>-<样式>.woff2`，**已存在则跳过**（想强制重下就先删掉对应文件）。
4. 每个（字族, 样式）写一条 `@font-face` 到 `fonts.generated.css`，`src` 用**相对路径** `assets/fonts/<file>`——加载器拒绝远程 URL（422），相对路径是唯一可行写法。
5. 打印每个文件大小与合计。

三个字族都是可变字体，一个文件覆盖整个字重区间：

| 字族 | css2 请求 | 产物 |
| --- | --- | --- |
| Newsreader | `ital,opsz,wght@0,6..72,200..800;1,6..72,200..800` | `newsreader-normal.woff2`、`newsreader-italic.woff2` |
| Inter | `wght@100..900` | `inter-normal.woff2` |
| JetBrains Mono | `wght@100..800` | `jetbrains-mono-normal.woff2` |

合计约 364 KB。**需要联网**，且 Google Fonts 的接口结构变了脚本就会失效（它依赖 `/* latin */` 这个注释块的格式）。

中文字体有意不在此列：CJK 每字重约 20 MB，随包分发不现实，中文回退到系统 `Noto Serif CJK SC`。

---

## capture-preview.sh

给 `claude/preview/` 生成截图，**需要一条已认证的 DSH Web URL**。

```bash
bash scripts/capture-preview.sh <已认证的-DSH-URL> [输出目录]
```

- 第一个参数必填，是**带认证信息的 DSH Web URL**。不带认证信息服务器直接返回 401。
- 第二个参数可选，默认写到 `claude/preview/`。
- 用 headless Chrome（依次找 `google-chrome-stable`、`chromium`、`google-chrome`），窗口 1440×900。

已知限制：**只截亮色**，而 `skin.json` 声明了亮暗两张；深色那张要另截一次。

### 当前 `claude/preview/` 里是什么

现在是**真机截图**（1920×1080，亮暗各一张，人手在真机上截的）——不是这个脚本
也不是 render-harness 产出的。原因：这个 Web 服务器的认证 cookie 用**每次启动
生成的密钥**签名（见 `dsh-client-connection/lib/index.js` 的 `isAuthenticated`），
无头浏览器拿不到认证，除非重启服务器重新拿 URL——为了截图去动用户正在跑的会话
不值得，不如直接手截。

这两个自动化路径仍然保留，供想批量重截或做回归对比时用；render-harness 走的路是
拉取皮肤中心**真实吐出的** `skin.css` 与 `patches.css`、铺上官方默认令牌值再渲染，
测出来的计算样式和真实界面一致。详见 `scripts/render-harness/README.md`。

## render-harness/

无认证依赖的预览渲染路径，可产出 `claude/preview/light.jpg` 与 `dark.jpg`，并能在 DOM 里回读计算样式用于断言（`#PROBE` 元素）。当前仓库里的预览图不是它产出的（见上）。

## check-settings-controls.sh

小插件的**设置页回归测试**。

```bash
scripts/check-settings-controls.sh
```

它在无头 Chrome 里挂载每个插件**真实的**设置组件，操作它的控件，然后断言组件操作后**仍然挂载**。

防的是这一类 bug：插件的订阅者集合里混着 React 的 state setter，如果通知时不带参数，setter 就把 state 存成 `undefined`，下一次渲染读它上面的属性会抛错，React 卸载整棵树——**用户刚碰的那个控件就不动了，看起来像卡死**。

这个 bug 在 Clawd 插件和字体切换器里**各出现了一次**，所以有这个脚本。

两个插件都不打包 React（由宿主提供），所以脚本临时从 unpkg 拉 UMD 构建。需要 `google-chrome-stable` 在 PATH 上，或用 `CHROME=` 指定。

退出码 0 = 全部通过，1 = 有控件操作后挂掉，2 = 环境缺 Chrome 或拉不到 React。

---

## 典型改动流程

改了配色：

```bash
python3 scripts/gen-skin-css.py \
  && node scripts/validate-skin.mjs claude \
  && cp -r claude "$HOME/.dsh/skins/claude" \
  && curl -s http://127.0.0.1:3080/api/skin-center/v2/catalog \
     | python3 -c "import json,sys; print([s.get('warnings') for s in json.load(sys.stdin)['skins'] if s['manifest']['id']=='claude'])"
```

最后一行应打印 `[[]]`——空 warnings 列表。

只改了 `patches.css`：直接跑 `validate-skin.mjs`，然后拷贝到 `$DSH_HOME/skins/claude/`。皮肤中心在每次 HTTP 请求时重新读盘并重新跑一遍清洗流程（`serveStylesheet` 里没有缓存层），所以拷完刷新页面即可看到效果，不需要重启。
