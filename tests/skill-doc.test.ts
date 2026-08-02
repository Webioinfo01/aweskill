import { describe, expect, it } from "vitest";

import { getSkillDescription, parseSkillDoc } from "../src/lib/skill-doc.js";

describe("skill doc parsing", () => {
  it("falls back to body text when frontmatter is malformed", () => {
    const content = [
      "---",
      "name: feishu-drive",
      "description: 飞书云空间文件管理 Skill。",
      "required_permissions:",
      "  - drive:file:upload",
      "",
      "# 🚀 快速启动：三步打通云空间 (必读)",
      "为避免机器人文件进入“私有黑盒”，请在首次使用前完成以下配置：",
      "---",
      "",
      "# 飞书云空间文件管理",
      "",
      "你是飞书云空间文件管理专家。",
      "",
    ].join("\n");

    expect(() => parseSkillDoc(content)).not.toThrow();
    expect(getSkillDescription(content)).toBe("你是飞书云空间文件管理专家。");
  });

  it("parses frontmatter from CRLF line endings (Windows)", () => {
    const lf = ["---", "name: example", "description: An example skill.", "---", "", "Body line one."].join("\n");
    const crlf = lf.replace(/\n/g, "\r\n");

    const parsed = parseSkillDoc(crlf);
    expect(parsed.frontmatter.name).toBe("example");
    expect(parsed.frontmatter.description).toBe("An example skill.");
    expect(getSkillDescription(crlf)).toBe("An example skill.");
  });
});
