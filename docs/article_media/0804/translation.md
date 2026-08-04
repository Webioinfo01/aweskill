# aweskill更新：自动更新让使用更贴心

![aweskill](../../../logo/hero1.png)

最近，aweskill 同时多出了三个更新：一套统一的扫描和导入技能的方式、一个新版本发布时的安静提醒，以及一种让用于投射的符号链接能在嵌套 git worktree 中存活下来的方法。它们每一个都来自真实的用户痛点。

这篇文章就讲这三件事。

GitHub: [github.com/Webioinfo01/aweskill](https://github.com/Webioinfo01/aweskill)

## 导入命令曾经不小心变成了两条

从"我有一文件夹的技能"到"它们住进了我的技能仓库"，过去最短的路径是两条命令。先跑 `aweskill store import` 把它们带进来，再跑 `aweskill store scan` 发现新东西。人们经常把它们搞混，也经常问这俩到底有什么区别。

区别其实很小。`import` 会遍历你指定的 agent 目录，把技能复制进来；`scan` 遍历同样的目录，但只是*汇报*它看到了什么。接下来最自然的问题就是"那为什么要分成两条命令？" v0.3.4 时最诚实的回答是：因为它们是不同的人在不同时期写的，边界慢慢就漂移了。

v0.3.5 把它们合二为一。

### `aweskill store scan --import`

新的形态是一条命令加一个标志：

```bash
aweskill store scan --import
```

scan 会遍历 agent 目录，找到 `SKILL.md` 文件，汇报它们，并且在带上 `--import` 时，把值得留下的技能复制或符号链接到 `~/.aweskill/skills/`。独立的 `store import` 命令没了。`--link-source` 和 `--track-source` 没了。`--keep-source` 现在的意思变得清晰明了：保留原始文件原地不动，而不是用一个符号链接替换它。

新的契约是：*scan* 是"查看 agent 目录"唯一的动词，`--import` 是"把它们带进来"唯一的标志。一条命令，一种形态，不用再记一套并行的术语。

说句题外话。这里删的比加的还多——这种清理只有在你把旧形态彻底替换掉、而不是"加个警告慢慢弃用"的时候才可能发生。CLI 暴露面收窄了。帮助文本变短了。测试也精简了。下游的一切都变得更简单，但能力并没有损失。

agent 也跟着同步了这项改动。`README.ai.md` 和 aweskill 技能现在都只描述一套工作流，"scan" 和 "import" 这两个词，现在也不再当成两件不同的事情来教了。

## 那个不烦人的更新提醒

一款软件如果不告诉你有新版本，你会觉得它像是没人管了；如果每隔五分钟就催你更新，又让人想起手机系统的体验。v0.3.7 选了中间这条路。

### 每条命令之后，悄悄检查一次

`aweskill` 现在会在每条命令执行完之后，去 npm registry 查一下有没有更新的版本，限流为每天一次。如果有更新的版本，命令输出结束后会多打印一行：

```
$ aweskill find review
…
A new version of aweskill is available: 0.3.8 (you have 0.3.7). Run `aweskill self-update` to upgrade.
```

这就是全部的交互。没有弹窗，没有提示，没有"你现在要更新吗？"的追问。检查是和命令并行跑的，所以不会带来额外的等待。最坏的情况，也不过是真正的结果落地片刻之后，多那么一行输出。

如果没有限流，每条命令都会去打 registry，每一次按键都会触发一次提醒——这恰恰是 v0.3.7 想避开的那种烦人的手机系统体验。这种检查本身也是用户会想关掉的东西，所以对应的环境变量是 `AWESKILL_NO_UPDATE_CHECK=1`。



## 在 worktree 里活下来的符号链接

这三件事里这一件最技术，但用户面对的症状很简单：在主仓库里工作得好好的投射，到了嵌套 git worktree 里有时候就变成了失效的符号链接（悬空）。

> 感谢 [Kang-chen](https://github.com/kang-chen) 提交了 [PR #13](https://github.com/Webioinfo01/aweskill/pull/13)——最初的补丁引入了 `AWESKILL_ABSOLUTE_SYMLINKS=1` 环境变量和针对性的测试。v0.3.8 在此基础上，把这个环境变量提升成了一个容易找到的 `--absolute` 标志。

### bug 的样子

`aweskill` 通过符号链接把技能投射到 agent 目录。默认情况下，符号链接用的是*相对*目标——这对一个可移植的投射来说是对的。相对目标在任何机器、任何 CI 上都能工作，前提是 agent 目录到技能仓库的相对深度保持一致。

嵌套 git worktree 改变的就是这个深度。在主 checkout 里能工作的投射，到了 worktree 里就浅了一层。符号链接解析到了一个不存在的路径上。从技术上讲，技能是装上了，但 agent 找不到它。

v0.3.8 加了一个可选的应急方案：`aweskill agent add … --absolute`（或者用对应的环境变量作为全局默认）。用了绝对目标之后，符号链接就直接指向本地的 `~/.aweskill/skills/…` 路径，不管 worktree 嵌套多深。



## agent 现在做得更好的地方

这三处改动，每一处都会通过 `aweskill` 这个技能（agent 用它来管理 aweskill 自己）传导下去。

| 用户说 | 技能执行 |
|---|---|
| "把这个仓库里的技能带进来。" | `aweskill store scan --import`（过去：两条命令） |
| "有没有新版本？" | 命令后的提醒自己会冒出来 |
| "更新 aweskill。" | `aweskill self-update`（不用手动"解除固定"） |
| "把这个技能投射到一个嵌套 worktree 里。" | `aweskill agent add … --absolute` |

第一行是 agent 过去会犹豫的那一个。"我该跑 `import` 还是 `scan`？"在 v0.3.4 里这是个真问题。到了 v0.3.5，答案永远是"跑 `scan --import`"。agent 不用再去想哪个动词是哪个意思。

第二行是用户不开口就能注意到的那个。提醒很轻、很安静，不需要用户做任何动作。再配合删掉的固定版本安装，"保持最新"这件事在默认安装下已经完全自动化了。

第三行是给一个真实边角场景的小修补。大多数用户根本碰不到它。真正会碰到的——嵌套 worktree 用户——会顺着文档找到这个标志。



## 试试看

这三样东西都已经在 v0.3.8 里了。如果你装的是更旧的版本，下次跑任何命令的时候，它就会提醒你：

```bash
aweskill find review
```

如果有更新的版本，提醒就会触发。然后跑：

```bash
aweskill self-update
```

你就到最新版了。从这里开始：

```bash
# 统一的扫描加导入
aweskill store scan --import

# worktree 的应急方案，需要的时候用
aweskill agent add skill pr-review --global --agent codex --absolute
```

三条命令。每一条，都是一个曾经更复杂的问题的答案。

这就是这次发布的全部。



## Aweskill 系列文章

- [aweskill：让AI Agents 自己搞定skills 管理](https://mp.weixin.qq.com/s/wNMMwTHIGXFw8FIjcyVAKA)
- [aweskill: 让 AI Agent 学会自己管理 skills](https://mp.weixin.qq.com/s/Fb0Q7nKEJtORSTz7Ukv_EA)



## 更多来自 Webioinfo 的项目

aweskill 是 [Webioinfo](https://www.webioinfo.top/) 生态的一部分：

- **[aweswitch](https://github.com/mugpeng/aweswitch)** — Agent 配置切换器（Claude、Codex、OpenCode）
- **[aweshelf](https://github.com/Webioinfo01/aweshelf)** — 带配置感知恢复的 AI 编码会话管理器
- **[awescholar](https://github.com/Webioinfo01/awescholar)** — 自动化的学术文献发现工具
