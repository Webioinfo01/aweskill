import { mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createProgram, main } from "../src/index.js";
import { getSkillToggleConfigPath, resolveAgentSharedSkillsDirs, resolveAgentSkillsDir } from "../src/lib/agents.js";
import { pathExists } from "../src/lib/fs.js";
import { getSkillPath } from "../src/lib/skills.js";
import { createTempWorkspace, writeSkill } from "./helpers.js";

describe("codex shared-root and toggle integration", () => {
  afterEach(() => {
    process.exitCode = 0;
    vi.restoreAllMocks();
  });

  it("resolves codex shared skill directories for both scopes", async () => {
    const workspace = await createTempWorkspace();
    expect(resolveAgentSharedSkillsDirs("codex", "global", workspace.homeDir)).toEqual([
      path.join(workspace.homeDir, ".agents", "skills"),
    ]);
    expect(resolveAgentSharedSkillsDirs("codex", "project", workspace.projectDir)).toEqual([
      path.join(workspace.projectDir, ".agents", "skills"),
    ]);
  });

  it("agent list reports shared entries and cross-root duplicates for codex", async () => {
    const workspace = await createTempWorkspace();
    const lines: string[] = [];
    const program = createProgram({
      cwd: workspace.projectDir,
      homeDir: workspace.homeDir,
      write: (message) => lines.push(message),
      error: (message) => lines.push(`ERR:${message}`),
    });

    await program.parseAsync(["node", "aweskill", "store", "init"], { from: "node" });
    await writeSkill(getSkillPath(workspace.homeDir, "rtk"));

    const codexSkills = resolveAgentSkillsDir("codex", "global", workspace.homeDir);
    const sharedSkills = path.join(workspace.homeDir, ".agents", "skills");
    await mkdir(codexSkills, { recursive: true });
    await mkdir(sharedSkills, { recursive: true });
    await symlink(getSkillPath(workspace.homeDir, "rtk"), path.join(codexSkills, "rtk"));
    await symlink(getSkillPath(workspace.homeDir, "rtk"), path.join(sharedSkills, "rtk"));
    await writeSkill(path.join(sharedSkills, "brainstorming"));

    await program.parseAsync(["node", "aweskill", "agent", "list", "--global", "--agent", "codex", "--verbose"], {
      from: "node",
    });

    const output = lines.join("\n");
    expect(output).toContain("also visible to codex via shared .agents/skills (read-only)");
    expect(output).toContain("brainstorming");
    expect(output).toContain("duplicate: also projected in agent root");
  });

  it("agent disable writes a managed toggle and agent enable removes it", async () => {
    const workspace = await createTempWorkspace();
    const lines: string[] = [];
    const program = createProgram({
      cwd: workspace.projectDir,
      homeDir: workspace.homeDir,
      write: (message) => lines.push(message),
      error: (message) => lines.push(`ERR:${message}`),
    });

    await program.parseAsync(["node", "aweskill", "store", "init"], { from: "node" });
    await writeSkill(getSkillPath(workspace.homeDir, "brainstorming"));

    const sharedSkills = path.join(workspace.homeDir, ".agents", "skills");
    await mkdir(path.join(workspace.homeDir, ".codex"), { recursive: true });
    await mkdir(sharedSkills, { recursive: true });
    await symlink(getSkillPath(workspace.homeDir, "brainstorming"), path.join(sharedSkills, "brainstorming"));

    await program.parseAsync(["node", "aweskill", "agent", "disable", "skill", "brainstorming", "--agent", "codex"], {
      from: "node",
    });

    const configPath = getSkillToggleConfigPath("codex", workspace.homeDir)!;
    const content = await readFile(configPath, "utf8");
    expect(content).toContain("[[skills.config]] # aweskill");
    expect(content).toContain('name = "brainstorming"');
    expect(content).toContain("enabled = false");

    lines.length = 0;
    await program.parseAsync(["node", "aweskill", "agent", "list", "--global", "--agent", "codex", "--verbose"], {
      from: "node",
    });
    expect(lines.join("\n")).toContain("hidden by config toggle");

    lines.length = 0;
    await program.parseAsync(["node", "aweskill", "agent", "enable", "skill", "brainstorming", "--agent", "codex"], {
      from: "node",
    });
    const cleared = await readFile(configPath, "utf8");
    expect(cleared).not.toContain("brainstorming");
    expect(lines.join("\n")).toContain("config toggle removed");
  });

  it("agent disable rejects unknown skills", async () => {
    const workspace = await createTempWorkspace();
    const stderr = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const previousHome = process.env.AWESKILL_HOME;
    process.env.AWESKILL_HOME = workspace.homeDir;

    try {
      await main(["node", "aweskill", "store", "init"]);
      await mkdir(path.join(workspace.homeDir, ".codex"), { recursive: true });

      await main(["node", "aweskill", "agent", "disable", "skill", "nope", "--agent", "codex"]);
      expect(stderr).toHaveBeenCalledWith(expect.stringContaining("Unknown skill(s): nope"));
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = 0;
      stderr.mockRestore();
      if (previousHome === undefined) {
        delete process.env.AWESKILL_HOME;
      } else {
        process.env.AWESKILL_HOME = previousHome;
      }
    }
  });

  it("agent disable skips agents without toggle support", async () => {
    const workspace = await createTempWorkspace();
    const lines: string[] = [];
    const program = createProgram({
      cwd: workspace.projectDir,
      homeDir: workspace.homeDir,
      write: (message) => lines.push(message),
      error: (message) => lines.push(`ERR:${message}`),
    });

    await program.parseAsync(["node", "aweskill", "store", "init"], { from: "node" });
    await writeSkill(getSkillPath(workspace.homeDir, "rtk"));
    await mkdir(path.join(workspace.homeDir, ".claude"), { recursive: true });
    await mkdir(path.join(workspace.homeDir, ".codex"), { recursive: true });

    await program.parseAsync(
      ["node", "aweskill", "agent", "disable", "skill", "rtk", "--agent", "claude-code", "--agent", "codex"],
      { from: "node" },
    );

    const output = lines.join("\n");
    expect(output).toContain("Disabled skill rtk for codex");
    expect(output).toContain("Skipped claude-code");
  });

  it("agent add warns about shared-root duplicates and agent remove warns the skill stays visible", async () => {
    const workspace = await createTempWorkspace();
    const lines: string[] = [];
    const program = createProgram({
      cwd: workspace.projectDir,
      homeDir: workspace.homeDir,
      write: (message) => lines.push(message),
      error: (message) => lines.push(`ERR:${message}`),
    });

    await program.parseAsync(["node", "aweskill", "store", "init"], { from: "node" });
    await writeSkill(getSkillPath(workspace.homeDir, "rtk"));

    const sharedSkills = path.join(workspace.homeDir, ".agents", "skills");
    await mkdir(path.join(workspace.homeDir, ".codex"), { recursive: true });
    await mkdir(sharedSkills, { recursive: true });
    await symlink(getSkillPath(workspace.homeDir, "rtk"), path.join(sharedSkills, "rtk"));

    await program.parseAsync(["node", "aweskill", "agent", "add", "skill", "rtk", "--global", "--agent", "codex"], {
      from: "node",
    });
    expect(lines.join("\n")).toContain("will see it twice");

    lines.length = 0;
    await program.parseAsync(["node", "aweskill", "agent", "remove", "skill", "rtk", "--global", "--agent", "codex"], {
      from: "node",
    });
    expect(lines.join("\n")).toContain("still visible to codex via shared");
    expect(lines.join("\n")).toContain("aweskill agent disable skill rtk --agent codex");
  });

  it("preserves hand-written codex config content across disable and enable", async () => {
    const workspace = await createTempWorkspace();
    const lines: string[] = [];
    const program = createProgram({
      cwd: workspace.projectDir,
      homeDir: workspace.homeDir,
      write: (message) => lines.push(message),
      error: (message) => lines.push(`ERR:${message}`),
    });

    await program.parseAsync(["node", "aweskill", "store", "init"], { from: "node" });
    await writeSkill(getSkillPath(workspace.homeDir, "rtk"));

    const codexDir = path.join(workspace.homeDir, ".codex");
    await mkdir(codexDir, { recursive: true });
    const original = 'model = "gpt-5.5"\n\n[[skills.config]]\nname = "manual"\nenabled = false\n';
    await writeFile(path.join(codexDir, "config.toml"), original, "utf8");

    await program.parseAsync(["node", "aweskill", "agent", "disable", "skill", "rtk", "--agent", "codex"], {
      from: "node",
    });
    await program.parseAsync(["node", "aweskill", "agent", "enable", "skill", "rtk", "--agent", "codex"], {
      from: "node",
    });

    const finalContent = await readFile(path.join(codexDir, "config.toml"), "utf8");
    expect(finalContent.startsWith(original)).toBe(true);
    expect(finalContent).not.toContain("# aweskill");
  });

  it("agent list at project scope reports the project shared .agents/skills", async () => {
    const workspace = await createTempWorkspace();
    const lines: string[] = [];
    const program = createProgram({
      cwd: workspace.projectDir,
      homeDir: workspace.homeDir,
      write: (message) => lines.push(message),
      error: (message) => lines.push(`ERR:${message}`),
    });

    await program.parseAsync(["node", "aweskill", "store", "init"], { from: "node" });
    await writeSkill(getSkillPath(workspace.homeDir, "rtk"));

    const shared = path.join(workspace.projectDir, ".agents", "skills");
    await mkdir(path.join(workspace.projectDir, ".codex"), { recursive: true });
    await mkdir(shared, { recursive: true });
    await symlink(getSkillPath(workspace.homeDir, "rtk"), path.join(shared, "rtk"));

    await program.parseAsync(["node", "aweskill", "agent", "list", "--project", "--agent", "codex"], {
      from: "node",
    });

    const output = lines.join("\n");
    expect(output).toContain("project skills for codex");
    expect(output).toContain("also visible to codex via shared .agents/skills (read-only)");
    expect(output).toContain("rtk");
  });

  it("agent list --apply never mutates shared .agents/skills entries", async () => {
    const workspace = await createTempWorkspace();
    const lines: string[] = [];
    const program = createProgram({
      cwd: workspace.projectDir,
      homeDir: workspace.homeDir,
      write: (message) => lines.push(message),
      error: (message) => lines.push(`ERR:${message}`),
    });

    await program.parseAsync(["node", "aweskill", "store", "init"], { from: "node" });
    await writeSkill(getSkillPath(workspace.homeDir, "rtk"));

    const shared = path.join(workspace.homeDir, ".agents", "skills");
    await mkdir(path.join(workspace.homeDir, ".codex"), { recursive: true });
    await mkdir(shared, { recursive: true });
    const sharedLink = path.join(shared, "rtk");
    await symlink(getSkillPath(workspace.homeDir, "rtk"), sharedLink);

    await program.parseAsync(["node", "aweskill", "doctor", "sync", "--apply", "--agent", "codex"], {
      from: "node",
    });

    expect(await pathExists(sharedLink)).toBe(true);
  });
});
