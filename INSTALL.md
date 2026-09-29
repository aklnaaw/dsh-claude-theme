# 安装指南

面向人和 AI agent，每一步都可以直接复制执行。约定：

- `$DSH_HOME` 是 DSH 的数据目录，默认 `~/.dsh`。**先解析它，不要硬编码**：

  ```bash
  DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
  echo "$DSH_HOME"
  ```

- 本文假设 GUI 在 `http://127.0.0.1:3080`。端口不同的话把下面的 URL 一起换掉。
- 仓库路径以 `/path/to/dsh-claude-theme` 代指，实际用本仓库的绝对路径。

**皮肤有两种装法，二选一**：

- **装法一：第三方皮肤中心** `@linxin666/dsh-client-ui-skin-center`（本皮肤在该插件的 **v0.3.23** 上测试）。在它的市场里搜 Claude 装上即可，第 4 步选中。第 1 步的手动拷贝可以跳过。
- **装法二：独立皮肤插件** `plugins/skin/`，**不需要皮肤中心**。它首次加载时会自己把皮肤装好，第 1–4 步都不用手动做，见下文第 5 步。

两种装法**不要同时用**（会各自注入一遍同一套样式表）。第 6–8 步的三个插件**都不经过皮肤中心**，只装插件的话前面的皮肤步骤都可以跳过。

检查皮肤中心是否已装（装法二不需要）：

```bash
cat "$DSH_HOME/profiles/web/node_modules/@linxin666/dsh-client-ui-skin-center/package.json" \
  | grep '"version"'
```

---

## 第 1 步：安装皮肤（手动，装法一可选）

> 走**装法二**（独立插件）的话整步跳过——插件会自己装好。
> 走**装法一**且从市场下载的话也跳过。只有想手动放置皮肤时才需要这一步。

皮肤是纯资源目录：拷贝即可，不需要构建、不需要安装依赖。

```bash
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
mkdir -p "$DSH_HOME/skins"

# 目录名必须是 claude（清单里的 id 与目录名一致）
rm -rf "$DSH_HOME/skins/claude"
cp -r /path/to/dsh-claude-theme/claude "$DSH_HOME/skins/claude"
```

装法二的插件走的是同一套逻辑，只是它把「只拷运行时需要的文件、不覆盖已有文件」
做在代码里：两份样式表、`skin.json`、4 个 woff2 字体、`LICENSE`——
生成器的输入不会进你的皮肤目录。

安装后的布局：

```
$DSH_HOME/
├── skins/
│   └── claude/                 # ← 皮肤装在这里
│       ├── skin.json
│       ├── skin.css
│       ├── patches.css
│       ├── assets/fonts/*.woff2
│       └── preview/
└── skin-center-active.json     # 当前选中的皮肤 id（由皮肤中心读写）
```

也就是说：**皮肤的根目录就是 `$DSH_HOME/skins/<id>/`，`skin.json` 直接位于其中**，不要再套一层目录。

---

## 第 2 步：确认皮肤被发现

皮肤中心有一个目录接口，直接问它：

```bash
curl -s http://127.0.0.1:3080/api/skin-center/v2/catalog \
  | python3 -c "
import json,sys
skins = json.load(sys.stdin)['skins']
hit = [s for s in skins if s['manifest']['id'] == 'claude']
if not hit:
    print('NOT FOUND — 皮肤未被发现'); raise SystemExit(1)
s = hit[0]
print('id       :', s['manifest']['id'])
print('origin   :', s.get('origin'))       # 本地安装应为 user
print('warnings :', s.get('warnings'))     # 必须为空
print('name     :', s['manifest']['name'])
"
```

期望输出：

```
id       : claude
origin   : user
warnings : []
```

**判定标准：`warnings` 必须是空数组 `[]`。** 非空说明清单声明了磁盘上不存在的文件，或 CSS 被清洗器拒绝了内容——`warnings` 里会写原因，先修那个再看效果。

---

## 第 3 步：确认 CSS 被正确送出

皮肤中心把清洗、作用域化之后的 CSS 从这些路径送出（注意用的是**清洗后**的字节数，不是源文件大小）：

```bash
for u in \
  /api/skin-center/v2/skins/claude/stylesheet \
  /api/skin-center/v2/skins/claude/patches \
  /api/skin-center/v2/skins/claude/assets/fonts/inter-normal.woff2 \
; do
  printf '%-58s HTTP %s  %s bytes\n' "$u" \
    "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3080$u")" \
    "$(curl -s "http://127.0.0.1:3080$u" | wc -c)"
done
```

期望（三个都是 HTTP 200）：

| 路径 | 说明 | 期望字节数 |
| --- | --- | --- |
| `/api/skin-center/v2/skins/claude/stylesheet` | 清洗并作用域化后的 `skin.css` | 47410 |
| `/api/skin-center/v2/skins/claude/patches` | 清洗后的 `patches.css` | 一万出头（该文件仍在改动，不锁定具体值） |
| `/api/skin-center/v2/skins/claude/assets/fonts/inter-normal.woff2` | 字体资产 | 48256 |

字节数量级对不上也没关系，**关键是不能 404**。404 说明清单里的 `contributes` 与实际文件不匹配。

一个容易踩的坑：**送出的字节数会比 `validate-skin.mjs` 打印的数字大几个到几十个字节**。校验器打印的是 JavaScript 字符串长度（字符数），而 HTTP 响应是 UTF-8 字节数；CSS 里的 `—`、`§`、`…` 这类字符一个占 3 字节。别把这个差值当成内容不一致。

确认 CSS 内容确实是本皮肤：

```bash
curl -s http://127.0.0.1:3080/api/skin-center/v2/skins/claude/stylesheet | head -5
curl -s http://127.0.0.1:3080/api/skin-center/v2/skins/claude/stylesheet \
  | grep -o -- '--dsw-[a-z0-9-]*' | sort -u | wc -l     # 应输出 278
```

**278 是去重后的 token 名数量**，这是判定皮肤完整的关键数字。不要用 `grep -c -- '--dsw-'`——那个数的是出现次数，送出的 CSS 里是 743（本地源文件里是 375），含义不同。

---

## 第 4 步：选中皮肤（装法一：皮肤中心）

在 GUI 里打开 **设置 → 皮肤中心**，选中 **Claude**。

切换是在页面内原子完成的：不刷新、不重启。当前选中的 id 会被写进：

```
$DSH_HOME/skin-center-active.json
```

也可以直接确认：

```bash
curl -s http://127.0.0.1:3080/api/skin-center/v2/active
# {"ok":true,"active":"claude", ...}
```

> 走**装法二**（独立皮肤插件）的话跳过这一步，直接看第 5 步。

---

## 第 5 步：独立皮肤插件（装法二，与装法一互斥）

不想为了一个皮肤装整套皮肤中心的话，用这个。**第 1–4 步都可以整段跳过**——插件会在首次加载时自己把皮肤装到 `$DSH_HOME/skins/claude`。

```bash
dsh plugin --profile web add link:/path/to/dsh-claude-theme/plugins/skin
# 然后重启 DSH 一次
```

重启后在 **设置 → Claude-X** 里选中 Claude。

- 包名 `dsh-claude-skin`。
- **自己装皮肤**：按插件自身位置解析到仓库的 `claude/`，只拷运行时需要的 8 个文件（两份样式表、`skin.json`、4 个 woff2 字体、`LICENSE`），**只补缺、不覆盖**已有文件。所以重复加载或升级插件都不会动你改过的东西。
- 它只做三件事：读皮肤目录、按[作用域契约](plugins/skin/README.md)注入样式表、把皮肤自带的字体和图片用路由送出去。
- **不依赖皮肤中心**，也**不依赖**品牌插件或 Clawd 插件。
- **不做 CSS 白名单过滤**（皮肤中心会拒绝远程 URL、`@import`、逃逸皮肤目录的路径）。只适合跑自己写的皮肤。

确认它进了 bundle 列表，并且皮肤已经被播种：

```bash
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
python3 -c "
import json, os
p = json.load(open(os.path.join(os.environ['DSH_HOME'], 'profiles/web/package.json')))
print('dependencies:', [k for k in p['dependencies'] if 'claude-skin' in k])
print('bundles     :', [b for b in p['dsh']['profile']['bundles'] if 'claude-skin' in b])
"
ls "$DSH_HOME/skins/claude/skin.json" && echo '  ↑ 皮肤已就位'
```

顺带确认样式表真的被正确处理了。**页面需要登录 cookie**，裸请求会 401，所以先在本机浏览器里登录一次，把 cookie 导出成 Netscape 格式的 `cookies.txt`，再跑：

```bash
python3 -c "
import re
raw = open('served.html', encoding='utf8').read()   # curl -b cookies.txt http://127.0.0.1:3080/ -o served.html
blocks = re.findall(r'<style>(.*?)</style>', raw, re.S)
skin = [b for b in blocks if 'data-dsh-skin' in b]
print('注入的皮肤样式块数:', len(skin))
print('html 属性:', re.search(r'<html[^>]*>', raw).group(0))
print('裸 :root 选择器:', bool(re.search(r'(^|[\n}])\s*:root\s*[,{]', re.sub(r'html\[data-dsh-skin=\"[a-z0-9-]+\"\]', '', skin[0] if skin else ''))))
"
```

期望输出（本机实测）：

```
注入的皮肤样式块数: 1
html 属性: <html lang="en" data-dsh-skin="claude">
裸 :root 选择器: False
```

第三行是重点：`False` 说明样式表被正确改了作用域。若为 `True`，皮肤会看起来**完全没生效**。

懒得跑脚本的话，直接开页面按 F12，在 Elements 里看 `<html>` 有没有 `data-dsh-skin="claude"`，再看 `<head>` 里有没有一个装着皮肤样式表的 `<style>`。

---

## 第 6 步：安装 Claude（星芒）插件

> 已在本机真实页面验证生效；尚未在干净环境里装过一遍。

```bash
dsh plugin --profile web add link:/path/to/dsh-claude-theme/brand-plugin
```

- 包名 `dsh-claude-brand`。
- `link:` 前缀让 pnpm 以符号链接方式接入本地目录，改代码不用重装。
- 必须带 `--profile web`；`dsh plugin` 的 profile 是必填参数。
- 用**绝对路径**。相对路径（`.`、`../brand-plugin`）会被 `dsh` 相对调用目录改写成绝对路径，但写绝对路径最不容易出错。

**然后重启 DSH 一次。** 客户端插件在进程启动时加载，不能热切换——不重启的话插件不会出现在页面里。

重启后确认它进了 profile 的 bundle 列表：

```bash
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
python3 -c "
import json, os
p = json.load(open(os.path.join(os.environ['DSH_HOME'], 'profiles/web/package.json')))
print('dependencies:', [k for k in p['dependencies'] if 'brand' in k.lower()])
print('bundles     :', [b for b in p['dsh']['profile']['bundles'] if 'brand' in b.lower()])
"
```

两处都应出现 `dsh-claude-brand`（bundle 列表由 `dsh plugin` 按已安装状态自动调和，只有声明了 `dsh.bundle.patch` 的包才会进入这一层）。

验证插件是否真的生效：页面侧边栏的鲸鱼 logo 应变成星芒标记、品牌文字应变成 "Claude"、浏览器标签标题里不应再有 "DeepSeek Harness"、浏览器标签页图标应从鲸鱼变成星芒。**没重启的话这四处都不会变。**

卸载：

```bash
dsh plugin --profile web remove dsh-claude-brand
# 然后重启 DSH
```

## 第 7 步：安装 Clawd 插件

```bash
dsh plugin --profile web add link:/path/to/dsh-claude-theme/crab-plugin
```

- 包名 `dsh-claude-crab`。
- 同样用 `link:` + **绝对路径**，同样必须带 `--profile web`。
- 这个插件**不依赖皮肤**：像素帧数据内置，配色走官方 `--dsw-*` 变量。只装它、不装皮肤也能用。

**同样需要重启 DSH 一次**（客户端插件不能热切换）。

重启后确认它进了 profile：

```bash
python3 -c "
import json, os
p = json.load(open(os.path.join(os.environ['DSH_HOME'], 'profiles/web/package.json')))
print('dependencies:', [k for k in p['dependencies'] if 'crab' in k.lower()])
print('bundles     :', [b for b in p['dsh']['profile']['bundles'] if 'crab' in b.lower()])
"
```

验证：输入框上沿应出现一只像素蟹。鼠标靠近时它的眼睛会朝四个方向看，停一会儿会眨眼，**戳一下会跳起来说一句话**。

蟹只在插件里——皮肤不画蟹，所以不会出现两只；若蟹没出现，看控制台有没有 `[dsh-claude-crab]` 开头的警告。

卸载：

```bash
dsh plugin --profile web remove dsh-claude-crab
# 然后重启 DSH
```

---

## 第 8 步：安装字体切换插件（可选）

想换掉 Claude 皮肤的三组字体（正文衬线、界面无衬线、代码等宽）时装这个。

```bash
dsh plugin --profile web add link:/path/to/dsh-claude-theme/plugins/font-switcher
# 同样重启 DSH 一次
```

- 包名 `dsh-font-switcher`。
- 用**绝对路径** + `--profile web`，与前面几个插件相同。
- 它不引用皮肤插件的代码，只按约定读 `$DSH_HOME/claude-skin.json` 决定字体文件夹（缺席时退回 `skin-center-active.json`，再退回 `claude`）。
- **字体文件不随仓库分发**，需要自己准备并放进文件夹。

用法：打开 **设置 → 字体**，把字体文件丢进页面显示的文件夹
（默认 `$DSH_HOME/skins/claude/assets/fonts/custom/`），回来点 **重新扫描**。
用途可以靠子文件夹（`serif/`、`sans/`、`mono/`）或文件名关键词标明，认中文。
详见 [`plugins/font-switcher/README.md`](plugins/font-switcher/README.md)。

卸载：

```bash
dsh plugin --profile web remove dsh-font-switcher
# 然后重启 DSH
```

字体文件夹不会被动，可以留着。

---

## 排错

| 现象 | 可能原因 | 处理 |
| --- | --- | --- |
| 皮肤中心里看不到 Claude | 目录层级错了：`skin.json` 必须直接在 `$DSH_HOME/skins/claude/` 下 | `ls "$DSH_HOME/skins/claude/skin.json"` 应存在；若变成 `skins/claude/claude/skin.json` 就把内层内容提上来 |
| 同上 | 目录名与清单 id 不一致 | 目录必须叫 `claude`（对应 `skin.json` 的 `"id": "claude"`） |
| 同上 | `$DSH_HOME` 不是你以为的那个目录 | `echo "${DSH_HOME:-$HOME/.dsh}"`；装了 `DSH_HOME` 环境变量的进程和 GUI 进程必须是同一个值 |
| 同上 | 皮肤中心插件没装 | 检查 `$DSH_HOME/profiles/web/node_modules/@linxin666/dsh-client-ui-skin-center` |
| 列表里有，但 `warnings` 非空 | 清单声明了磁盘上不存在的文件，或 CSS 被清洗器拒绝 | 看 `warnings` 里的文件名/原因；跑 `node scripts/validate-skin.mjs claude` 在本地复现 |
| 列表里有、warnings 为空，但界面没变化 | 没选中：`skin-center-active.json` 里的 `active` 不是 `claude` | 在设置里重新选一次，或 `curl -s http://127.0.0.1:3080/api/skin-center/v2/active` 确认 |
| 同上 | 浏览器缓存了旧 CSS | 硬刷新（Ctrl+Shift+R） |
| 同上 | CSS 被吞了 | `curl -s .../skins/claude/stylesheet \| wc -c` 若是 0，说明清洗后为空，回第 3 步 |
| 字体没加载（正文不是衬线体） | 字体文件缺失或路径不对 | `ls -la "$DSH_HOME/skins/claude/assets/fonts/"` 应有 4 个 woff2；`curl -o /dev/null -w '%{http_code}' .../claude/assets/fonts/inter-normal.woff2` 应为 200 |
| 同上 | 浏览器阻止了字体 | 开 DevTools → Network 过滤 `woff2`，看是否有 404/被拒；再开 Console 看有没有 CSP 报错 |
| 同上 | 只有中文不对 | 这是预期行为：中文回退到系统 `Noto Serif CJK SC`，没有装该字体的系统会退到 `Songti SC` 或通用衬线 |
| 插件装完不出现 | 没有重启 DSH | 重启一次；客户端插件不支持热加载 |
| 同上 | 没进 bundle 层 | 确认 `brand-plugin/package.json` 声明了 `dsh.bundle.patch`；纯依赖不会被激活为 profile 层 |
| 同上 | 插件加载报错 | 看 DSH 启动日志里的客户端插件错误 |
| 插件加载了但界面没变 | 用了相对路径且解析到了别处 | `ls -la "$DSH_HOME/profiles/web/node_modules/" \| grep brand`，符号链接应指向 `brand-plugin` 的真实目录 |
| 同上 | slot 被别的插件占着 | 插件的 slot 优先级是 -10，同优先级注册 `single` slot 会抛错；看 Console |
| 设置里找不到 **Claude-X** | 独立皮肤插件没装或没重启 | 检查 `$DSH_HOME/profiles/web/node_modules/dsh-claude-skin` 存在且 bundle 列表里有 `dsh-claude-skin`，然后重启 DSH |
| 独立皮肤插件装了，皮肤没生效 | 样式表没被作用域化 | 跑第 5 步末尾的脚本：应看到 `<html … data-dsh-skin="claude">`，且「裸 :root 选择器」为 `False` |
| 皮肤装了两遍 / 样式冲突 | 皮肤中心与独立插件同时装着 | 卸掉一个：`dsh plugin --profile web remove dsh-claude-skin`（或停用皮肤中心），然后重启 |
| 设置里找不到 **字体** | 字体切换插件没装或没重启 | 检查 bundle 列表里有 `dsh-font-switcher`，然后重启 DSH |
| 字体换了没反应 | 字体文件没被扫描到，或皮肤没装 | 确认文件在 `$DSH_HOME/skins/claude/assets/fonts/custom/` 下且后缀受支持（`.woff2`/`.woff`/`.ttf`/`.otf`），点「重新扫描」；没装皮肤时字体没有可见效果 |
| 想回到之前的皮肤 | — | 见下面「回滚」 |

---

## 回滚

皮肤中心把选择存在一个纯 JSON 文件里，直接改它就行：

```bash
# 1. 看当前值
cat "$DSH_HOME/skin-center-active.json"
```

```json
{
  "active": "claude",
  "initialized": true,
  "background": { "enabled": false, "backgroundOpacity": 0, "backgroundBlurEmpty": 0, "backgroundBlurContent": 0, "inputCardBlur": 0, "bubbleOpacity": 0, "bubbleBlur": 0 }
}
```

把 `"active"` 改成上一个皮肤的 id。出厂默认皮肤是 **`blue-fantasy`**（要回到出厂观感就填它）。列出本机已装的其他皮肤：

```bash
ls "$DSH_HOME/skins/"
```

改文件（保留 `background` 段，别整份覆盖）：

```bash
python3 - <<'PY'
import json, os, pathlib
p = pathlib.Path(os.environ.get("DSH_HOME", pathlib.Path.home() / ".dsh")) / "skin-center-active.json"
doc = json.loads(p.read_text())
doc["active"] = "blue-fantasy"          # ← 换成要回滚到的 id
p.write_text(json.dumps(doc, indent=2) + "\n")
print(p, "->", doc["active"])
PY
```

刷新页面即可生效。

**走装法二（独立皮肤插件）的话，选中的皮肤存在另一个文件**，格式更简单：

```bash
cat "$DSH_HOME/claude-skin.json"
# {"active": "claude"}
```

```bash
python3 - <<'PY'
import json, os, pathlib
p = pathlib.Path(os.environ.get("DSH_HOME", pathlib.Path.home() / ".dsh")) / "claude-skin.json"
doc = json.loads(p.read_text())
doc["active"] = "blue-fantasy"          # ← 换成要回滚到的 id
p.write_text(json.dumps(doc, indent=2) + "\n")
print(p, "->", doc["active"])
PY
```

重新加载页面即可（这一个装法的样式表在每次索引渲染时重读，改完不用重启）。

要彻底卸载本皮肤：

```bash
rm -rf "$DSH_HOME/skins/claude"
```

（先确保上面那个 `active` 不是 `claude`，否则页面会退回出厂观感。）

要卸载独立皮肤插件本身：

```bash
dsh plugin --profile web remove dsh-claude-skin
# 然后重启 DSH
```

卸载 Claude 插件：

```bash
dsh plugin --profile web remove dsh-claude-brand
# 然后重启 DSH
```

卸载 Clawd 插件：

```bash
dsh plugin --profile web remove dsh-claude-crab
# 然后重启 DSH
```

四个产物互相独立，可以只卸其中任意一个。卸掉 Clawd 插件后输入框上沿就没有蟹了——皮肤不画蟹（蟹只在插件里）。卸掉皮肤插件不影响蟹和星芒，只是没有皮肤配色。
