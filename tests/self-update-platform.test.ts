import { afterEach, describe, expect, it, vi } from "vitest";

// Mock execFile so we can inspect the spawn options without running npm.
// The real self-update.test.ts mocks the whole module; this file exercises
// runCommand's platform handling by mocking the lower-level child_process call.
vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

import { execFile } from "node:child_process";
import { getNpmLatestVersion } from "../src/lib/self-update.js";

const originalPlatform = process.platform;

function setPlatform(platform: string): void {
  Object.defineProperty(process, "platform", { value: platform, configurable: true });
}

function mockExecFileOk(output: string): void {
  // execFile always receives the callback as its last positional argument.
  const impl = (...callArgs: unknown[]) => {
    const callback = callArgs[callArgs.length - 1] as (error: Error | null, stdout: string, stderr: string) => void;
    callback(null, output, "");
    return undefined;
  };
  vi.mocked(execFile).mockImplementation(impl as never);
}

afterEach(() => {
  setPlatform(originalPlatform);
  vi.mocked(execFile).mockReset();
});

describe("self-update runCommand platform handling", () => {
  it("routes npm through a shell on Windows so npm.cmd can spawn", async () => {
    setPlatform("win32");
    mockExecFileOk("1.2.3");

    await getNpmLatestVersion();

    const options = vi.mocked(execFile).mock.calls[0]?.[2] as { shell?: boolean } | undefined;
    expect(options?.shell).toBe(true);
  });

  it("does not force a shell on macOS/Linux", async () => {
    setPlatform("darwin");
    mockExecFileOk("1.2.3");

    await getNpmLatestVersion();

    const options = vi.mocked(execFile).mock.calls[0]?.[2] as { shell?: boolean } | undefined;
    expect(options?.shell).toBe(false);
  });

  it("still invokes npm with the expected args", async () => {
    setPlatform("win32");
    mockExecFileOk("9.9.9");

    await getNpmLatestVersion();

    const [command, args] = vi.mocked(execFile).mock.calls[0] as unknown as [string, string[]];
    expect(command).toBe("npm");
    expect(args).toEqual(["view", "aweskill", "version"]);
  });
});
