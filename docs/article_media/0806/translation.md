# 用起 aweskill，戴上 badge

![aweskill](../../../logo/hero1.png)

aweskill 最初只是一个技能管理器。安装技能，把它们投射到你的智能体里，完事。但走着走着，它变成了别的东西——一个skill 的分发枢纽。

README 里现在多了一个 "Powered by aweskill" 板块，里面列了四个项目。篇幅不长，但它指向了一种雏形：一套工具共享同一个分发层，彼此交叉链接，开始互相向用户推荐。

这篇文章就讲这种形态，以及你可以加上的徽章，酷酷的告诉别人你用了aweskill。

GitHub: [github.com/Webioinfo01/aweskill](https://github.com/Webioinfo01/aweskill)

## 已有哪些项目 "Powered by aweskill"

三个 AI 工具和一个项目合集，全部通过 aweskill 分发技能。

**[aweswitch](https://github.com/Webioinfo01/aweswitch)** — 配置文件切换器。可以启动隔离的智能体会话，使用不同的 API 端点、令牌和模型；也可以直接应用一份配置，让 `/model` 在会话中途即时生效。它是 aweskill 最近的兄弟：aweswitch 管的是*连哪个端点*，aweskill 管的是*装哪些技能*。（而且它刚完成了真正的 Windows 支持。）

**[aweshelf](https://github.com/Webioinfo01/aweshelf)** — 会话书签管理器。可以为 Claude Code 和 Codex 会话添加书签、分类、搜索和恢复，恢复时还会还原原有的配置档案。aweswitch 的 `-c` 和 `-t` 启动参数会自动把控制权交给 aweshelf。两者协同工作：aweswitch 启动会话，aweshelf 记住一切。

**[awescholar](https://github.com/Webioinfo01/awescholar)** — 科学文献发现工具。一个可被 AI 智能体操作的工具，用于搜索、标注、筛选和报告学术论文。它同样由 aweskill 驱动：它的能力通过技能直达智能体。

**[Awesome AI Meets Biology](https://github.com/Webioinfo01/Awesome-AI-Meets-Biology)** — 一份精选的 AI 在生物学、生物信息学和生物医学研究中的应用清单。由 awescholar 驱动，而 awescholar 又由 aweskill 驱动——所以这条依赖链在 README 里一目了然。

## "Powered by aweskill" 意味着什么

这不是一句营销口号。它意味着这个项目通过 aweskill 分发自己的技能，用户只需安装一次，技能就能进入所有支持的智能体——Claude Code、Codex、Cursor、Gemini CLI，以及其余 47+ 个。项目不需要维护一份份的智能体安装文档，也不需要写 "仅支持 Claude Code" 的说明。它只需要一个 `SKILL.md`，剩下的由 aweskill 完成。

这是效率的一半。另一半是发现。每个 "Powered by aweskill" 项目都链接回枢纽，而枢纽也链接到它们。安装了 aweswitch 的用户会看到 aweshelf。找到了 awescholar 的用户会看到生物学合集。徽章就是让这个链接从外部可见——从路人正在扫视的 GitHub README 上就能看见。

## 给你的项目加上 aweskill 徽章

如果你的项目用 aweskill，可以在 README 里加上两种徽章之一：

| 徽章 | 用途 |
|------|------|
| `aweskill-badge.svg` | aweskill 自身使用 |
| `aweskill-badge2.svg` | 配套项目使用 |

大多数项目想要的都是配套徽章。把它放在 README 的标题里：

```html
<a href="https://github.com/Webioinfo01/aweskill">
  <img src="https://raw.githubusercontent.com/Webioinfo01/aweskill/main/logo/aweskill-badge2.svg" alt="aweskill companion">
</a>
```

在 Markdown 标题中，效果是这样的：

```markdown
# My Project <a href="https://github.com/Webioinfo01/aweskill"><img src="https://raw.githubusercontent.com/Webioinfo01/aweskill/main/logo/aweskill-badge2.svg" alt="aweskill companion"></a>
```

改动就这么点。README 里加一行链接。徽章会靠在你的标题旁边，指向枢纽，告诉任何路过的人：你的技能可以通过 aweskill 安装。

像这样：
![image-20260804105524397](images/image-20260804105524397.png)



## 为什么值得这么做

三个原因，按它们兑现的频率排列：

1. **用户只需安装一次技能。** aweskill 会把技能投射到他们用的任何智能体里。你不用再维护各种智能体文档，也不用再写 "在 Claude Code 中可用" 之类的注脚。徽章在用户看到安装说明之前就告诉他们这一点。

2. **枢纽会反过来推荐你。** aweskill 的 README 会收录所有由它驱动的项目。一个因为 aweswitch 或 aweshelf 而来的用户，会在同一板块看到你的项目。徽章是这个链接的对外一半，README 里的列表是对内的一半。两者合在一起，构成一个微型推荐网络。

3. **好工具会互相找到。** 这个生态系统小到项目之间已经在互相配合——aweswitch 把控制权交给 aweshelf，awescholar 支撑着生物学合集。戴上徽章，你就加入了这场对话。下一个构建出来的兄弟工具，如果能看见你，就更可能与你的项目协同工作。



## 试试看

加上徽章，通过 aweskill 分发你的技能，你就入局了。用户这边的安装只需一行：

```text
Read https://github.com/Webioinfo01/aweskill/blob/main/README.ai.md and follow it to install aweskill for this agent.
```

之后，你的 `SKILL.md` 就能在所有支持的智能体中触达，你的 README 也附上了一条通往越来越丰富的工具集合的链接。

用起 aweskill，戴上 badge——用了，就亮出来。



## Aweskill 系列文章

- [aweskill：让AI Agents 自己搞定skills 管理](https://mp.weixin.qq.com/s/wNMMwTHIGXFw8FIjcyVAKA)
- [aweskill: 让 AI Agent 学会自己管理 skills](https://mp.weixin.qq.com/s/Fb0Q7nKEJtORSTz7Ukv_EA)



## 更多来自 Webioinfo

aweskill 是 [Webioinfo](https://www.webioinfo.top/) 生态系统的一部分：

- **[aweswitch](https://github.com/Webioinfo01/aweswitch)** — 智能体配置档案切换器（Claude、Codex、OpenCode）
- **[aweshelf](https://github.com/Webioinfo01/aweshelf)** — 支持配置档案恢复的 AI 编程会话管理器
- **[awescholar](https://github.com/Webioinfo01/awescholar)** — 自动化科学文献发现工具
