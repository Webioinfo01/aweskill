import { buildCanonicalSkillIndex, parseSkillName, resolveCanonicalSkillName } from "../lib/rmdup.js";
import { getSkillSuspicionReason, type listSkills } from "../lib/skills.js";
import type { CopyProjectionStatus } from "../lib/symlink.js";

export type CheckCategory =
  | "linked"
  | "broken"
  | "duplicate"
  | "matched"
  | "new"
  | "suspicious"
  | "external"
  | "stale"
  | "locally-modified";

export interface CheckedSkill {
  name: string;
  path: string;
  category: CheckCategory;
  hasSKILLMd: boolean;
  suspicionReason?: string;
  duplicateKind?: "exact" | "family";
  canonicalName?: string;
  externalOwner?: string;
}

export function classifyCheckedSkill(
  skill: { name: string; path: string; hasSKILLMd: boolean; externalOwner?: string },
  managed: Map<string, "symlink" | "copy">,
  canonicalSkillNames: Map<string, { name: string }>,
  copyStatuses?: Map<string, CopyProjectionStatus>,
): CheckedSkill {
  const suspicionReason = getSkillSuspicionReason(skill);
  if (suspicionReason) {
    return {
      name: skill.name,
      path: skill.path,
      category: "suspicious",
      hasSKILLMd: skill.hasSKILLMd,
      suspicionReason,
    };
  }

  if (skill.externalOwner) {
    return {
      name: skill.name,
      path: skill.path,
      category: "external",
      hasSKILLMd: skill.hasSKILLMd,
      externalOwner: skill.externalOwner,
    };
  }

  let category: CheckCategory = "new";
  let duplicateKind: CheckedSkill["duplicateKind"];
  let canonicalName: string | undefined;
  if (managed.has(skill.name)) {
    category = "linked";
    if (managed.get(skill.name) === "copy") {
      const copyStatus = copyStatuses?.get(skill.name);
      if (copyStatus?.kind === "stale") {
        category = "stale";
      } else if (copyStatus?.kind === "locally-modified") {
        category = "locally-modified";
      }
    }
  } else {
    canonicalName = resolveCanonicalSkillName(skill.name, canonicalSkillNames);
    if (canonicalName) {
      category = canonicalName === skill.name ? "duplicate" : "matched";
      duplicateKind = canonicalName === skill.name ? "exact" : "family";
    }
  }

  if (category === "linked") {
    const parsed = parseSkillName(skill.name);
    canonicalName = canonicalSkillNames.get(parsed.baseName)?.name;
  }

  return {
    name: skill.name,
    path: skill.path,
    category,
    hasSKILLMd: skill.hasSKILLMd,
    duplicateKind,
    canonicalName,
  };
}

export function buildCentralCanonicalSkills(
  centralSkillEntries: Awaited<ReturnType<typeof listSkills>>,
): Map<string, { name: string }> {
  return buildCanonicalSkillIndex(centralSkillEntries);
}
