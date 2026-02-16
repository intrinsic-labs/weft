import { mkdtempSync, mkdirSync, rmSync, utimesSync, writeFileSync } from "fs";
import * as os from "os";
import * as path from "path";
import { pathToFileURL } from "url";
import { afterEach, describe, expect, it } from "vitest";
import { checkBuildFreshness } from "./build-freshness.js";

const REQUIRED_SOURCE_FILES = ["ast.ts", "analyzer.ts", "parser.ts", "cli.ts", "server.ts"];
const REQUIRED_DIST_FILES = ["ast.js", "analyzer.js", "parser.js", "cli.js", "server.js"];

const tempDirs: string[] = [];

afterEach(() => {
  delete process.env.WEFT_SKIP_BUILD_CHECK;
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function setupFixture(): {
  packageRoot: string;
  entryMetaUrl: string;
  sourceFile: string;
  distFile: string;
} {
  const packageRoot = mkdtempSync(path.join(os.tmpdir(), "weft-freshness-"));
  tempDirs.push(packageRoot);

  const srcDir = path.join(packageRoot, "src");
  const distDir = path.join(packageRoot, "dist");
  mkdirSync(srcDir, { recursive: true });
  mkdirSync(distDir, { recursive: true });

  for (const name of REQUIRED_SOURCE_FILES) {
    writeFileSync(path.join(srcDir, name), `// ${name}\n`);
  }
  for (const name of REQUIRED_DIST_FILES) {
    writeFileSync(path.join(distDir, name), `// ${name}\n`);
  }

  const sourceFile = path.join(srcDir, "parser.ts");
  const distFile = path.join(distDir, "parser.js");
  const entryMetaUrl = pathToFileURL(path.join(distDir, "cli.js")).toString();
  return { packageRoot, entryMetaUrl, sourceFile, distFile };
}

describe("checkBuildFreshness", () => {
  it("returns stale when source is newer than dist output", () => {
    const { entryMetaUrl, sourceFile, distFile } = setupFixture();
    utimesSync(distFile, new Date(1000), new Date(1000));
    utimesSync(sourceFile, new Date(3000), new Date(3000));

    const result = checkBuildFreshness(entryMetaUrl, "weft");
    expect(result.ok).toBe(false);
    expect(result.message).toContain("stale build artifacts");
    expect(result.message).toContain("parser.ts is newer than dist/parser.js");
  });

  it("passes when dist output is newer than source", () => {
    const { entryMetaUrl, sourceFile, distFile } = setupFixture();
    utimesSync(sourceFile, new Date(1000), new Date(1000));
    utimesSync(distFile, new Date(3000), new Date(3000));

    const result = checkBuildFreshness(entryMetaUrl, "weft");
    expect(result.ok).toBe(true);
  });

  it("passes when source directory is missing", () => {
    const packageRoot = mkdtempSync(path.join(os.tmpdir(), "weft-freshness-no-src-"));
    tempDirs.push(packageRoot);
    const distDir = path.join(packageRoot, "dist");
    mkdirSync(distDir, { recursive: true });
    writeFileSync(path.join(distDir, "cli.js"), "// cli\n");

    const entryMetaUrl = pathToFileURL(path.join(distDir, "cli.js")).toString();
    const result = checkBuildFreshness(entryMetaUrl, "weft");
    expect(result.ok).toBe(true);
  });

  it("supports WEFT_SKIP_BUILD_CHECK override", () => {
    const { entryMetaUrl, sourceFile, distFile } = setupFixture();
    utimesSync(distFile, new Date(1000), new Date(1000));
    utimesSync(sourceFile, new Date(3000), new Date(3000));
    process.env.WEFT_SKIP_BUILD_CHECK = "1";

    const result = checkBuildFreshness(entryMetaUrl, "weft");
    expect(result.ok).toBe(true);
  });
});

