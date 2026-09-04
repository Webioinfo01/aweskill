import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { pathExists } from "../lib/fs.js";
import { expandHomePath, sanitizeName } from "../lib/path.js";
import { getSkillPath, skillExists } from "../lib/skills.js";
import type { RuntimeContext } from "../types.js";

export interface CreateOptions {
  description?: string;
  dir?: string;
}

const MAX_SKILL_NAME_LENGTH = 64;
const STRICT_SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PLACEHOLDER_DESCRIPTION = "TODO: describe what this skill does and when it should trigger.";

export interface CreateSkillResult {
  name: string;
  skillDir: string;
  skillFile: string;
  description: string;
}

function validateSkillName(rawName: string): string {
  const trimmed = rawName.trim();
  const name = sanitizeName(trimmed);
  if (name.length === 0 || name.length > MAX_SKILL_NAME_LENGTH || !STRICT_SKILL_NAME_PATTERN.test(name)) {
    throw new Error(
      `Invalid skill name: "${trimmed}". Use lowercase letters, digits, and single hyphens (e.g. "my-skill"), 1-${MAX_SKILL_NAME_LENGTH} characters.`,
    );
  }
  return name;
}

function titleFromName(name: string): string {
  return name
    .split("-")
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function renderSkillDoc(name: string, description: string): string {
  // JSON.stringify produces a valid double-quoted YAML scalar, so descriptions
  // containing quotes, colons, or newlines stay frontmatter-safe.
  return [
    "---",
    `name: ${name}`,
    `description: ${JSON.stringify(description)}`,
    "---",
    "",
    `# ${titleFromName(name)}`,
    "",
    "Describe what this skill enables the model to do, in one or two sentences.",
    "",
    "## When to Use",
    "",
    "- List the user phrasings, contexts, or tasks that should trigger this skill.",
    "- Include trigger words in every language your users work in.",
    "",
    "## Workflow",
    "",
    "1. Write the steps in the imperative form.",
    "2. Explain why a step matters when the reason is not obvious.",
    "",
    "## References",
    "",
    "- `references/` — move detailed, on-demand documentation here and link to it from this body.",
    "",
  ].join("\n");
}

export async function runCreate(
  context: RuntimeContext,
  skillName: string,
  options: CreateOptions = {},
): Promise<CreateSkillResult> {
  const name = validateSkillName(skillName);
  if (name !== skillName.trim()) {
    context.write(`Normalized skill name to "${name}"`);
  }

  const skillDir = options.dir
    ? path.join(expandHomePath(options.dir, context.homeDir), name)
    : getSkillPath(context.homeDir, name);
  if (await pathExists(skillDir)) {
    const location = options.dir ? skillDir : "the central store";
    throw new Error(
      `Skill "${name}" already exists in ${location}: ${skillDir}. Edit it there or choose another name.`,
    );
  }

  const description = options.description?.trim() || PLACEHOLDER_DESCRIPTION;
  const skillFile = path.join(skillDir, "SKILL.md");
  await mkdir(skillDir, { recursive: true });
  await mkdir(path.join(skillDir, "references"), { recursive: true });
  await writeFile(skillFile, renderSkillDoc(name, description), "utf8");

  context.write(`Created skill ${name} at ${skillDir}`);
  if (!options.description?.trim()) {
    context.write(
      "Warning: no --description given. The description is the primary trigger signal; replace the TODO placeholder before projecting this skill.",
    );
  }
  context.write("Next steps:");
  context.write(`  1. Edit the skill: ${skillFile}`);
  context.write(
    options.dir
      ? `  2. Add it to the central store when ready: aweskill store install ${skillDir}`
      : `  2. Validate the frontmatter: aweskill doctor fix-skills --skill ${name}`,
  );
  context.write(`  3. Project to an agent: aweskill agent add skill ${name} --global --agent <agent-id>`);

  return { name, skillDir, skillFile, description };
}
