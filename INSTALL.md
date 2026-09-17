# 安装指南

面向人和 AI agent，每一步都可以直接复制执行。约定：

- `$DSH_HOME` 是 DSH 的数据目录，默认 `~/.dsh`。**先解析它，不要硬编码**：

  ```bash
  DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
  echo "$DSH_HOME"
  ```

- 本文假设 GUI 在 `http://127.0.0.1:3080`。端口不同的话把下面的 URL 一起换掉。
- 仓库路径以 `/path/to/dsh-claude-theme` 代指，实际用本仓库的绝对路径。

前置条件：皮肤中心插件 `@linxin666/dsh-client-ui-skin-center` 已安装。本皮肤在该插件的 **v0.3.23** 上测试。检查：

```bash
cat "$DSH_HOME/profiles/web/node_modules/@linxin666/dsh-client-ui-skin-center/package.json" \
  | grep '"version"'
```

---

## 第 1 步：安装皮肤

皮肤是纯资源目录：拷贝即可，不需要构建、不需要安装依赖。

```bash
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
mkdir -p "$DSH_HOME/skins"

# 目录名必须是 claude（清单里的 id 与目录名一致）
rm -rf "$DSH_HOME/skins/claude"
cp -r /path/to/dsh-claude-theme/claude "$DSH_HOME/skins/claude"
```

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

## 第 4 步：选中皮肤

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

---

## 第 5 步：安装品牌插件

> **尚未验证**：代码已写好，但还没确认过页面里的实际效果，也没在干净环境里装过。下面流程是按仓库当前状态写的。

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

验证插件是否真的生效：页面侧边栏的鲸鱼 logo 应变成星芒标记、品牌文字应变成 "Claude"、浏览器标签标题里不应再有 "DeepSeek Harness"。**没重启的话这三处都不会变。**

卸载：

```bash
dsh plugin --profile web remove dsh-claude-brand
# 然后重启 DSH
```

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

要彻底卸载本皮肤：

```bash
rm -rf "$DSH_HOME/skins/claude"
```

（先确保 `skin-center-active.json` 的 `active` 不是 `claude`，否则页面会退回出厂观感。）

卸载品牌插件：

```bash
dsh plugin --profile web remove dsh-claude-brand
# 然后重启 DSH
```
