import { readBundle } from "../lib/bundles.js";
import {
  type DownloadableSkill,
  DuplicateSkillNameError,
  findDownloadableSkillForLockEntry,
  formatDuplicateSkillNameConflict,
} from "../lib/download.js";
import { pathExists } from "../lib/fs.js";
import { fetchGitHubRepoTree, getGitHubTreeShaForSubpath } from "../lib/github-tree.js";
import { computeDirectoryHash } from "../lib/hash.js";
import { importPath } from "../lib/import.js";
import { readSkillLock, removeSkillLockEntry, type SkillLockEntry, upsertSkillLockEntry } from "../lib/lock.js";
import { getSkillPath } from "../lib/skills.js";
import { parseDownloadSource } from "../lib/source-parser.js";
import { formatNoTrackedUpdatesMessage, formatUpdateStatusLines } from "../lib/update.js";
import type { RuntimeContext } from "../types.js";
import { resolveSourceRoot } from "./download.js";

export interface UpdateOptions {
  bundle?: string;
  check?: boolean;
  override?: boolean;
  prune?: boolean;
  source?: string;
  skills?: string[];
  verbose?: boolean;
}

interface SelectedSkillEntry {
  name: string;
  entry: SkillLockEntry;
}

interface UpdateSourceGroup {
  key: string;
  entries: SelectedSkillEntry[];
}

interface PreparedUpdateGroup {
  entries: SelectedSkillEntry[];
  skipped: string[];
  remoteTreeShas: Map<string, string>;
}

interface SourceMissingEntry {
  name: string;
  entry: SkillLockEntry;
}

function entryMatchesSource(entry: SkillLockEntry, source?: string): boolean {
  return !source || entry.source === source || entry.sourceUrl === source;
}

export async function resolveUpdateRoot(context: RuntimeContext, entry: SkillLockEntry) {
  const parsed = parseDownloadSource(entry.sourceType === "local" ? entry.source : entry.sourceUrl, context.cwd);
  parsed.ref = entry.ref;
  return resolveSourceRoot(parsed);
}

export function groupEntriesBySource(entries: SelectedSkillEntry[]): UpdateSourceGroup[] {
  const groups = new Map<string, UpdateSourceGroup>();

  for (const item of entries) {
    const key = JSON.stringify({
      sourceType: item.entry.sourceType,
      source: item.entry.source,
      sourceUrl: item.entry.sourceUrl,
      ref: item.entry.ref ?? null,
    });
    const existing = groups.get(key);
    if (existing) {
      existing.entries.push(item);
      continue;
    }
    groups.set(key, { key, entries: [item] });
  }

  return [...groups.values()];
}

async function prepareUpdateGroup(
  context: RuntimeContext,
  group: UpdateSourceGroup,
  options: UpdateOptions,
): Promise<PreparedUpdateGroup> {
  const firstEntry = group.entries[0]?.entry;
  if (!firstEntry || firstEntry.sourceType !== "github") {
    return { entries: group.entries, skipped: [], remoteTreeShas: new Map() };
  }

  const remoteTree = await fetchGitHubRepoTree(firstEntry.source, firstEntry.ref);
  if (!remoteTree) {
    return { entries: group.entries, skipped: [], remoteTreeShas: new Map() };
  }

  const remoteTreeShas = new Map<string, string>();
  const entriesToClone: SelectedSkillEntry[] = [];
  const skipped: string[] = [];

  for (const item of group.entries) {
    const remoteTreeSha = item.entry.subpath ? getGitHubTreeShaForSubpath(remoteTree, item.entry.subpath) : undefined;
    if (remoteTreeSha) {
      remoteTreeShas.set(item.name, remoteTreeSha);
    }

    if (!remoteTreeSha || !item.entry.remoteTreeSha || remoteTreeSha !== item.entry.remoteTreeSha) {
      entriesToClone.push(item);
      continue;
    }

    const destination = getSkillPath(context.homeDir, item.name);
    if (!(await pathExists(destination))) {
      if (!options.override) {
        if (options.prune) {
          await removeSkillLockEntry(context.homeDir, item.name);
          context.write(`Pruned ${item.name} from update tracking.`);
          skipped.push(item.name);
          continue;
        }
        for (const line of formatUpdateStatusLines(item.name, "missing-local-skill")) {
          context.write(line);
        }
        skipped.push(item.name);
        continue;
      }
      entriesToClone.push(item);
      continue;
    }

    const currentHash = await computeDirectoryHash(destination);
    if (currentHash === item.entry.computedHash) {
      for (const line of formatUpdateStatusLines(item.name, "up-to-date")) {
        context.write(line);
      }
      continue;
    }

    if (!options.override) {
      for (const line of formatUpdateStatusLines(item.name, "local-changes-detected")) {
        context.write(line);
      }
      skipped.push(item.name);
      continue;
    }

    entriesToClone.push(item);
  }

  return { entries: entriesToClone, skipped, remoteTreeShas };
}

function formatSourceMissingSummary(entries: SourceMissingEntry[], options: Pick<UpdateOptions, "verbose">): string {
  const sorted = [...entries].sort((left, right) => left.name.localeCompare(right.name));
  const lines = [
    `Source-missing tracked skills: ${sorted.length}`,
    "These skills were not found at their recorded source/subpath.",
    "",
  ];

  if (options.verbose) {
    for (const { name, entry } of sorted) {
      lines.push(`- ${name}`);
      lines.push(`  source: ${entry.source}`);
      lines.push(`  url: ${entry.sourceUrl}`);
      if (entry.ref) {
        lines.push(`  ref: ${entry.ref}`);
      }
      if (entry.subpath) {
        lines.push(`  subpath: ${entry.subpath}`);
      }
      lines.push("");
    }
    lines.push("Suggested next steps:");
    lines.push("  aweskill store install <source> --list");
    lines.push("  aweskill store remove <old-skill> --force");
    lines.push("  aweskill store install <source> --skill <new-skill-name>");
    if (sorted.length === 1) {
      const [missing] = sorted;
      const installSource = missing!.entry.sourceType === "local" ? missing!.entry.source : missing!.entry.sourceUrl;
      lines.push("");
      lines.push("For this skill:");
      lines.push(`  aweskill store install ${installSource} --list`);
      lines.push(`  aweskill store remove ${missing!.name} --force`);
      lines.push(`  aweskill store install ${installSource} --skill <new-skill-name>`);
    }
    return lines.join("\n").trim();
  }

  for (const { name } of sorted) {
    lines.push(`  - ${name}`);
  }
  lines.push("");
  lines.push("Run this command to show recorded source details and suggested recovery commands:");
  lines.push(`  aweskill store update --verbose ${sorted.map(({ name }) => name).join(" ")}`);
  return lines.join("\n");
}

export async function runUpdate(context: RuntimeContext, options: UpdateOptions = {}) {
  const lock = await readSkillLock(context.homeDir);
  const selectedNames = new Set(options.skills ?? []);

  if (options.bundle) {
    const bundle = await readBundle(context.homeDir, options.bundle);
    for (const skill of bundle.skills) {
      selectedNames.add(skill);
    }
  }
  const entries = Object.entries(lock.skills).filter(([name, entry]) => {
    if (selectedNames.size > 0 && !selectedNames.has(name)) {
      return false;
    }
    return entryMatchesSource(entry, options.source);
  });

  if (entries.length === 0) {
    context.write(formatNoTrackedUpdatesMessage());
    return { updated: [], skipped: [] };
  }

  const updated: string[] = [];
  const skipped: string[] = [];
  const sourceMissing: SourceMissingEntry[] = [];

  for (const group of groupEntriesBySource(entries.map(([name, entry]) => ({ name, entry })))) {
    const preparedGroup = await prepareUpdateGroup(context, group, options);
    skipped.push(...preparedGroup.skipped);
    if (preparedGroup.entries.length === 0) {
      continue;
    }

    const sourceRoot = await resolveUpdateRoot(context, preparedGroup.entries[0]!.entry);
    try {
      for (const { name, entry } of preparedGroup.entries) {
        let remoteSkill: DownloadableSkill | undefined;
        try {
          remoteSkill = await findDownloadableSkillForLockEntry(sourceRoot.root, name, entry);
        } catch (error) {
          if (error instanceof DuplicateSkillNameError) {
            for (const line of formatDuplicateSkillNameConflict(error, {
              source: entry.sourceType === "local" ? entry.source : undefined,
              sourceUrl: entry.sourceUrl,
              ref: entry.ref,
              commandName: "aweskill store install",
            })) {
              context.write(line);
            }
            skipped.push(name);
            continue;
          }
          throw error;
        }
        if (!remoteSkill) {
          sourceMissing.push({ name, entry });
          skipped.push(name);
          continue;
        }

        const remoteHash = await computeDirectoryHash(remoteSkill.path);
        const destination = getSkillPath(context.homeDir, name);
        if (!(await pathExists(destination))) {
          if (!options.override) {
            if (options.prune) {
              await removeSkillLockEntry(context.homeDir, name);
              context.write(`Pruned ${name} from update tracking.`);
              skipped.push(name);
              continue;
            }
            for (const line of formatUpdateStatusLines(name, "missing-local-skill")) {
              context.write(line);
            }
            skipped.push(name);
            continue;
          }
        } else {
          const currentHash = await computeDirectoryHash(destination);
          if (currentHash === remoteHash) {
            for (const line of formatUpdateStatusLines(name, "up-to-date")) {
              context.write(line);
            }
            continue;
          }
          if (currentHash !== entry.computedHash && !options.override) {
            for (const line of formatUpdateStatusLines(name, "local-changes-detected")) {
              context.write(line);
            }
            skipped.push(name);
            continue;
          }
        }

        if (options.check) {
          for (const line of formatUpdateStatusLines(name, "update-available")) {
            context.write(line);
          }
          continue;
        }

        await importPath({
          homeDir: context.homeDir,
          sourcePath: remoteSkill.path,
          skillName: name,
          override: true,
        });
        await upsertSkillLockEntry(context.homeDir, name, {
          source: entry.source,
          sourceType: entry.sourceType,
          sourceUrl: entry.sourceUrl,
          ref: entry.ref,
          subpath: remoteSkill.subpath,
          computedHash: remoteHash,
          remoteTreeSha: preparedGroup.remoteTreeShas.get(name),
        });
        updated.push(name);
        for (const line of formatUpdateStatusLines(name, "updated")) {
          context.write(line);
        }
      }
    } finally {
      await sourceRoot.cleanup?.();
    }
  }

  if (sourceMissing.length > 0) {
    context.write(formatSourceMissingSummary(sourceMissing, options));
  }

  return { updated, skipped };
}
