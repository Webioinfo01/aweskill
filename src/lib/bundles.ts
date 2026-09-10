import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { parse, stringify } from "yaml";

import type { BundleDefinition, BundleSkill } from "../types.js";
import { pathExists } from "./fs.js";
import { getAweskillPaths, sanitizeName } from "./path.js";
import { skillExists } from "./skills.js";

function bundleFilePath(homeDir: string, bundleName: string): string {
  return path.join(getAweskillPaths(homeDir).bundlesDir, `${sanitizeName(bundleName)}.yaml`);
}

function bundleFilePathInDirectory(bundlesDir: string, bundleName: string): string {
  return path.join(bundlesDir, `${sanitizeName(bundleName)}.yaml`);
}

/**
 * Normalizes a raw bundle document into the per-skill format. Accepts both
 * the current format (`skills: [{name, source}]`, `source: null` for skills
 * without one) and the legacy format (`skills: [name...]` plus optional
 * `sources: [{source, skills}]` groups, merged in per skill name).
 */
export function normalizeBundle(raw: unknown, fallbackName: string): BundleDefinition {
  const data = (raw ?? {}) as { name?: unknown; skills?: unknown; sources?: unknown };

  const legacySources = new Map<string, string>();
  if (Array.isArray(data.sources)) {
    for (const group of data.sources as { source?: unknown; skills?: unknown }[]) {
      const source = String(group?.source ?? "").trim();
      if (source === "" || !Array.isArray(group?.skills)) {
        continue;
      }
      for (const skill of group.skills) {
        const name = sanitizeName(String(skill));
        if (name !== "") {
          legacySources.set(name, source);
        }
      }
    }
  }

  const entries = new Map<string, string | null>();
  const record = (rawName: unknown, rawSource: unknown) => {
    const name = sanitizeName(String(rawName ?? ""));
    if (name === "") {
      return;
    }
    const trimmed = rawSource == null ? "" : String(rawSource).trim();
    const source = trimmed === "" ? (legacySources.get(name) ?? null) : trimmed;
    const existing = entries.get(name);
    if (existing === undefined || (existing === null && source !== null)) {
      entries.set(name, source);
    }
  };

  if (Array.isArray(data.skills)) {
    for (const skill of data.skills) {
      if (typeof skill === "string" || skill === null || skill === undefined) {
        record(skill, undefined);
      } else {
        record((skill as { name?: unknown }).name, (skill as { source?: unknown }).source);
      }
    }
  }

  return {
    name: sanitizeName(String(data.name ?? fallbackName)),
    skills: [...entries]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, source]) => ({ name, source })),
  };
}

export function bundleSkillNames(bundle: BundleDefinition): string[] {
  return bundle.skills.map((skill) => skill.name);
}

export function groupSkillsBySource(skills: BundleSkill[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const skill of skills) {
    if (!skill.source) {
      continue;
    }
    const names = groups.get(skill.source) ?? [];
    names.push(skill.name);
    groups.set(skill.source, names);
  }
  return groups;
}

export async function listBundles(homeDir: string): Promise<BundleDefinition[]> {
  const bundlesDir = getAweskillPaths(homeDir).bundlesDir;
  return listBundlesInDirectory(bundlesDir);
}

export async function listBundlesInDirectory(bundlesDir: string): Promise<BundleDefinition[]> {
  if (!(await pathExists(bundlesDir))) {
    return [];
  }
  const entries = await readdir(bundlesDir, { withFileTypes: true });

  const bundles = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"))
      .map(async (entry) => readBundleFromDirectory(bundlesDir, entry.name.replace(/\.yaml$/, ""))),
  );

  return bundles.sort((left, right) => left.name.localeCompare(right.name));
}

export async function readBundle(homeDir: string, bundleName: string): Promise<BundleDefinition> {
  const filePath = bundleFilePath(homeDir, bundleName);
  const content = await readFile(filePath, "utf8");
  return normalizeBundle(parse(content), bundleName);
}

export async function readBundleFromDirectory(bundlesDir: string, bundleName: string): Promise<BundleDefinition> {
  const filePath = await resolveBundleFilePath(bundlesDir, bundleName);
  const content = await readFile(filePath, "utf8");
  return normalizeBundle(parse(content), bundleName);
}

async function resolveBundleFilePath(bundlesDir: string, bundleName: string): Promise<string> {
  const direct = path.join(bundlesDir, `${bundleName}.yaml`);
  if (await pathExists(direct)) {
    return direct;
  }

  const sanitized = sanitizeName(bundleName);
  if (!(await pathExists(bundlesDir))) {
    return bundleFilePathInDirectory(bundlesDir, bundleName);
  }
  const entries = await readdir(bundlesDir, { withFileTypes: true });
  const match = entries.find(
    (entry) =>
      entry.isFile() && entry.name.endsWith(".yaml") && sanitizeName(entry.name.replace(/\.yaml$/, "")) === sanitized,
  );
  if (match) {
    return path.join(bundlesDir, match.name);
  }

  return bundleFilePathInDirectory(bundlesDir, bundleName);
}

export async function writeBundle(homeDir: string, bundle: BundleDefinition): Promise<BundleDefinition> {
  const normalized = normalizeBundle(bundle, bundle.name);
  const filePath = bundleFilePath(homeDir, normalized.name);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, stringify(normalized), "utf8");
  return normalized;
}

export async function createBundle(homeDir: string, bundleName: string): Promise<BundleDefinition> {
  const normalizedName = sanitizeName(bundleName);
  return writeBundle(homeDir, { name: normalizedName, skills: [] });
}

export async function addSkillToBundle(
  homeDir: string,
  bundleName: string,
  skillName: string,
): Promise<BundleDefinition> {
  const normalizedSkill = sanitizeName(skillName);
  if (!(await skillExists(homeDir, normalizedSkill))) {
    throw new Error(`Unknown skill: ${normalizedSkill}`);
  }

  const bundle = await readBundle(homeDir, bundleName);
  const nextSkills = bundle.skills.some((skill) => skill.name === normalizedSkill)
    ? bundle.skills
    : [...bundle.skills, { name: normalizedSkill, source: null }];
  bundle.skills = nextSkills.sort((left, right) => left.name.localeCompare(right.name));
  return writeBundle(homeDir, bundle);
}

export async function removeSkillFromBundle(
  homeDir: string,
  bundleName: string,
  skillName: string,
): Promise<BundleDefinition> {
  const bundle = await readBundle(homeDir, bundleName);
  const normalizedSkill = sanitizeName(skillName);
  bundle.skills = bundle.skills.filter((skill) => skill.name !== normalizedSkill);
  return writeBundle(homeDir, bundle);
}

export async function deleteBundle(homeDir: string, bundleName: string): Promise<boolean> {
  const filePath = bundleFilePath(homeDir, bundleName);
  if (!(await pathExists(filePath))) {
    return false;
  }

  await rm(filePath, { force: true });
  return true;
}
