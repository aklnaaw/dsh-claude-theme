# dsh-claude-skin

把 Claude 皮肤装回来 —— 不需要皮肤中心。

## 它是什么

这个插件做五件事：

1. **自动装好皮肤**：首次加载时把仓库里的 `claude/` 拷进 `$DSH_HOME/skins/claude`，
   装完就能用，不用手动拷贝。只补缺、不覆盖——已经存在的文件原样留着，
   所以重复加载或升级插件都不会动你改过的东西。
2. **注入皮肤样式表**：读 `$DSH_HOME/skins/<id>/skin.css` 与 `patches.css`，
   过一遍[作用域契约](#样式表为什么要改写)，再通过官方的
   `webserver/index-inject` 索引注入表塞进页面 ——
   用的是官方 `ui-theme` 同一个扩展点，不是私有手段。
3. **戳 `<html>` 属性**：通过官方的 `webServer.tapIndex` 给根元素盖上
   `data-dsh-skin="<id>"`。注入表改不了 html 标签本身，所以只能走这一层。
4. **送资产**：皮肤自带的 woff2 字体与 webp 图都由插件开路由提供。
   样式表里的相对路径 `url(assets/fonts/x.woff2)` 内联后会解析到站点根目录
   （那里没有这个文件），所以插件在注入前把它改写成路由地址。
5. **管皮肤**：列出 `$DSH_HOME/skins/` 下所有装了 `skin.json` 的目录，
   并提供切换。

## 为什么不用皮肤中心

皮肤中心是一个**大包**：它同时带着皮肤目录、背景控制、市场集成、桌面壁纸桥、
一大片设置界面。只想留下皮肤本身。皮肤是纯资产目录（一份 CSS + 字体），
所以一个约 300 行的插件就够了。它和品牌插件、蟹插件是两回事——那些是
独立的 Cordis 客户端插件，见它们各自的 README。

代价要说清：皮肤中心除了作用域改写，还做 **fail-closed 白名单过滤**
（远程 URL、`@import`、逃出皮肤目录的路径一律拒绝）。这里只做作用域改写。
见[已知限制](#已知限制)。

## 设置

设置 → **Claude-X**，一个页面同时管两件事：

- **皮肤**：列出已安装的皮肤，点一下切换。切换后页面自动重新加载
  （样式表是在页面渲染时注入的，所以新皮肤在下一个文档生效）。
- **名字**：首页问候语和侧栏底部显示的名字、副标题、头像。

名字存在浏览器 localStorage 的 `dsh-claude-brand.prefs`，与品牌插件共用同一份
记录 —— 它只改显示，不涉及账号，也不上传到任何地方。

## 安装

```sh
dsh plugin --profile web add link:/path/to/dsh-claude-theme/plugins/skin
```

装完重启 DSH，皮肤就已经在 `$DSH_HOME/skins/claude` 了，直接选中即可。

或者直接写进 profile 的 `package.json`（本机用的就是这种）：

```json
"dsh-claude-skin": "link:/path/to/dsh-claude-theme/plugins/skin"
```

并加进 `dsh.profile.bundles`。

**从哪拷的**：插件按自身位置解析到仓库的 `claude/`（上溯三级），因此
`link:` 安装是前提。只拷运行时需要的 8 个文件（两份样式表、`skin.json`、
4 个 woff2 字体、`LICENSE`），生成器的输入（`patches.base.css`、
`crab.generated.css`、`build-fonts.sh` 等）不会进你的皮肤目录。
单独把插件发布到 npm 的话仓库不在旁边，这一步会静默跳过。

## 它挂在哪

| 扩展点 | 用途 |
| --- | --- |
| `webserver/index-inject`（事件） | 注入 `<style>`，官方索引注入表 |
| `webServer.tapIndex`（宿主） | 给 `<html>` 戳 `data-dsh-skin="<id>"` |
| `connection.fetch.register`（宿主路由） | `/api/dsh-claude-skin/{asset,skins,active}` |
| `settings.section`（客户端槽） | 设置里的 **Claude-X** 页 |

路由走 `connection.fetch`，因此继承会话鉴权；资产名按目录实际清单校验，
路径穿越会 400/404。

## 与其他插件的边界

这个插件只负责**皮肤本身**。仓库里其他插件各有各的活，互不引用代码、
各用各的存储键：

| 插件 | 管什么 | 设置页 | 存储键 |
| --- | --- | --- | --- |
| `plugins/skin`（本插件） | 皮肤的装载、注入、资产、切换 | Claude-X | — |
| `brand-plugin` | 星芒标记、字标、问候语、标题图标 | —（侧栏底部弹层） | `dsh-claude-brand.prefs` |
| `crab-plugin` | 可交互的像素蟹 | Clawd | `dsh-claude-crab.prefs` |
| `plugins/font-switcher` | 换三组字体 | 字体 | `dsh-font-switcher.selection` |

唯一的交叉：Claude-X 页里那几栏**名字/副标题/头像**，读写的是品牌插件的
`dsh-claude-brand.prefs`（两个插件读同一份记录、写完互相通知）。那是显示
层共用的数据，不是功能依赖——卸掉品牌插件，本插件照常工作，只是那几栏
改的值没人显示了。

## 样式表为什么要改写

皮肤是**为加载器写的**，不是为直接内联写的。原样内联会让页面看起来完全没变，
所以每张样式表都要过一遍作用域契约（`lib/css-contract.js`）。两件事都不可省：

1. **加作用域**：每条选择器改写到 `html[data-dsh-skin="<id>"]` 之下，
   同时在 `tapIndex` 里给 `<html>` 戳上同名属性。缺属性，改写后的选择器不匹配
   任何元素；缺改写，光有属性也没用。
2. **亮色令牌要落在 body 上**：官方主题把 `--dsw-alias-*` 声明在 `body{…}`，
   深色变体在 `body[data-ds-dark-theme]{…}`。皮肤如果把亮色调色板放在 `:root`，
   **会输**——而且不是文档顺序问题：`:root` 与 `body` 特异性相同，但 `body`
   自身的声明会压过从 `html` 继承来的值。皮肤自己的深色块反而能赢（它是带属性的
   body 规则），所以症状就是「深色正常、亮色完全没变」。因此变换会把根级声明的
   令牌在作用域上重置，并克隆到 `body`。

这套改写的目标输出与皮肤中心的加载器**逐字节一致**——已装的皮肤正是对着那个输出
写的，任何偏差都会表现为「在这里和以前长得不一样」。回归防线有两条
（**都从仓库根目录运行**）：

```sh
node --test plugins/skin/test/                       # 契约单测（不需要皮肤中心）
node scripts/compare-with-skin-center.mjs            # 逐字节对比全部已装皮肤
```

快照表 `lib/official-tokens.js` 是生成的，皮肤中心升级后用
`node scripts/extract-official-tokens.mjs` 重新生成。

## 已知限制

- **只认 v2 皮肤目录**：需要 `skin.json`，并且只注入 `skin.css` / `patches.css`。
  皮肤中心的背景图、`hooks.mjs`、Wallpaper Engine 桥都不在这里。
- **切换要刷新页面**：样式在 index 渲染时注入，不是运行时热替换。
- **不做白名单过滤**：皮肤中心会拒绝远程 URL、`@import` 和逃出目录的路径；
  这里只做作用域改写，不做 fail-closed 校验。皮肤是本仓库自己写的，已知内容；
  换成来源不明的皮肤目录时要自己看清 CSS。
- **改插件代码要重启 DSH**：模块是启动时加载的，没有热替换。
  改皮肤目录里的 CSS **不用**重启——样式表每次索引渲染都重新读。
- 名字/头像与品牌插件共用存储键，两边改同一份数据 —— 这是有意的。

## 许可

MIT。皮肤本身与其内置字体的许可见 `claude/LICENSE`。
