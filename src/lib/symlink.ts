import { cp, lstat, mkdir, readdir, readFile, readlink, rm, symlink, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { pathExists } from "./fs.js";
import { computeDirectoryHash } from "./hash.js";
import { isPathSafe } from "./path.js";

export const COPY_MARKER_FILE = ".aweskill-projection.json";
const COPY_MARKER = COPY_MARKER_FILE;

interface CopyMarker {
  managedBy: "aweskill";
  sourcePath: string;
  /**
   * Hash of the store content at projection time. Lets doctor tell "store
   * moved on, copy is pristine" (safe to refresh) from "someone edited the
   * copy" (never overwrite). Absent in markers written before this field.
   */
  contentHash?: string;
}

export type ProjectionTargetStatus =
  | { kind: "missing" }
  | { kind: "managed_symlink"; sourcePath: string; matchesSource: boolean }
  | { kind: "managed_copy"; sourcePath: string; matchesSource: boolean }
  | { kind: "foreign_symlink"; sourcePath: string }
  | { kind: "directory" }
  | { kind: "file" };

export interface ProjectionResult {
  status: "created" | "skipped";
  mode: "symlink" | "copy";
  /** True when a replaced managed copy contained edits that did not come from the store. */
  hadLocalEdits?: boolean;
}

type DirectoryLinkCreator = (sourcePath: string, targetPath: string, useAbsolute?: boolean) => Promise<void>;

async function tryLstat(targetPath: string) {
  try {
    return await lstat(targetPath);
  } catch {
    return null;
  }
}

async function readCopyMarker(targetPath: string): Promise<CopyMarker | null> {
  try {
    const content = await readFile(path.join(targetPath, COPY_MARKER), "utf8");
    const parsed = JSON.parse(content) as CopyMarker;
    return parsed.managedBy === "aweskill" ? parsed : null;
  } catch {
    return null;
  }
}

function computeCopyBaseline(targetPath: string): Promise<string> {
  return computeDirectoryHash(targetPath, { excludedFileNames: new Set([COPY_MARKER_FILE]) });
}

async function detectLocalEdits(targetPath: string, marker: CopyMarker | null): Promise<boolean> {
  if (!marker?.contentHash) {
    return false;
  }
  return (await computeCopyBaseline(targetPath)) !== marker.contentHash;
}

async function writeCopyMarker(sourcePath: string, targetPath: string): Promise<void> {
  const marker: CopyMarker = {
    managedBy: "aweskill",
    sourcePath: path.resolve(sourcePath),
    contentHash: await computeDirectoryHash(sourcePath),
  };
  await writeFile(path.join(targetPath, COPY_MARKER), JSON.stringify(marker, null, 2), "utf8");
}

export function getDirectoryLinkTypeForPlatform(platform = process.platform): "dir" | "junction" {
  return platform === "win32" ? "junction" : "dir";
}

export function shouldUseAbsoluteLinkTarget(env = process.env): boolean {
  return env.AWESKILL_ABSOLUTE_SYMLINKS === "1";
}

// Relative targets keep projections portable, but they only resolve at the depth they were
// created for: once committed to git and checked out into a differently-nested worktree, the
// same relative target dangles. An absolute target resolves at any depth. Opt in with
// AWESKILL_ABSOLUTE_SYMLINKS=1; the default stays relative.
export function resolveDirectoryLinkTarget(
  sourcePath: string,
  targetPath: string,
  useAbsolute = shouldUseAbsoluteLinkTarget(),
): string {
  if (useAbsolute) {
    return path.resolve(sourcePath);
  }
  return path.relative(path.dirname(targetPath), sourcePath) || ".";
}

async function defaultDirectoryLinkCreator(
  sourcePath: string,
  targetPath: string,
  useAbsolute = shouldUseAbsoluteLinkTarget(),
): Promise<void> {
  await symlink(
    resolveDirectoryLinkTarget(sourcePath, targetPath, useAbsolute),
    targetPath,
    getDirectoryLinkTypeForPlatform(),
  );
}

let directoryLinkCreator: DirectoryLinkCreator = defaultDirectoryLinkCreator;

export function setDirectoryLinkCreatorForTesting(creator?: DirectoryLinkCreator): void {
  directoryLinkCreator = creator ?? defaultDirectoryLinkCreator;
}

function shouldFallbackToCopy(error: unknown, platform = process.platform): boolean {
  if (platform !== "win32") {
    return false;
  }

  const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
  return code === "EPERM" || code === "EACCES" || code === "EINVAL" || code === "UNKNOWN";
}

export async function inspectProjectionTarget(
  targetPath: string,
  options: { centralSkillsDir?: string; sourcePath?: string } = {},
): Promise<ProjectionTargetStatus> {
  const existing = await tryLstat(targetPath);
  if (!existing) {
    return { kind: "missing" };
  }

  const centralRoot = options.centralSkillsDir ? path.resolve(options.centralSkillsDir) : undefined;
  const expectedSource = options.sourcePath ? path.resolve(options.sourcePath) : undefined;

  if (existing.isSymbolicLink()) {
    const currentTarget = await readlink(targetPath);
    const resolvedCurrent = path.resolve(path.dirname(targetPath), currentTarget);
    if (centralRoot && isPathSafe(centralRoot, resolvedCurrent)) {
      return {
        kind: "managed_symlink",
        sourcePath: resolvedCurrent,
        matchesSource: expectedSource ? resolvedCurrent === expectedSource : true,
      };
    }
    return { kind: "foreign_symlink", sourcePath: resolvedCurrent };
  }

  if (existing.isDirectory()) {
    const marker = await readCopyMarker(targetPath);
    if (marker) {
      return {
        kind: "managed_copy",
        sourcePath: marker.sourcePath,
        matchesSource: expectedSource ? marker.sourcePath === expectedSource : true,
      };
    }
    return { kind: "directory" };
  }

  return { kind: "file" };
}

export async function assertProjectionTargetSafe(
  mode: "symlink" | "copy",
  sourcePath: string,
  targetPath: string,
  options: { allowReplaceExisting?: boolean } = {},
): Promise<void> {
  const status = await inspectProjectionTarget(targetPath, { sourcePath });
  if (status.kind === "missing") {
    return;
  }

  if (mode === "symlink") {
    if ((status.kind === "managed_symlink" || status.kind === "managed_copy") && status.matchesSource) {
      return;
    }
    if (options.allowReplaceExisting) {
      return;
    }
    throw new Error(`Refusing to overwrite non-symlink target: ${targetPath}`);
  }

  if (status.kind === "managed_symlink" || status.kind === "managed_copy") {
    return;
  }

  if (options.allowReplaceExisting) {
    return;
  }
  throw new Error(`Refusing to overwrite unmanaged directory: ${targetPath}`);
}

export async function createSkillSymlink(
  sourcePath: string,
  targetPath: string,
  options: { allowReplaceExisting?: boolean; absolute?: boolean } = {},
): Promise<ProjectionResult> {
  await mkdir(path.dirname(targetPath), { recursive: true });
  const existing = await tryLstat(targetPath);
  let hadLocalEdits = false;

  if (existing?.isSymbolicLink()) {
    const currentTarget = await readlink(targetPath);
    const resolvedCurrent = path.resolve(path.dirname(targetPath), currentTarget);
    // Without force, re-projecting the same source is an idempotent no-op;
    // with force the caller asked for a real recreate.
    if (resolvedCurrent === path.resolve(sourcePath) && !options.allowReplaceExisting) {
      return { status: "skipped", mode: "symlink" };
    }
    await unlink(targetPath);
  } else if (existing) {
    if (existing.isDirectory()) {
      const marker = await readCopyMarker(targetPath);
      if (marker?.sourcePath === path.resolve(sourcePath) && !options.allowReplaceExisting) {
        return { status: "skipped", mode: "copy" };
      }
      hadLocalEdits = await detectLocalEdits(targetPath, marker);
    }

    if (!options.allowReplaceExisting) {
      throw new Error(`Refusing to overwrite non-symlink target: ${targetPath}`);
    }
    await rm(targetPath, { force: true, recursive: true });
  }

  let result: ProjectionResult;
  try {
    await directoryLinkCreator(sourcePath, targetPath, options.absolute);
    result = { status: "created", mode: "symlink" };
  } catch (error) {
    if (!shouldFallbackToCopy(error)) {
      throw error;
    }
    result = await createSkillCopy(sourcePath, targetPath, options);
  }
  return hadLocalEdits ? { ...result, hadLocalEdits: true } : result;
}

export async function createSkillCopy(
  sourcePath: string,
  targetPath: string,
  options: { allowReplaceExisting?: boolean } = {},
): Promise<ProjectionResult> {
  await mkdir(path.dirname(targetPath), { recursive: true });
  const existing = await tryLstat(targetPath);
  let hadLocalEdits = false;

  if (existing?.isSymbolicLink()) {
    await unlink(targetPath);
  } else if (existing) {
    const marker = await readCopyMarker(targetPath);
    const matchesSource = marker?.sourcePath === path.resolve(sourcePath);
    if (matchesSource && !options.allowReplaceExisting) {
      return { status: "skipped", mode: "copy" };
    }
    if (!marker && !options.allowReplaceExisting) {
      throw new Error(`Refusing to overwrite unmanaged directory: ${targetPath}`);
    }
    hadLocalEdits = await detectLocalEdits(targetPath, marker);
    await rm(targetPath, { force: true, recursive: true });
  }

  await cp(sourcePath, targetPath, { recursive: true });
  await writeCopyMarker(sourcePath, targetPath);
  return hadLocalEdits ? { status: "created", mode: "copy", hadLocalEdits: true } : { status: "created", mode: "copy" };
}

export async function removeManagedProjection(targetPath: string): Promise<boolean> {
  const existing = await tryLstat(targetPath);
  if (!existing) {
    return false;
  }

  if (existing.isSymbolicLink()) {
    await unlink(targetPath);
    return true;
  }

  if (existing.isDirectory()) {
    const marker = await readCopyMarker(targetPath);
    if (marker) {
      await rm(targetPath, { force: true, recursive: true });
      return true;
    }
  }

  return false;
}

export async function removeProjectionTarget(
  targetPath: string,
  options: { force?: boolean; centralSkillsDir?: string } = {},
): Promise<boolean> {
  const status = await inspectProjectionTarget(targetPath, { centralSkillsDir: options.centralSkillsDir });
  if (status.kind === "missing") {
    return false;
  }

  if (status.kind === "managed_symlink") {
    await unlink(targetPath);
    return true;
  }

  if (status.kind === "managed_copy" || status.kind === "directory") {
    if (status.kind === "directory" && !options.force) {
      return false;
    }
    await rm(targetPath, { force: true, recursive: true });
    return true;
  }

  if (status.kind === "foreign_symlink") {
    if (!options.force) {
      return false;
    }
    await unlink(targetPath);
    return true;
  }

  if (status.kind === "file") {
    if (!options.force) {
      return false;
    }
    await rm(targetPath, { force: true });
    return true;
  }

  return false;
}

export async function listManagedSkillNames(
  skillsDir: string,
  centralSkillsDir: string,
): Promise<Map<string, "symlink" | "copy">> {
  const result = new Map<string, "symlink" | "copy">();

  try {
    const entries = await readdir(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      const targetPath = path.join(skillsDir, entry.name);
      const stats = await tryLstat(targetPath);
      if (stats?.isSymbolicLink()) {
        try {
          const currentTarget = await readlink(targetPath);
          const resolvedCurrent = path.resolve(path.dirname(targetPath), currentTarget);
          if (isPathSafe(centralSkillsDir, resolvedCurrent)) {
            result.set(entry.name, "symlink");
          }
        } catch {
          result.set(entry.name, "symlink");
        }
        continue;
      }

      if (stats?.isDirectory()) {
        const marker = await readCopyMarker(targetPath);
        if (marker) {
          result.set(entry.name, "copy");
        }
      }
    }
  } catch {
    return result;
  }

  return result;
}

export async function listBrokenSymlinkNames(skillsDir: string): Promise<Set<string>> {
  const result = new Set<string>();

  try {
    const entries = await readdir(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      const targetPath = path.join(skillsDir, entry.name);
      const stats = await tryLstat(targetPath);
      if (!stats?.isSymbolicLink()) {
        continue;
      }

      try {
        const currentTarget = await readlink(targetPath);
        const resolvedCurrent = path.resolve(path.dirname(targetPath), currentTarget);
        if (!(await tryLstat(resolvedCurrent))) {
          result.add(entry.name);
        }
      } catch {
        result.add(entry.name);
      }
    }
  } catch {
    return result;
  }

  return result;
}

export type CopyProjectionStatus =
  | { kind: "current" }
  /** The store moved on; `legacy` markers predate content hashes, so a refresh cannot be proven safe. */
  | { kind: "stale"; legacy: boolean }
  | { kind: "locally-modified" }
  | { kind: "orphaned" };

/**
 * Compare every managed copy projection against its store source. Symlink
 * projections stay in sync by construction and are not evaluated here.
 */
export async function evaluateCopyProjections(
  skillsDir: string,
  centralSkillsDir: string,
): Promise<Map<string, CopyProjectionStatus>> {
  const result = new Map<string, CopyProjectionStatus>();

  try {
    const entries = await readdir(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      const targetPath = path.join(skillsDir, entry.name);
      const stats = await tryLstat(targetPath);
      if (!stats?.isDirectory()) {
        continue;
      }

      const marker = await readCopyMarker(targetPath);
      if (!marker || !isPathSafe(centralSkillsDir, path.resolve(marker.sourcePath))) {
        continue;
      }

      if (!(await pathExists(marker.sourcePath))) {
        result.set(entry.name, { kind: "orphaned" });
        continue;
      }

      const copyHash = await computeCopyBaseline(targetPath);
      const storeHash = await computeDirectoryHash(marker.sourcePath);
      if (!marker.contentHash) {
        result.set(entry.name, copyHash === storeHash ? { kind: "current" } : { kind: "stale", legacy: true });
        continue;
      }
      if (copyHash !== marker.contentHash) {
        result.set(entry.name, { kind: "locally-modified" });
        continue;
      }
      result.set(entry.name, copyHash === storeHash ? { kind: "current" } : { kind: "stale", legacy: false });
    }
  } catch {
    return result;
  }

  return result;
}
