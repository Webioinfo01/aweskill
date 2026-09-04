import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { runCreate } from "../src/commands/create.js";
import { normalizeSkillDoc } from "../src/lib/fix-skills.js";
import { pathExists } from "../src/lib/fs.js";
import { parseSkillDoc } from "../src/lib/skill-doc.js";
import { getSkillPath } from "../src/lib/skills.js";
import { createRuntime, createTempWorkspace } from "./helpers.js";

describe("store create", () => {
  it("creates a valid skill scaffold in the central store", async () => {
    const workspace = await createTempWorkspace();
    const { context, lines } = createRuntime(workspace.homeDir, workspace.rootDir);

    const result = await runCreate(context, "my-skill", { description: "Use when testing skill creation." });

    const skillFile = getSkillPath(workspace.homeDir, "my-skill");
    expect(result.skillFile).toBe(path.join(skillFile, "SKILL.md"));
    expect(lines.some((line) => line.startsWith(`Created skill my-skill at ${skillFile}`))).toBe(true);
    await expect(pathExists(path.join(skillFile, "references"))).resolves.toBe(true);

    const content = await readFile(result.skillFile, "utf8");
    const parsed = parseSkillDoc(content);
    expect(parsed.frontmatter.name).toBe("my-skill");
    expect(parsed.frontmatter.description).toBe("Use when testing skill creation.");
    expect(content).toContain("# My Skill");
    expect(content).toContain("## When to Use");
    expect(normalizeSkillDoc(content, "my-skill")).toBeNull();
  });

  it("normalizes a sloppy skill name and reports the normalization", async () => {
    const workspace = await createTempWorkspace();
    const { context, lines } = createRuntime(workspace.homeDir, workspace.rootDir);

    const result = await runCreate(context, "  My Skill  ", { description: "desc" });

    expect(result.name).toBe("my-skill");
    expect(lines).toContain('Normalized skill name to "my-skill"');
    await expect(pathExists(getSkillPath(workspace.homeDir, "my-skill"))).resolves.toBe(true);
  });

  it("rejects invalid skill names with an actionable error", async () => {
    const workspace = await createTempWorkspace();
    const { context } = createRuntime(workspace.homeDir, workspace.rootDir);

    for (const invalidName of ["", "   ", "---", "my.skill", "my_skill", "a".repeat(70)]) {
      await expect(runCreate(context, invalidName, { description: "desc" })).rejects.toThrow(/Invalid skill name/);
    }
  });

  it("rejects creating a skill that already exists in the central store", async () => {
    const workspace = await createTempWorkspace();
    const { context } = createRuntime(workspace.homeDir, workspace.rootDir);

    await runCreate(context, "my-skill", { description: "desc" });
    await expect(runCreate(context, "my-skill", { description: "another" })).rejects.toThrow(/already exists/);
  });

  it("writes a placeholder description and warns when --description is omitted", async () => {
    const workspace = await createTempWorkspace();
    const { context, lines } = createRuntime(workspace.homeDir, workspace.rootDir);

    const result = await runCreate(context, "my-skill", {});

    const content = await readFile(result.skillFile, "utf8");
    expect(parseSkillDoc(content).frontmatter.description).toContain("TODO");
    expect(lines.some((line) => line.startsWith("Warning: no --description given"))).toBe(true);
  });

  it("keeps descriptions with quotes and colons frontmatter-safe", async () => {
    const workspace = await createTempWorkspace();
    const { context } = createRuntime(workspace.homeDir, workspace.rootDir);

    const description = 'Use when the user says "deploy: production", 带引号的描述.';
    const result = await runCreate(context, "my-skill", { description });

    const content = await readFile(result.skillFile, "utf8");
    expect(parseSkillDoc(content).frontmatter.description).toBe(description);
    expect(normalizeSkillDoc(content, "my-skill")).toBeNull();
  });

  it("creates under --dir instead of the central store", async () => {
    const workspace = await createTempWorkspace();
    const { context } = createRuntime(workspace.homeDir, workspace.rootDir);
    const repoDir = path.join(workspace.projectDir, ".agents", "skills");

    const result = await runCreate(context, "repo-skill", { description: "desc", dir: repoDir });

    expect(result.skillDir).toBe(path.join(repoDir, "repo-skill"));
    await expect(pathExists(result.skillFile)).resolves.toBe(true);
    await expect(pathExists(getSkillPath(workspace.homeDir, "repo-skill"))).resolves.toBe(false);
    expect(result.name).toBe("repo-skill");
  });

  it("rejects --dir targets that already exist", async () => {
    const workspace = await createTempWorkspace();
    const { context } = createRuntime(workspace.homeDir, workspace.rootDir);

    await runCreate(context, "repo-skill", { description: "desc", dir: workspace.projectDir });
    await expect(runCreate(context, "repo-skill", { description: "again", dir: workspace.projectDir })).rejects.toThrow(
      /already exists/,
    );
  });
});
