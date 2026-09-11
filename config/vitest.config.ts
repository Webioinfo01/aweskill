import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // main() checks the npm registry for a newer version on every run; tests use
    // fresh home dirs with no cache, so without this every main()-based test hits
    // the network and can exceed the 5s test timeout when the registry is slow.
    env: { AWESKILL_NO_UPDATE_CHECK: "1" },
  },
});
