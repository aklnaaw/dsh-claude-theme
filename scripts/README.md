# scripts/

皮肤仓库的维护脚本。日常安装用不到它们——**装皮肤只需要拷贝 `claude/` 目录**。

| 脚本 | 作用 | 何时跑 |
| --- | --- | --- |
| `gen-skin-css.py` | 由调色板定义重新生成 `claude/skin.css` | 改了配色、字号或 `fonts.generated.css` 之后 |
| `validate-skin.mjs` | 用真实的 skin-center 清洗器 + 清单校验器验证皮肤 | 每次改动 `claude/` 之后，提交前必跑 |
| `claude/assets/fonts/build-fonts.sh` | 重新下载 4 个 woff2 字体 | 换字体、加字重、或字体文件损坏时 |
| `capture-preview.sh` | 用 headless Chrome 截图做预览图 | 需要已认证 URL，只截亮色 |
| `render-harness/` | 无认证依赖的预览渲染 + 计算样式回读 | 实际产出 `claude/preview/` 的就是它 |

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

### 实际用的是 render-harness

`claude/preview/` 里那两张图**不是**这个脚本产出的，而是 `scripts/render-harness/` 产出的。原因：这个 Web 服务器的认证 cookie 用**每次启动生成的密钥**签名（见 `dsh-client-connection/lib/index.js` 的 `isAuthenticated`），无头浏览器拿不到，除非重启服务器重新拿 URL——为了截图去动用户正在跑的会话不值得。

实验台改走另一条路：直接拉取皮肤中心**真实吐出的** `skin.css` 与 `patches.css`，铺上官方默认令牌值，再渲染。因此测出来的计算样式和真实界面一致。详见 `scripts/render-harness/README.md`。

## render-harness/

无认证依赖的预览渲染路径，产出 `claude/preview/light.jpg` 与 `dark.jpg`，并能在 DOM 里回读计算样式用于断言（`#PROBE` 元素）。

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
