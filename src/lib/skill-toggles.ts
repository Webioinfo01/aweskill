import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Minimal editor for Codex `[[skills.config]]` entries in `~/.codex/config.toml`.
 *
 * Codex honors name-based selectors from the user config layer only:
 *
 *   [[skills.config]]
 *   name = "skill-name"
 *   enabled = false
 *
 * A name selector hides every discovered copy of that skill, no matter which
 * root it was found in (~/.codex/skills, ~/.agents/skills, repo .agents/skills),
 * which is exactly what cross-root "temporarily remove" needs. aweskill only
 * touches blocks it created (marked with a trailing `# aweskill` comment on the
 * header line) and leaves the rest of the file byte-for-byte untouched.
 */

const MANAGED_MARKER = "# aweskill";
const TABLE_HEADER = /^\s*\[\[skills\.config\]\]/;
const ANY_HEADER = /^\s*\[/;

export interface SkillToggleEntry {
  name?: string;
  enabled: boolean;
  managed: boolean;
}

interface ParsedBlock {
  headerIndex: number;
  endIndex: number; // exclusive
  entry: SkillToggleEntry;
}

function parseQuotedValue(raw: string): string {
  const value = raw.trim();
  const openingQuote = value[0];
  if (openingQuote === '"' || openingQuote === "'") {
    const closingIndex = value.indexOf(openingQuote, 1);
    if (closingIndex > 0) {
      return value.slice(1, closingIndex);
    }
  }
  // Bare value: cut at a trailing comment if TOML's basic string rules did not apply.
  const bare = stripComment(value).trim();
  return bare;
}

function stripComment(line: string): string {
  let quote: '"' | "'" | null = null;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (quote) {
      if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "#") {
      return line.slice(0, index);
    }
  }
  return line;
}

function parseKeyValue(line: string): { key: string; value: string } | null {
  const equalsIndex = stripComment(line).indexOf("=");
  if (equalsIndex === -1) {
    return null;
  }
  const key = line.slice(0, equalsIndex).trim();
  const value = line.slice(equalsIndex + 1).trim();
  if (!key) {
    return null;
  }
  return { key, value };
}

function parseBlocks(lines: string[]): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!line || !TABLE_HEADER.test(line)) {
      continue;
    }
    const entry: SkillToggleEntry = { enabled: true, managed: line.includes(MANAGED_MARKER) };
    let endIndex = index + 1;
    while (endIndex < lines.length && !ANY_HEADER.test(lines[endIndex])) {
      const parsed = parseKeyValue(lines[endIndex]);
      if (parsed) {
        if (parsed.key === "name") {
          entry.name = parseQuotedValue(parsed.value);
        } else if (parsed.key === "enabled") {
          entry.enabled = parsed.value === "true";
        }
      }
      endIndex += 1;
    }
    blocks.push({ headerIndex: index, endIndex, entry });
  }
  return blocks;
}

function ensureTrailingNewline(content: string): string {
  return content.endsWith("\n") ? content : `${content}\n`;
}

function formatManagedBlock(skillName: string, enabled: boolean): string {
  return [`[[skills.config]] ${MANAGED_MARKER}`, `name = "${skillName}"`, `enabled = ${enabled}`].join("\n");
}

async function readConfigLines(configPath: string): Promise<string[] | null> {
  try {
    const content = await readFile(configPath, "utf8");
    return content.split("\n");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

/** Lists every [[skills.config]] entry (managed or hand-written) keyed by skill name. */
export async function listSkillToggles(configPath: string): Promise<Map<string, SkillToggleEntry>> {
  const lines = await readConfigLines(configPath);
  const result = new Map<string, SkillToggleEntry>();
  if (!lines) {
    return result;
  }
  for (const block of parseBlocks(lines)) {
    if (block.entry.name) {
      // Later entries override earlier ones, matching Codex rule resolution.
      result.set(block.entry.name, block.entry);
    }
  }
  return result;
}

export async function isSkillDisabled(configPath: string, skillName: string): Promise<boolean> {
  const toggles = await listSkillToggles(configPath);
  return toggles.get(skillName)?.enabled === false;
}

export type SetSkillEnabledResult = "disabled" | "enabled" | "updated" | "noop";

/**
 * Ensures a managed `enabled = <enabled>` entry exists for `skillName`.
 * Creates the config file when missing; never rewrites unrelated content.
 */
export async function setSkillEnabled(
  configPath: string,
  skillName: string,
  enabled: boolean,
): Promise<SetSkillEnabledResult> {
  const lines = (await readConfigLines(configPath)) ?? [];
  const blocks = parseBlocks(lines);
  const existing = blocks.find(
    (block) => block.entry.managed && block.entry.name === skillName && block.entry.name !== undefined,
  );

  if (existing) {
    if (existing.entry.enabled === enabled) {
      return "noop";
    }
    for (let index = existing.headerIndex + 1; index < existing.endIndex; index++) {
      const parsed = parseKeyValue(lines[index]);
      if (parsed?.key === "enabled") {
        lines[index] = `enabled = ${enabled}`;
        break;
      }
    }
    await writeFile(configPath, lines.join("\n"), "utf8");
    return "updated";
  }

  const content =
    (lines.length === 0 ? "" : ensureTrailingNewline(lines.join("\n"))) + formatManagedBlock(skillName, enabled) + "\n";
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, content, "utf8");
  return enabled ? "enabled" : "disabled";
}

/**
 * Removes the managed toggle entry for `skillName` so the skill falls back to
 * Codex defaults (enabled). Hand-written entries are never touched.
 */
export async function removeSkillToggle(configPath: string, skillName: string): Promise<boolean> {
  const lines = await readConfigLines(configPath);
  if (!lines) {
    return false;
  }
  const blocks = parseBlocks(lines).filter(
    (block) => block.entry.managed && block.entry.name === skillName && block.entry.name !== undefined,
  );
  if (blocks.length === 0) {
    return false;
  }
  const removeRanges = blocks.map((block) => [block.headerIndex, block.endIndex] as const);
  const kept = lines.filter((_, index) => !removeRanges.some(([start, end]) => index >= start && index < end));
  await writeFile(configPath, ensureTrailingNewline(kept.join("\n")), "utf8");
  return true;
}
