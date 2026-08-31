import { removeSkillLockEntry } from "../lib/lock.js";
import { sanitizeName } from "../lib/path.js";
import { findSkillReferences, removeSkillWithReferences } from "../lib/references.js";
import { skillExists } from "../lib/skills.js";
import type { RuntimeContext } from "../types.js";

export async function runRemove(
  context: RuntimeContext,
  options: {
    skillName: string;
    force?: boolean;
    projectDir?: string;
  },
) {
  const normalizedName = sanitizeName(options.skillName);
  if (!(await skillExists(context.homeDir, normalizedName))) {
    throw new Error(`Unknown skill: ${normalizedName}. Run "aweskill store list" to see available skills.`);
  }

  const projectDir = options.projectDir ?? context.cwd;
  const references = await findSkillReferences({
    homeDir: context.homeDir,
    skillName: normalizedName,
    projectDir,
  });
  const referenceCount = references.bundles.length + references.agentProjections.length;

  if (referenceCount > 0 && !options.force) {
    throw new Error(
      `Skill ${normalizedName} is still referenced: ${[...references.bundles, ...references.agentProjections].join(
        ", ",
      )}`,
    );
  }

  await removeSkillWithReferences({
    homeDir: context.homeDir,
    skillName: normalizedName,
    projectDir,
  });
  await removeSkillLockEntry(context.homeDir, normalizedName);
  context.write(`Removed ${normalizedName}`);
  return references;
}
