import { describe, expect, it } from "vitest";

import {
  addSkillToBundle,
  createBundle,
  deleteBundle,
  listBundles,
  readBundle,
  removeSkillFromBundle,
  writeBundle,
} from "../src/lib/bundles.js";
import { getSkillPath } from "../src/lib/skills.js";
import { createTempWorkspace, writeSkill } from "./helpers.js";

describe("bundles", () => {
  it("creates, reads, lists, mutates, and deletes bundles", async () => {
    const workspace = await createTempWorkspace();
    await writeSkill(getSkillPath(workspace.homeDir, "shell"), "Shell");
    await writeSkill(getSkillPath(workspace.homeDir, "python"), "Python");

    await createBundle(workspace.homeDir, "backend");
    await addSkillToBundle(workspace.homeDir, "backend", "shell");
    await addSkillToBundle(workspace.homeDir, "backend", "python");

    await expect(readBundle(workspace.homeDir, "backend")).resolves.toEqual({
      name: "backend",
      skills: [
        { name: "python", source: null },
        { name: "shell", source: null },
      ],
    });
    await expect(listBundles(workspace.homeDir)).resolves.toEqual([
      {
        name: "backend",
        skills: [
          { name: "python", source: null },
          { name: "shell", source: null },
        ],
      },
    ]);

    await removeSkillFromBundle(workspace.homeDir, "backend", "shell");
    await expect(readBundle(workspace.homeDir, "backend")).resolves.toEqual({
      name: "backend",
      skills: [{ name: "python", source: null }],
    });

    await expect(deleteBundle(workspace.homeDir, "backend")).resolves.toBe(true);
    await expect(listBundles(workspace.homeDir)).resolves.toEqual([]);
  });

  it("rejects adding unknown skills to a bundle", async () => {
    const workspace = await createTempWorkspace();
    await createBundle(workspace.homeDir, "backend");

    await expect(addSkillToBundle(workspace.homeDir, "backend", "missing-skill")).rejects.toThrow(
      "Unknown skill: missing-skill",
    );
  });

  it("merges legacy source groups into per-skill sources and keeps unmatched skills null", async () => {
    const workspace = await createTempWorkspace();

    await writeBundle(workspace.homeDir, {
      name: "family",
      skills: ["alpha", "beta"],
      sources: [
        { source: "wehuman01/alpha", skills: ["alpha"] },
        { source: "", skills: ["beta"] },
        { source: "wehuman01/gamma", skills: [] },
        { source: "wehuman01/beta", skills: ["beta"] },
      ],
    } as never);

    await expect(readBundle(workspace.homeDir, "family")).resolves.toEqual({
      name: "family",
      skills: [
        { name: "alpha", source: "wehuman01/alpha" },
        { name: "beta", source: "wehuman01/beta" },
      ],
    });
  });

  it("reads plain legacy bundles as skills with null sources", async () => {
    const workspace = await createTempWorkspace();

    await writeBundle(workspace.homeDir, {
      name: "legacy",
      skills: ["alpha", "beta"],
    } as never);

    await expect(readBundle(workspace.homeDir, "legacy")).resolves.toEqual({
      name: "legacy",
      skills: [
        { name: "alpha", source: null },
        { name: "beta", source: null },
      ],
    });
  });
});
