import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isSkillDisabled, listSkillToggles, removeSkillToggle, setSkillEnabled } from "../src/lib/skill-toggles.js";
import { createTempWorkspace } from "./helpers.js";

async function configPath(workspace: { rootDir: string }): Promise<string> {
  return path.join(workspace.rootDir, "config.toml");
}

describe("skill-toggles", () => {
  it("creates a config file with a managed disable block", async () => {
    const workspace = await createTempWorkspace();
    const file = await configPath(workspace);

    const result = await setSkillEnabled(file, "brainstorming", false);

    expect(result).toBe("disabled");
    expect(await isSkillDisabled(file, "brainstorming")).toBe(true);
    const content = await import("node:fs/promises").then((fs) => fs.readFile(file, "utf8"));
    expect(content).toContain("[[skills.config]] # aweskill");
    expect(content).toContain('name = "brainstorming"');
    expect(content).toContain("enabled = false");
  });

  it("appends to an existing config without touching unrelated content", async () => {
    const workspace = await createTempWorkspace();
    const file = await configPath(workspace);
    const original = 'model = "gpt-5"\n\n[mcp_servers.foo]\ncommand = "foo"\n';
    await writeFile(file, original, "utf8");

    await setSkillEnabled(file, "rtk", false);

    const content = await import("node:fs/promises").then((fs) => fs.readFile(file, "utf8"));
    expect(content.startsWith(original)).toBe(true);
    expect(content).toContain('name = "rtk"');
  });

  it("updates an existing managed block in place and reports noop when unchanged", async () => {
    const workspace = await createTempWorkspace();
    const file = await configPath(workspace);

    await setSkillEnabled(file, "rtk", false);
    expect(await setSkillEnabled(file, "rtk", false)).toBe("noop");
    expect(await setSkillEnabled(file, "rtk", true)).toBe("updated");
    expect(await isSkillDisabled(file, "rtk")).toBe(false);
  });

  it("removeSkillToggle deletes only the managed block", async () => {
    const workspace = await createTempWorkspace();
    const file = await configPath(workspace);
    const original = 'model = "gpt-5"\n\n[[skills.config]]\nname = "manual"\nenabled = false\n';
    await writeFile(file, original, "utf8");

    await setSkillEnabled(file, "rtk", false);
    expect(await removeSkillToggle(file, "rtk")).toBe(true);
    expect(await removeSkillToggle(file, "rtk")).toBe(false);

    const content = await import("node:fs/promises").then((fs) => fs.readFile(file, "utf8"));
    expect(content).not.toContain("# aweskill");
    expect(content).toContain('name = "manual"');
  });

  it("never edits hand-written [[skills.config]] entries", async () => {
    const workspace = await createTempWorkspace();
    const file = await configPath(workspace);
    const original = '[[skills.config]]\nname = "manual"\nenabled = false\n';
    await writeFile(file, original, "utf8");

    // A managed enabled=true entry is appended and overrides the hand-written one.
    expect(await setSkillEnabled(file, "manual", true)).toBe("enabled");
    // Removing the managed toggle deletes only aweskill's block.
    expect(await removeSkillToggle(file, "manual")).toBe(true);
    expect(await removeSkillToggle(file, "manual")).toBe(false);

    const content = await import("node:fs/promises").then((fs) => fs.readFile(file, "utf8"));
    expect(content).not.toContain("# aweskill");
    expect(content).toContain('name = "manual"\nenabled = false');
  });

  it("parses values with quotes and comments", async () => {
    const workspace = await createTempWorkspace();
    const file = await configPath(workspace);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(
      file,
      [
        "# top comment",
        "[[skills.config]] # user note",
        'name = "has # hash" # trailing',
        "enabled = false",
        "[[skills.config]] # aweskill",
        'name = "managed-one"',
        "enabled = false",
        "",
      ].join("\n"),
      "utf8",
    );

    const toggles = await listSkillToggles(file);
    expect(toggles.get("has # hash")?.enabled).toBe(false);
    expect(toggles.get("has # hash")?.managed).toBe(false);
    expect(toggles.get("managed-one")?.managed).toBe(true);
  });
});

describe("skill-toggles block boundaries", () => {
  it("does not cut a block short at a multi-line array value", async () => {
    const workspace = await createTempWorkspace();
    const file = await configPath(workspace);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(
      file,
      [
        "[[skills.config]] # aweskill",
        'name = "array-owner"',
        "enabled = false",
        "tags = [",
        '  "a", "b"',
        "]",
        "",
      ].join("\n"),
      "utf8",
    );

    const toggles = await listSkillToggles(file);
    expect(toggles.get("array-owner")?.enabled).toBe(false);
  });
});
