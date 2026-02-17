import { existsSync, statSync } from "fs";
import { fileURLToPath } from "url";
import * as path from "path";

type CheckTarget = {
  source: string;
  output: string;
};

const CHECK_TARGETS: CheckTarget[] = [
  { source: "ast.ts", output: "ast.js" },
  { source: "analyzer.ts", output: "analyzer.js" },
  { source: "parser.ts", output: "parser.js" },
  { source: "cli.ts", output: "cli.js" },
  { source: "server.ts", output: "server.js" },
];

const MTIME_TOLERANCE_MS = 5;

export interface BuildFreshnessResult {
  ok: boolean;
  message?: string;
}

export function checkBuildFreshness(importMetaUrl: string, commandName: string): BuildFreshnessResult {
  // Escape hatch for unusual environments where timestamps are unreliable.
  if (process.env.WEFT_SKIP_BUILD_CHECK === "1") {
    return { ok: true };
  }

  const currentFilePath = fileURLToPath(importMetaUrl);
  const packageRoot = path.resolve(path.dirname(currentFilePath), "..");
  const srcDir = path.join(packageRoot, "src");
  const distDir = path.join(packageRoot, "dist");

  // Published installs may only ship dist artifacts.
  if (!existsSync(srcDir) || !existsSync(distDir)) {
    return { ok: true };
  }

  const stale: string[] = [];

  for (const target of CHECK_TARGETS) {
    const sourcePath = path.join(srcDir, target.source);
    const outputPath = path.join(distDir, target.output);

    if (!existsSync(sourcePath)) {
      continue;
    }

    if (!existsSync(outputPath)) {
      stale.push(`${target.source} -> missing dist/${target.output}`);
      continue;
    }

    const sourceMtime = statSync(sourcePath).mtimeMs;
    const outputMtime = statSync(outputPath).mtimeMs;
    if (sourceMtime > outputMtime + MTIME_TOLERANCE_MS) {
      stale.push(`${target.source} is newer than dist/${target.output}`);
    }
  }

  if (stale.length === 0) {
    return { ok: true };
  }

  const details = stale.map((entry) => `  - ${entry}`).join("\n");
  const message = [
    `${commandName} detected stale build artifacts for @rocketbro/weft.`,
    "Source files are newer than dist output.",
    "",
    details,
    "",
    "Fix:",
    "  npm run build --workspace=@rocketbro/weft",
    "",
    "If this is intentional, bypass once with WEFT_SKIP_BUILD_CHECK=1.",
  ].join("\n");

  return { ok: false, message };
}

