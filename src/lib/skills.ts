import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

import type { SkillEntry } from "../types.js";
import { pathExists } from "./fs.js";
import { getAweskillPaths, sanitizeName } from "./path.js";

export type SkillSuspicionReason = "missing-skill-md" | "reserved-name";

// Marker files other tools drop into a skill directory to claim ownership,
// mirroring aweskill's own .aweskill-projection.json. aweskill reports these
// entries but never imports, cleans, or re-projects them.
export const FOREIGN_OWNERSHIP_MARKERS: ReadonlyArray<{ fileName: string; owner: string }> = [
  { fileName: ".ctx-skill.json", owner: "ctx" },
];

export async function readExternalOwner(skillPath: string): Promise<string | null> {
  for (const marker of FOREIGN_OWNERSHIP_MARKERS) {
    if (await pathExists(path.join(skillPath, marker.fileName))) {
      return marker.owner;
    }
  }
  return null;
}

export async function ensureHomeLayout(homeDir: string): Promise<void> {
  const paths = getAweskillPaths(homeDir);
  await mkdir(paths.rootDir, { recursive: true });
  await mkdir(paths.skillsDir, { recursive: true });
  await mkdir(paths.dupSkillsDir, { recursive: true });
  await mkdir(paths.backupDir, { recursive: true });
  await mkdir(paths.dedupBackupDir, { recursive: true });
  await mkdir(paths.fixSkillsBackupDir, { recursive: true });
  await mkdir(paths.bundlesDir, { recursive: true });
}

export function getSkillPath(homeDir: string, skillName: string): string {
  return path.join(getAweskillPaths(homeDir).skillsDir, sanitizeName(skillName));
}

export async function listSkills(homeDir: string): Promise<SkillEntry[]> {
  const skillsDir = getAweskillPaths(homeDir).skillsDir;
  return listSkillEntriesInDirectory(skillsDir);
}

export async function listSkillEntriesInDirectory(skillsDir: string): Promise<SkillEntry[]> {
  if (!(await pathExists(skillsDir))) {
    return [];
  }

  const entries = await readdir(skillsDir, { withFileTypes: true });
  const skills = await Promise.all(
    entries
      .filter((entry) => (entry.isDirectory() || entry.isSymbolicLink()) && entry.name !== ".system")
      .map(async (entry) => {
        const skillPath = path.join(skillsDir, entry.name);
        const externalOwner = entry.isDirectory() ? await readExternalOwner(skillPath) : null;
        return {
          name: entry.name,
          path: skillPath,
          hasSKILLMd: await pathExists(path.join(skillPath, "SKILL.md")),
          ...(externalOwner ? { externalOwner } : {}),
        } satisfies SkillEntry;
      }),
  );

  return skills.sort((left, right) => left.name.localeCompare(right.name));
}

export async function assertSkillSource(sourcePath: string): Promise<void> {
  const skillReadme = path.join(sourcePath, "SKILL.md");
  if (!(await pathExists(skillReadme))) {
    throw new Error(`Skill source must contain SKILL.md: ${sourcePath}`);
  }
}

export async function skillExists(homeDir: string, skillName: string): Promise<boolean> {
  return pathExists(getSkillPath(homeDir, skillName));
}

export function getSkillSuspicionReason(skill: Pick<SkillEntry, "name" | "hasSKILLMd">): SkillSuspicionReason | null {
  if (!skill.hasSKILLMd) {
    return "missing-skill-md";
  }

  if (skill.name.startsWith(".")) {
    return "reserved-name";
  }

  return null;
}
