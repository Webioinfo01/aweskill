# aweskill：用windows的可以先不用换Mac

![aweskill](../../../logo/hero1.png)

终于我aweskill 也是用上windows 了。为什么要用也，当然是我的好兄弟aweswitch 比我抢先了一步：

我坐在一台 Windows 机器前。新开一个 `cmd.exe`，敲下 `aweskill find review`。工具跑起来了。挑了个技能，运行 `aweskill install owner/repo`，然后……`spawn ENOENT`。agent 的 npm 垫片起不来。我试了 `aweskill self-update`，看着它又以同样的方式崩掉。我打开刚装好的那个 agent 的 `SKILL.md`，名字和描述都是空的——frontmatter 没了。我合上笔记本，去倒了杯咖啡，跟 agent 说：

> "aweskill 在 Windows 上坏了。查清楚原因，修好它。"

等我回来时，安装通了，更新也通了，`SKILL.md` 里名字和描述都显示出来了，agent 还留了一段话总结它改了哪些地方。那个 `agent add` 流程在 macOS 上已经跑了几个月，现在在 Windows 上也能跑了。同一条命令，同一个结果，两种 shell 都通。之前觉得windows 终端管理太烦了，早就想换个mac 电脑，又赶上大涨价，还好aweskill 更新帮我守住钱包了。

GitHub: [github.com/Webioinfo01/aweskill](https://github.com/Webioinfo01/aweskill)

## 修了几个 Bug

v0.4.0 集中修了一组在 Windows 上几乎第一次用就会踩到的 bug，每个都对应一处直接修复：

**Bug 1：`npm` 和 `tar` 被当成一定存在。** `self-update` 直接调 `npm`，但 Windows 上的 `npm` 是 `.cmd` 垫片，新版 Node 没有 shell 包装器就拒绝启动；技能压缩包下载调的是 `unzip`，而 Windows 默认不带。修法：`self-update` 在 Windows 上改走 shell 启动（`git` 这样的真 `.exe` 不受影响），下载按平台选解压工具——Windows 10+ 用自带的 `tar -xf`，macOS/Linux 继续用 `unzip`。

**Bug 2：`SKILL.md` 的 frontmatter 凭空消失。** 技能文档解析器只认 LF，CRLF 文件会把整段 frontmatter 静默丢掉，名字和描述全没，`find --local` 列出来是空条目。修法：解析器现在接受 CRLF 换行，LF 平台无感。

**Bug 3：Windows CI 在 readlink 严格相等断言上偶发挂。** Windows 的 `readlink` 给目录符号链接目标会多一个反斜杠。修法：测试放宽，Windows CI 矩阵稳定。

现在windows 上用起来算是没问题了。



## 在 Windows 上的一天

今天是周三。你坐在一台 Windows 机器前，一个窗口开着 `cmd.exe`，另一个开着 PowerShell。你是 agent 用户，大头的活都交给 agent 干。

**上午 9:00。** 第一次安装 aweskill：

```cmd
npm install -g aweskill
aweskill -v
```

装上了。你让 agent 按照 `README.ai.md` 自我引导。agent 跑了 `aweskill store init`、`aweskill store where --verbose`、`aweskill agent supported`，然后 `aweskill agent add skill aweskill,aweskill-doctor --global --agent <agent-id>`。每一次调用外部工具都干脆利落：`npm` 走 shell 包装器启动，没有 `ENOENT`，也没有 `unzip: not found`。

**上午 10:30。** 你想要一个代码评审技能。你跟 agent 说：

> "找一个好用的代码评审技能，装进 aweskill，并给这个 agent 启用。"

agent 跑了 `aweskill find review`，挑了一个，再跑 `aweskill install owner/repo`。技能落在 `~/.aweskill/skills/`。agent 接着跑 `aweskill agent add skill pr-review --global --agent <agent-id>` 把它投射出去。`aweskill show pr-review` 把名字和描述都正确显示出来——frontmatter 解析正常，管它是不是 CRLF。

**下午 1:00。** 你发现新版本出来了。你跟 agent 说：

> "把 aweskill 更新一下。"

agent 跑了 `aweskill self-update`。幕后是这样：在 Windows 上 npm 现在改走 shell 启动，`.cmd` 垫片正确解析，安装顺利完成。新版本到位。

**下午 3:00。** 你打算从自己一直在改的、Windows checkout 的仓库里再导入几个技能。你跟 agent 说：

> "扫一下当前仓库里的技能，把看着有用的都导进来。"

agent 跑了 `aweskill store scan --import`。扫描找到了每一个 `SKILL.md`，包括那些用 CRLF 保存的。frontmatter 完整。导入成功。`aweskill list` 列出了新条目，名字也对。

**下午 5:00。** 收工。五条命令，全由 agent 跑下来，在一个新开的 `cmd.exe` 上第一次就成了。你从头到尾没装过 `unzip`，没见过 `spawn ENOENT`，更没必要跟 agent 解释一个刚装好的技能为什么没有名字。

## agent 在 Windows 上现在能做什么

aweskill 技能在 Windows 上现在也能做那件它在 macOS 和 Linux 上早就能做的事了：对工具本身做完整的自助操作。在 v0.4.0 之前，agent 的工具箱里留着 Windows 形状的缺口——`self-update` 失败、技能压缩包下载失败、刚装好的技能显示一片空白。v0.4.0 之后：

| 你说 | 技能执行的命令 |
|---|---|
| "把 aweskill 更新一下。" | `aweskill self-update`（在 Windows 上通过 shell 启动 npm） |
| "把这个仓库里的技能导进来。" | `aweskill store scan --import`（CRLF 的 frontmatter 正常解析） |
| "看看我刚装的是什么。" | `aweskill show <name>`（不再有空白的 frontmatter） |
| "找一个代码评审技能。" | `aweskill find review` |
| "装一下 owner/repo。" | `aweskill install owner/repo`（技能压缩包在 Windows 上用 bsdtar） |
| "把 aweskill 投射给 Codex。" | `aweskill agent add skill aweskill --global --agent codex` |

同样的命令，同样的动词，同样的预期输出。在 agent 的词汇里，Windows 不再是特殊情况。

## 同样的体验

对 Windows 用户来说，现在的流程跟 macOS 完全一样。装。用。更新。shell 从 `zsh` 换成了 `cmd.exe`，npm 垫片通过 PATHEXT 解析（而不是通过 shebang），除此之外什么都没变。`aweskill find` 干的还是它在别处干的事，`install`、`agent add`、`store scan --import`、`self-update`、`show` 也是。同样的配置，同样的 `~/.aweskill/skills/` 仓库，同样的投射布局。

这种一致性也延伸到 aweskill 技能本身。Windows 用户拿到的是和 macOS、Linux 用户从 v0.2.x 起就在用的同一个自然语言接口。技能读的是同一份 `README.ai.md`，走的是同一套自我引导流程，跑的是同一组 `aweskill` 命令。agent 不需要一个单独的"Windows 模式"——它会自己挑对 shell 包装器、归档解压器、frontmatter 规范化方式，而用户看到的只是一个能用的 CLI。

> "把 aweskill 更新一下，把这个仓库里的新技能也导进来。"

同一段提示词，在一台 Windows 笔记本和一台 Mac 上跑出来是一样的。agent 先跑 `aweskill self-update`（在 Windows 上 npm 垫片正确解析，没有 `ENOENT`），再跑 `aweskill store scan --import`（CRLF 的 frontmatter 正确解析）。安装设置是一项任务，而 agent 就是干任务的。所以我把这个任务交给了 agent。



## 在 Windows 上试一下

```cmd
npm install -g aweskill
aweskill -v
aweskill store init
```

如果 `npm install -g` 提示你需要新开一个终端，那就新开一个。装完后的 `aweskill -v` 用来确认 CLI 能找到。`aweskill store init` 会创建 `~/.aweskill/`。从这一步起，同样的命令到处都能跑：

```cmd
aweskill find review
aweskill install owner/repo
aweskill agent add skill pr-review --global --agent codex
aweskill self-update
```

不用装 `unzip`。不用对自己刚 checkout 的 `SKILL.md` 手动修 CRLF。`self-update` 不再冒 `spawn ENOENT`。也不用再翻一个专门讲 Windows 的章节。

这就是现在 Windows 上的全部体验。同样的配置，同样的命令，同样的 `aweskill` 技能，同样有 agent 替你管着。



## 更多来自 Webioinfo 的项目

aweskill 是 [Webioinfo](https://www.webioinfo.top/) 生态的一部分：

- **[aweswitch](https://github.com/mugpeng/aweswitch)** — Agent 配置切换器（Claude、Codex、OpenCode）；现已跨平台
- **[aweshelf](https://github.com/Webioinfo01/aweshelf)** — 带配置感知恢复的 AI 编码会话管理器
- **[awescholar](https://github.com/Webioinfo01/awescholar)** — 自动化的学术文献发现工具
