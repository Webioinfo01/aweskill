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
import {
  type NewSkillLockEntry,
  readSkillLock,
  removeSkillLockEntry,
  type SkillLockEntry,
  upsertSkillLockEntry,
} from "../lib/lock.js";
import { getSkillPath } from "../lib/skills.js";
import { parseDownloadSource } from "../lib/source-parser.js";
import { formatNoTrackedUpdatesMessage, formatUpdateStatusLines } from "../lib/update.js";
import type { RuntimeContext } from "../types.js";
import { resolveSourceRoot } from "./download.js";

/** Max source repos contacted in parallel. Each group is one git clone or archive download. */
const UPDATE_SOURCE_CONCURRENCY = 6;

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
  lines: string[];
  prunes: string[];
  remoteTreeShas: Map<string, string>;
  resolvedRef?: string;
}

interface SourceMissingEntry {
  name: string;
  entry: SkillLockEntry;
}

interface GroupOutcome {
  lines: string[];
  updated: string[];
  skipped: string[];
  sourceMissing: SourceMissingEntry[];
  prunes: string[];
  lockUpserts: Array<{ name: string; entry: NewSkillLockEntry }>;
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

/**
 * In check mode, when the remote tree SHA for the skill subpath differs from the
 * recorded one, we already know an update exists (or the skill drifted locally)
 * without cloning the source. Only safe when GitHub did not truncate the tree.
 */
function canFastPathCheck(
  options: UpdateOptions,
  remoteTreeTruncated: boolean,
  remoteTreeSha: string | undefined,
  entry: SkillLockEntry,
): boolean {
  return (
    options.check === true &&
    !remoteTreeTruncated &&
    remoteTreeSha !== undefined &&
    entry.remoteTreeSha !== undefined &&
    remoteTreeSha !== entry.remoteTreeSha
  );
}

async function prepareUpdateGroup(
  context: RuntimeContext,
  group: UpdateSourceGroup,
  options: UpdateOptions,
): Promise<PreparedUpdateGroup> {
  const prepared: PreparedUpdateGroup = {
    entries: group.entries,
    skipped: [],
    lines: [],
    prunes: [],
    remoteTreeShas: new Map(),
  };

  const firstEntry = group.entries[0]?.entry;
  if (!firstEntry || firstEntry.sourceType !== "github") {
    return prepared;
  }

  const remoteTree = await fetchGitHubRepoTree(firstEntry.source, firstEntry.ref, firstEntry.resolvedRef);
  if (!remoteTree) {
    return prepared;
  }
  prepared.resolvedRef = remoteTree.ref;

  const entriesToClone: SelectedSkillEntry[] = [];

  for (const item of group.entries) {
    const remoteTreeSha = item.entry.subpath ? getGitHubTreeShaForSubpath(remoteTree, item.entry.subpath) : undefined;
    if (remoteTreeSha) {
      prepared.remoteTreeShas.set(item.name, remoteTreeSha);
    }

    if (canFastPathCheck(options, remoteTree.truncated, remoteTreeSha, item.entry)) {
      const destination = getSkillPath(context.homeDir, item.name);
      if (!(await pathExists(destination))) {
        prepared.lines.push(...formatUpdateStatusLines(item.name, "missing-local-skill"));
        prepared.skipped.push(item.name);
        continue;
      }
      const currentHash = await computeDirectoryHash(destination);
      const reason = currentHash === item.entry.computedHash ? "update-available" : "local-changes-detected";
      prepared.lines.push(...formatUpdateStatusLines(item.name, reason));
      if (reason === "local-changes-detected") {
        prepared.skipped.push(item.name);
      }
      continue;
    }

    if (!remoteTreeSha || !item.entry.remoteTreeSha || remoteTreeSha !== item.entry.remoteTreeSha) {
      entriesToClone.push(item);
      continue;
    }

    const destination = getSkillPath(context.homeDir, item.name);
    if (!(await pathExists(destination))) {
      if (!options.override) {
        if (options.prune) {
          prepared.prunes.push(item.name);
          prepared.lines.push(`Pruned ${item.name} from update tracking.`);
          prepared.skipped.push(item.name);
          continue;
        }
        prepared.lines.push(...formatUpdateStatusLines(item.name, "missing-local-skill"));
        prepared.skipped.push(item.name);
        continue;
      }
      entriesToClone.push(item);
      continue;
    }

    const currentHash = await computeDirectoryHash(destination);
    if (currentHash === item.entry.computedHash) {
      prepared.lines.push(...formatUpdateStatusLines(item.name, "up-to-date"));
      continue;
    }

    if (!options.override) {
      prepared.lines.push(...formatUpdateStatusLines(item.name, "local-changes-detected"));
      prepared.skipped.push(item.name);
      continue;
    }

    entriesToClone.push(item);
  }

  prepared.entries = entriesToClone;
  return prepared;
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

async function processUpdateGroup(
  context: RuntimeContext,
  group: UpdateSourceGroup,
  options: UpdateOptions,
): Promise<GroupOutcome> {
  const outcome: GroupOutcome = {
    lines: [],
    updated: [],
    skipped: [],
    sourceMissing: [],
    prunes: [],
    lockUpserts: [],
  };

  const preparedGroup = await prepareUpdateGroup(context, group, options);
  outcome.lines.push(...preparedGroup.lines);
  outcome.skipped.push(...preparedGroup.skipped);
  outcome.prunes.push(...preparedGroup.prunes);
  if (preparedGroup.entries.length === 0) {
    return outcome;
  }

  const sourceRoot = await resolveUpdateRoot(context, preparedGroup.entries[0]!.entry);
  try {
    for (const { name, entry } of preparedGroup.entries) {
      let remoteSkill: DownloadableSkill | undefined;
      try {
        remoteSkill = await findDownloadableSkillForLockEntry(sourceRoot.root, name, entry);
      } catch (error) {
        if (error instanceof DuplicateSkillNameError) {
          outcome.lines.push(
            ...formatDuplicateSkillNameConflict(error, {
              source: entry.sourceType === "local" ? entry.source : undefined,
              sourceUrl: entry.sourceUrl,
              ref: entry.ref,
              commandName: "aweskill store install",
            }),
          );
          outcome.skipped.push(name);
          continue;
        }
        throw error;
      }
      if (!remoteSkill) {
        outcome.sourceMissing.push({ name, entry });
        outcome.skipped.push(name);
        continue;
      }

      const remoteHash = await computeDirectoryHash(remoteSkill.path);
      const destination = getSkillPath(context.homeDir, name);
      if (!(await pathExists(destination))) {
        if (!options.override) {
          if (options.prune) {
            outcome.prunes.push(name);
            outcome.lines.push(`Pruned ${name} from update tracking.`);
            outcome.skipped.push(name);
            continue;
          }
          outcome.lines.push(...formatUpdateStatusLines(name, "missing-local-skill"));
          outcome.skipped.push(name);
          continue;
        }
      } else {
        const currentHash = await computeDirectoryHash(destination);
        if (currentHash === remoteHash) {
          outcome.lines.push(...formatUpdateStatusLines(name, "up-to-date"));
          continue;
        }
        if (currentHash !== entry.computedHash && !options.override) {
          outcome.lines.push(...formatUpdateStatusLines(name, "local-changes-detected"));
          outcome.skipped.push(name);
          continue;
        }
      }

      if (options.check) {
        outcome.lines.push(...formatUpdateStatusLines(name, "update-available"));
        continue;
      }

      await importPath({
        homeDir: context.homeDir,
        sourcePath: remoteSkill.path,
        skillName: name,
        override: true,
      });
      outcome.lockUpserts.push({
        name,
        entry: {
          source: entry.source,
          sourceType: entry.sourceType,
          sourceUrl: entry.sourceUrl,
          ref: entry.ref,
          resolvedRef: preparedGroup.resolvedRef,
          subpath: remoteSkill.subpath,
          computedHash: remoteHash,
          remoteTreeSha: preparedGroup.remoteTreeShas.get(name),
        },
      });
      outcome.updated.push(name);
      outcome.lines.push(...formatUpdateStatusLines(name, "updated"));
    }
  } finally {
    await sourceRoot.cleanup?.();
  }

  return outcome;
}

async function runWithConcurrency<T>(items: T[], limit: number, task: (item: T, index: number) => Promise<void>) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) {
        return;
      }
      await task(items[index]!, index);
    }
  });
  await Promise.all(workers);
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

  const groups = groupEntriesBySource(entries.map(([name, entry]) => ({ name, entry })));
  const outcomes: Array<GroupOutcome | undefined> = new Array(groups.length);

  // Groups run in parallel, but lines are flushed in original group order so the
  // output stays deterministic regardless of completion order.
  let nextToFlush = 0;
  const flushReadyOutcomes = () => {
    while (nextToFlush < outcomes.length && outcomes[nextToFlush]) {
      for (const line of outcomes[nextToFlush]!.lines) {
        context.write(line);
      }
      nextToFlush++;
    }
  };

  await runWithConcurrency(groups, UPDATE_SOURCE_CONCURRENCY, async (group, index) => {
    outcomes[index] = await processUpdateGroup(context, group, options);
    flushReadyOutcomes();
  });
  flushReadyOutcomes();

  // Lock writes are serialized after all groups finish: parallel groups share one
  // lock file and concurrent read-modify-write would lose entries.
  const updated: string[] = [];
  const skipped: string[] = [];
  const sourceMissing: SourceMissingEntry[] = [];
  for (const outcome of outcomes) {
    for (const name of outcome?.prunes ?? []) {
      await removeSkillLockEntry(context.homeDir, name);
    }
    for (const upsert of outcome?.lockUpserts ?? []) {
      await upsertSkillLockEntry(context.homeDir, upsert.name, upsert.entry);
    }
    updated.push(...(outcome?.updated ?? []));
    skipped.push(...(outcome?.skipped ?? []));
    sourceMissing.push(...(outcome?.sourceMissing ?? []));
  }

  if (sourceMissing.length > 0) {
    context.write(formatSourceMissingSummary(sourceMissing, options));
  }

  return { updated, skipped };
}
