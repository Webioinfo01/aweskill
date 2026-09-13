import { lstat, mkdir, readFile, readlink, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";
import { getSkillPath } from "../src/lib/skills.js";
import {
  createSkillCopy,
  createSkillSymlink,
  evaluateCopyProjections,
  getDirectoryLinkTypeForPlatform,
  inspectProjectionTarget,
  listManagedSkillNames,
  removeManagedProjection,
  resolveDirectoryLinkTarget,
  setDirectoryLinkCreatorForTesting,
  shouldUseAbsoluteLinkTarget,
} from "../src/lib/symlink.js";
import { createTempWorkspace, writeSkill } from "./helpers.js";

describe("symlink helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setDirectoryLinkCreatorForTesting();
  });

  it("creates managed copies and tracks them as copy projections", async () => {
    const workspace = await createTempWorkspace();
    const sourcePath = getSkillPath(workspace.homeDir, "copy-me");
    const targetDir = path.join(workspace.rootDir, "agent", "skills");
    const targetPath = path.join(targetDir, "copy-me");

    await writeSkill(sourcePath, "Copy Me");
    await mkdir(targetDir, { recursive: true });

    await expect(createSkillCopy(sourcePath, targetPath)).resolves.toEqual({ status: "created", mode: "copy" });
    await expect(readFile(path.join(targetPath, "SKILL.md"), "utf8")).resolves.toContain("Copy Me");

    const managed = await listManagedSkillNames(targetDir, path.join(workspace.homeDir, ".aweskill", "skills"));
    expect(managed.get("copy-me")).toBe("copy");
  });

  it("creates removable symlink projections", async () => {
    const workspace = await createTempWorkspace();
    const sourcePath = getSkillPath(workspace.homeDir, "link-me");
    const targetDir = path.join(workspace.rootDir, "agent", "skills");
    const targetPath = path.join(targetDir, "link-me");

    await writeSkill(sourcePath, "Link Me");
    await mkdir(targetDir, { recursive: true });

    await expect(createSkillSymlink(sourcePath, targetPath)).resolves.toEqual({ status: "created", mode: "symlink" });
    expect((await lstat(targetPath)).isSymbolicLink()).toBe(true);
    await expect(removeManagedProjection(targetPath)).resolves.toBe(true);
  });

  it("uses junction semantics on Windows and falls back to managed copy when link creation is denied", async () => {
    const workspace = await createTempWorkspace();
    const sourcePath = getSkillPath(workspace.homeDir, "fallback-me");
    const targetDir = path.join(workspace.rootDir, "agent", "skills");
    const targetPath = path.join(targetDir, "fallback-me");

    await writeSkill(sourcePath, "Fallback Me");
    await mkdir(targetDir, { recursive: true });

    expect(getDirectoryLinkTypeForPlatform("win32")).toBe("junction");
    vi.spyOn(process, "platform", "get").mockReturnValue("win32");
    setDirectoryLinkCreatorForTesting(async () => {
      throw Object.assign(new Error("denied"), { code: "EPERM" });
    });

    await expect(createSkillSymlink(sourcePath, targetPath)).resolves.toEqual({ status: "created", mode: "copy" });
    expect((await lstat(targetPath)).isDirectory()).toBe(true);
    await expect(readFile(path.join(targetPath, "SKILL.md"), "utf8")).resolves.toContain("Fallback Me");
    await expect(readFile(path.join(targetPath, ".aweskill-projection.json"), "utf8")).resolves.toContain(
      '"managedBy": "aweskill"',
    );
  });

  it("skips recreating an existing managed copy for the same source", async () => {
    const workspace = await createTempWorkspace();
    const sourcePath = getSkillPath(workspace.homeDir, "copy-skip");
    const targetDir = path.join(workspace.rootDir, "agent", "skills");
    const targetPath = path.join(targetDir, "copy-skip");

    await writeSkill(sourcePath, "Copy Skip");
    await mkdir(targetDir, { recursive: true });
    await mkdir(targetPath, { recursive: true });
    await writeFile(
      path.join(targetPath, ".aweskill-projection.json"),
      JSON.stringify({ managedBy: "aweskill", sourcePath: path.resolve(sourcePath) }, null, 2),
      "utf8",
    );

    await expect(createSkillSymlink(sourcePath, targetPath)).resolves.toEqual({ status: "skipped", mode: "copy" });
  });

  it("records a content baseline in the copy marker and recreates matching copies only with force", async () => {
    const workspace = await createTempWorkspace();
    const sourcePath = getSkillPath(workspace.homeDir, "baseline");
    const targetDir = path.join(workspace.rootDir, "agent", "skills");
    const targetPath = path.join(targetDir, "baseline");

    await writeSkill(sourcePath, "Baseline");
    await mkdir(targetDir, { recursive: true });

    await createSkillCopy(sourcePath, targetPath);
    const marker = JSON.parse(await readFile(path.join(targetPath, ".aweskill-projection.json"), "utf8"));
    expect(marker.contentHash).toHaveLength(64);

    await expect(createSkillCopy(sourcePath, targetPath)).resolves.toEqual({ status: "skipped", mode: "copy" });
    await expect(createSkillCopy(sourcePath, targetPath, { allowReplaceExisting: true })).resolves.toEqual({
      status: "created",
      mode: "copy",
    });
  });

  it("flags local edits when force replaces a modified copy", async () => {
    const workspace = await createTempWorkspace();
    const sourcePath = getSkillPath(workspace.homeDir, "edited");
    const targetDir = path.join(workspace.rootDir, "agent", "skills");
    const targetPath = path.join(targetDir, "edited");

    await writeSkill(sourcePath, "Edited");
    await mkdir(targetDir, { recursive: true });
    await createSkillCopy(sourcePath, targetPath);
    await writeFile(path.join(targetPath, "SKILL.md"), "# user edit\n", "utf8");

    await expect(createSkillCopy(sourcePath, targetPath, { allowReplaceExisting: true })).resolves.toEqual({
      status: "created",
      mode: "copy",
      hadLocalEdits: true,
    });
  });

  it("recreates a same-target symlink when force is set", async () => {
    const workspace = await createTempWorkspace();
    const sourcePath = getSkillPath(workspace.homeDir, "same-link");
    const targetDir = path.join(workspace.rootDir, "agent", "skills");
    const targetPath = path.join(targetDir, "same-link");

    await writeSkill(sourcePath, "Same Link");
    await mkdir(targetDir, { recursive: true });

    await expect(createSkillSymlink(sourcePath, targetPath)).resolves.toEqual({ status: "created", mode: "symlink" });
    await expect(createSkillSymlink(sourcePath, targetPath)).resolves.toEqual({ status: "skipped", mode: "symlink" });
    await expect(createSkillSymlink(sourcePath, targetPath, { allowReplaceExisting: true })).resolves.toEqual({
      status: "created",
      mode: "symlink",
    });
  });

  it("classifies copy projections as current, stale, locally-modified, orphaned, and legacy-stale", async () => {
    const workspace = await createTempWorkspace();
    const centralSkillsDir = path.join(workspace.homeDir, ".aweskill", "skills");
    const skillsDir = path.join(workspace.rootDir, "agent", "skills");
    await mkdir(skillsDir, { recursive: true });

    for (const name of ["fresh", "moved-on", "gone", "legacy", "legacy-drift"]) {
      await writeSkill(path.join(centralSkillsDir, name), name);
      await createSkillCopy(path.join(centralSkillsDir, name), path.join(skillsDir, name));
    }

    await writeFile(path.join(centralSkillsDir, "moved-on", "SKILL.md"), "# moved on v2\n", "utf8");
    await rm(path.join(centralSkillsDir, "gone"), { recursive: true, force: true });
    for (const name of ["legacy", "legacy-drift"]) {
      const markerPath = path.join(skillsDir, name, ".aweskill-projection.json");
      const marker = JSON.parse(await readFile(markerPath, "utf8"));
      delete marker.contentHash;
      await writeFile(markerPath, JSON.stringify(marker, null, 2), "utf8");
    }
    await writeFile(path.join(centralSkillsDir, "legacy-drift", "SKILL.md"), "# legacy drift v2\n", "utf8");
    await writeFile(path.join(skillsDir, "fresh", "SKILL.md"), "# user edit\n", "utf8");

    await expect(evaluateCopyProjections(skillsDir, centralSkillsDir)).resolves.toEqual(
      new Map([
        ["fresh", { kind: "locally-modified" }],
        ["moved-on", { kind: "stale", legacy: false }],
        ["gone", { kind: "orphaned" }],
        ["legacy", { kind: "current" }],
        ["legacy-drift", { kind: "stale", legacy: true }],
      ]),
    );
  });

  it("does not treat sibling central-store prefixes as managed symlinks", async () => {
    const workspace = await createTempWorkspace();
    const centralSkillsDir = path.join(workspace.homeDir, ".aweskill", "skills");
    const siblingSkillsDir = `${centralSkillsDir}2`;
    const targetDir = path.join(workspace.rootDir, "agent", "skills");
    const siblingSourcePath = path.join(siblingSkillsDir, "prefix-trap");
    const targetPath = path.join(targetDir, "prefix-trap");

    await writeSkill(siblingSourcePath, "Prefix Trap");
    await mkdir(targetDir, { recursive: true });
    await createSkillSymlink(siblingSourcePath, targetPath);

    await expect(inspectProjectionTarget(targetPath, { centralSkillsDir })).resolves.toEqual({
      kind: "foreign_symlink",
      sourcePath: path.resolve(siblingSourcePath),
    });

    const managed = await listManagedSkillNames(targetDir, centralSkillsDir);
    expect(managed.has("prefix-trap")).toBe(false);
  });

  it("resolves a relative link target by default and an absolute one when opted in", () => {
    const sourcePath = path.join(path.sep, "central", "skills", "link-me");
    const targetPath = path.join(path.sep, "repo", "agent", "skills", "link-me");

    expect(resolveDirectoryLinkTarget(sourcePath, targetPath, false)).toBe(
      path.relative(path.dirname(targetPath), sourcePath),
    );
    expect(resolveDirectoryLinkTarget(sourcePath, targetPath, true)).toBe(path.resolve(sourcePath));
  });

  it("reads the absolute-symlink opt-in from the environment", () => {
    expect(shouldUseAbsoluteLinkTarget({})).toBe(false);
    expect(shouldUseAbsoluteLinkTarget({ AWESKILL_ABSOLUTE_SYMLINKS: "0" })).toBe(false);
    expect(shouldUseAbsoluteLinkTarget({ AWESKILL_ABSOLUTE_SYMLINKS: "1" })).toBe(true);
  });

  it("writes an absolute on-disk target when AWESKILL_ABSOLUTE_SYMLINKS=1", async () => {
    const workspace = await createTempWorkspace();
    const sourcePath = getSkillPath(workspace.homeDir, "abs-link");
    const targetDir = path.join(workspace.rootDir, "agent", "skills");
    const targetPath = path.join(targetDir, "abs-link");

    await writeSkill(sourcePath, "Abs Link");
    await mkdir(targetDir, { recursive: true });

    const previous = process.env.AWESKILL_ABSOLUTE_SYMLINKS;
    process.env.AWESKILL_ABSOLUTE_SYMLINKS = "1";
    try {
      await expect(createSkillSymlink(sourcePath, targetPath)).resolves.toEqual({ status: "created", mode: "symlink" });
    } finally {
      if (previous === undefined) {
        delete process.env.AWESKILL_ABSOLUTE_SYMLINKS;
      } else {
        process.env.AWESKILL_ABSOLUTE_SYMLINKS = previous;
      }
    }

    // Windows readlink appends a trailing separator for directory symlinks; normalize both sides.
    expect(path.resolve(await readlink(targetPath))).toBe(path.resolve(sourcePath));
  });

  it("writes an absolute on-disk target when the absolute option is set, regardless of env", async () => {
    const workspace = await createTempWorkspace();
    const sourcePath = getSkillPath(workspace.homeDir, "abs-opt");
    const targetDir = path.join(workspace.rootDir, "agent", "skills");
    const targetPath = path.join(targetDir, "abs-opt");

    await writeSkill(sourcePath, "Abs Opt");
    await mkdir(targetDir, { recursive: true });

    const previous = process.env.AWESKILL_ABSOLUTE_SYMLINKS;
    delete process.env.AWESKILL_ABSOLUTE_SYMLINKS;
    try {
      await expect(createSkillSymlink(sourcePath, targetPath, { absolute: true })).resolves.toEqual({
        status: "created",
        mode: "symlink",
      });
    } finally {
      if (previous === undefined) {
        delete process.env.AWESKILL_ABSOLUTE_SYMLINKS;
      } else {
        process.env.AWESKILL_ABSOLUTE_SYMLINKS = previous;
      }
    }

    // Windows readlink appends a trailing separator for directory symlinks; normalize both sides.
    expect(path.resolve(await readlink(targetPath))).toBe(path.resolve(sourcePath));
  });
});
