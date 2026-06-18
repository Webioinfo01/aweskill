import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getAweskillPaths } from "./path.js";
import { getNpmLatestVersion } from "./self-update.js";
import { AWESKILL_VERSION } from "./version.js";

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const REMIND_INTERVAL_MS = 24 * 60 * 60 * 1000;

interface UpdateCache {
  lastChecked: string;
  latestVersion: string;
  lastReminded: string;
}

function shouldSkipUpdateCheck(args: string[]): boolean {
  if (args.length === 0) {
    return true;
  }
  if (
    args.includes("-h") ||
    args.includes("--help") ||
    args.includes("-v") ||
    args.includes("-V") ||
    args.includes("--version")
  ) {
    return true;
  }
  return args[0] === "self-update";
}

async function loadCache(filePath: string): Promise<UpdateCache | null> {
  try {
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data) as UpdateCache;
  } catch {
    return null;
  }
}

async function saveCache(filePath: string, data: UpdateCache): Promise<void> {
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
  } catch {
    // ignore write failures
  }
}

export async function maybeCheckForUpdate(homeDir: string, args: string[]): Promise<string | null> {
  if (process.env.AWESKILL_NO_UPDATE_CHECK === "1") {
    return null;
  }
  if (shouldSkipUpdateCheck(args)) {
    return null;
  }

  const { updateCheckFile } = getAweskillPaths(homeDir);
  const cache = await loadCache(updateCheckFile);
  const now = Date.now();

  let latestVersion: string | null = null;

  if (cache && now - new Date(cache.lastChecked).getTime() < CHECK_INTERVAL_MS) {
    latestVersion = cache.latestVersion;
  } else {
    try {
      latestVersion = await getNpmLatestVersion();
      await saveCache(updateCheckFile, {
        lastChecked: new Date().toISOString(),
        latestVersion,
        lastReminded: cache?.lastReminded ?? "",
      });
    } catch {
      return null;
    }
  }

  if (!latestVersion || latestVersion === AWESKILL_VERSION) {
    return null;
  }

  const lastRemindedMs = cache?.lastReminded ? new Date(cache.lastReminded).getTime() : 0;
  if (now - lastRemindedMs < REMIND_INTERVAL_MS) {
    return null;
  }

  const message = `Update available: ${AWESKILL_VERSION} → ${latestVersion}. Run \`aweskill self-update\` to update.`;

  await saveCache(updateCheckFile, {
    lastChecked: cache?.lastChecked ?? new Date().toISOString(),
    latestVersion,
    lastReminded: new Date().toISOString(),
  });

  return message;
}
