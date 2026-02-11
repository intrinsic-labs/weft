#!/usr/bin/env node

/**
 * Weft CLI - Command-line interface for analyzing Weft specifications.
 *
 * Commands:
 *   weft check [path]                 - Validate spec file(s) and report errors
 *   weft stats [path]                 - Show architecture statistics
 *   weft coverage [path]              - Show coverage report
 *   weft query [path] <query> [args]  - Query spec file(s)
 *   weft deps [path]                  - Show dependency graph
 */

import { readFileSync, existsSync, readdirSync, statSync, type Dirent } from "fs";
import * as path from "path";
import { parse } from "./parser.js";
import {
  analyzeWorkspace,
  coverage,
  getTypesByRole,
  getTypesByLifecycle,
  getDependencyGraph,
  getSchemaTypes,
  type Symbol,
  type SymbolTable,
} from "./analyzer.js";
import type { Document, RoleKind, LifecycleKind } from "./ast.js";

// ============================================
// CLI Entry Point
// ============================================

const args = process.argv.slice(2);

if (args.length === 0) {
  printUsage();
  process.exit(0);
}

const command = args[0];
const QUERY_NAMES = new Set(["types", "rules", "definitions", "decisions", "questions", "role", "lifecycle", "schemas"]);

switch (command) {
  case "check":
    runCheck(args[1]);
    break;
  case "stats":
    runStats(args[1]);
    break;
  case "coverage":
    runCoverage(args[1]);
    break;
  case "query": {
    const { targetPath, query, queryArgs } = parseQueryCommandArgs(args.slice(1));
    runQuery(targetPath, query, queryArgs);
    break;
  }
  case "deps":
    runDeps(args[1]);
    break;
  case "help":
  case "--help":
  case "-h":
    printUsage();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
}

// ============================================
// Commands
// ============================================

function runCheck(targetPath?: string): void {
  const { diagnostics, sourceFiles } = loadAndAnalyze(targetPath);

  if (diagnostics.length === 0) {
    console.log(`✓ No errors found (${sourceFiles.length} file(s) analyzed)`);
    process.exit(0);
  }

  console.log(`Found ${diagnostics.length} issue(s) across ${sourceFiles.length} file(s):\n`);

  for (const diag of diagnostics) {
    const severity = diag.severity === "error" ? "ERROR" : diag.severity === "warning" ? "WARN" : "INFO";
    const loc = formatDiagnosticLocation(diag);
    console.log(`  ${severity} [${loc}] ${diag.message}`);
    if (diag.code) {
      console.log(`         (${diag.code})`);
    }
  }

  const errors = diagnostics.filter((d) => d.severity === "error");
  if (errors.length > 0) {
    process.exit(1);
  }
}

function runStats(targetPath?: string): void {
  const { document, symbols, diagnostics } = loadAndAnalyze(targetPath);
  const report = coverage(symbols, document);

  console.log("=== Specification Statistics ===\n");

  console.log("Types:");
  console.log(`  Total: ${symbols.types.size}`);
  console.log("");

  console.log("Architecture:");
  console.log(`  Entities:     ${report.architectureStats.entities}`);
  console.log(`  Use Cases:    ${report.architectureStats.usecases}`);
  console.log(`  Repositories: ${report.architectureStats.repositories}`);
  console.log(`  Services:     ${report.architectureStats.services}`);
  console.log(`  ViewModels:   ${report.architectureStats.viewmodels}`);
  console.log(`  Adapters:     ${report.architectureStats.adapters}`);
  console.log(`  Other:        ${report.architectureStats.other}`);
  console.log("");

  console.log("Spec Elements:");
  console.log(`  Rules:        ${symbols.rules.size}`);
  console.log(`  Definitions:  ${symbols.definitions.size}`);
  console.log(`  Decisions:    ${symbols.decisions.size}`);
  console.log(`  Questions:    ${symbols.questions.size}`);
  console.log("");

  console.log("Diagnostics:");
  const errors = diagnostics.filter((d) => d.severity === "error").length;
  const warnings = diagnostics.filter((d) => d.severity === "warning").length;
  console.log(`  Errors:   ${errors}`);
  console.log(`  Warnings: ${warnings}`);
}

function runCoverage(targetPath?: string): void {
  const { document, symbols } = loadAndAnalyze(targetPath);
  const report = coverage(symbols, document);

  console.log("=== Coverage Report ===\n");

  if (report.openQuestions.length > 0) {
    console.log("Open Questions:");
    for (const q of report.openQuestions) {
      console.log(`  - ${q}`);
    }
    console.log("");
  }

  if (report.unimplementedRules.length > 0) {
    console.log("Unimplemented Rules:");
    for (const r of report.unimplementedRules) {
      console.log(`  - ${r}`);
    }
    console.log("");
  }

  if (report.unreferencedDefinitions.length > 0) {
    console.log("Unreferenced Definitions:");
    for (const d of report.unreferencedDefinitions) {
      console.log(`  - ${d}`);
    }
    console.log("");
  }

  if (report.undocumentedTypes.length > 0) {
    console.log("Undocumented Types:");
    for (const t of report.undocumentedTypes) {
      console.log(`  - ${t}`);
    }
    console.log("");
  }

  if (report.typesWithoutRole.length > 0) {
    console.log("Types Without Role:");
    for (const t of report.typesWithoutRole) {
      console.log(`  - ${t}`);
    }
    console.log("");
  }

  const total =
    report.openQuestions.length +
    report.unimplementedRules.length +
    report.unreferencedDefinitions.length +
    report.undocumentedTypes.length +
    report.typesWithoutRole.length;

  if (total === 0) {
    console.log("✓ Full coverage - no gaps found");
  }
}

function runQuery(targetPath: string | undefined, query: string, queryArgs: string[]): void {
  const { symbols } = loadAndAnalyze(targetPath);

  switch (query) {
    case "types":
      listTypes(symbols);
      break;
    case "rules":
      listRules(symbols);
      break;
    case "definitions":
      listDefinitions(symbols);
      break;
    case "decisions":
      listDecisions(symbols);
      break;
    case "questions":
      listQuestions(symbols);
      break;
    case "role":
      if (!queryArgs[0]) {
        console.error("Usage: weft query [path] role <role>");
        console.error("Roles: entity, usecase, repository, service, viewmodel, gateway, dto, adapter");
        process.exit(1);
      }
      listByRole(symbols, queryArgs[0] as RoleKind);
      break;
    case "lifecycle":
      if (!queryArgs[0]) {
        console.error("Usage: weft query [path] lifecycle <scope>");
        console.error("Scopes: singleton, session, feature, view");
        process.exit(1);
      }
      listByLifecycle(symbols, queryArgs[0] as LifecycleKind);
      break;
    case "schemas":
      listSchemas(symbols);
      break;
    default:
      console.error(`Unknown query: ${query}`);
      console.error("Available queries: types, rules, definitions, decisions, questions, role, lifecycle, schemas");
      process.exit(1);
  }
}

function runDeps(targetPath?: string): void {
  const { symbols } = loadAndAnalyze(targetPath);
  const graph = getDependencyGraph(symbols);

  console.log("=== Dependency Graph ===\n");

  for (const [name, deps] of graph) {
    if (deps.length === 0) {
      console.log(`${name}: (no dependencies)`);
    } else {
      console.log(`${name}:`);
      for (const dep of deps) {
        const depSymbol = symbols.types.get(dep);
        const roleInfo = depSymbol?.role ? ` (@Role(${depSymbol.role}))` : "";
        console.log(`  -> ${dep}${roleInfo}`);
      }
    }
  }
}

// ============================================
// Query Helpers
// ============================================

function listTypes(symbols: SymbolTable): void {
  console.log("Types:\n");
  for (const [name, sym] of symbols.types) {
    const role = sym.role ? ` @Role(${sym.role})` : "";
    const lifecycle = sym.lifecycle ? ` @Lifecycle(${sym.lifecycle})` : "";
    const schema = sym.isSchema ? " @Schema" : "";
    console.log(`  ${name}${role}${lifecycle}${schema}`);
    if (sym.docstring) {
      const firstLine = sym.docstring.trim().split("\n")[0];
      console.log(`    ${firstLine.substring(0, 60)}${firstLine.length > 60 ? "..." : ""}`);
    }
  }
}

function listRules(symbols: SymbolTable): void {
  console.log("Rules:\n");
  for (const [name, sym] of symbols.rules) {
    console.log(`  ${name}`);
    if (sym.docstring) {
      const firstLine = sym.docstring.trim().split("\n")[0];
      console.log(`    ${firstLine.substring(0, 60)}${firstLine.length > 60 ? "..." : ""}`);
    }
  }
}

function listDefinitions(symbols: SymbolTable): void {
  console.log("Definitions:\n");
  for (const [name, sym] of symbols.definitions) {
    console.log(`  ${name}`);
    if (sym.docstring) {
      const firstLine = sym.docstring.trim().split("\n")[0];
      console.log(`    ${firstLine.substring(0, 60)}${firstLine.length > 60 ? "..." : ""}`);
    }
  }
}

function listDecisions(symbols: SymbolTable): void {
  console.log("Decisions:\n");
  for (const [name, sym] of symbols.decisions) {
    console.log(`  ${name}`);
    if (sym.docstring) {
      const firstLine = sym.docstring.trim().split("\n")[0];
      console.log(`    ${firstLine.substring(0, 60)}${firstLine.length > 60 ? "..." : ""}`);
    }
  }
}

function listQuestions(symbols: SymbolTable): void {
  console.log("Open Questions:\n");
  for (const [name, sym] of symbols.questions) {
    console.log(`  ${name}`);
    if (sym.docstring) {
      const firstLine = sym.docstring.trim().split("\n")[0];
      console.log(`    ${firstLine.substring(0, 60)}${firstLine.length > 60 ? "..." : ""}`);
    }
  }
}

function listByRole(symbols: SymbolTable, role: RoleKind): void {
  const types = getTypesByRole(symbols, role);
  console.log(`Types with @Role(${role}):\n`);

  if (types.length === 0) {
    console.log("  (none)");
    return;
  }

  for (const sym of types) {
    console.log(`  ${sym.name}`);
  }
}

function listByLifecycle(symbols: SymbolTable, lifecycle: LifecycleKind): void {
  const types = getTypesByLifecycle(symbols, lifecycle);
  console.log(`Types with @Lifecycle(${lifecycle}):\n`);

  if (types.length === 0) {
    console.log("  (none)");
    return;
  }

  for (const sym of types) {
    console.log(`  ${sym.name}`);
  }
}

function listSchemas(symbols: SymbolTable): void {
  const schemas = getSchemaTypes(symbols);
  console.log("Schema Types:\n");

  if (schemas.length === 0) {
    console.log("  (none)");
    return;
  }

  for (const sym of schemas) {
    console.log(`  ${sym.name}`);
  }
}

// ============================================
// Utilities
// ============================================

function loadAndAnalyze(targetPath?: string): {
  document: Document;
  symbols: SymbolTable;
  diagnostics: ReturnType<typeof analyzeWorkspace>["diagnostics"];
  sourceFiles: string[];
} {
  const sourceFiles = resolveSourceFiles(targetPath);

  if (sourceFiles.length === 0) {
    const scope = targetPath ? path.resolve(targetPath) : process.cwd();
    console.error(`Error: No .weft files found under: ${scope}`);
    process.exit(1);
  }

  const parsedDocs = sourceFiles.map((filePath) => {
    const source = readFileSync(filePath, "utf-8");
    const { document, errors } = parse(source);
    return { filePath, document, errors };
  });

  const { symbols, diagnostics } = analyzeWorkspace(
    parsedDocs.map(({ filePath, document }) => ({ uri: filePath, document })),
  );

  // Add parse errors to diagnostics.
  const parseDiagnostics = parsedDocs.flatMap(({ filePath, errors }) => (
    errors.map((e) => ({
      message: e.message,
      range: e.range,
      uri: filePath,
      severity: "error" as const,
      code: "parse-error",
    }))
  ));

  const allDiagnostics = [...parseDiagnostics, ...diagnostics].sort((a, b) => {
    const aUri = a.uri ?? "";
    const bUri = b.uri ?? "";
    if (aUri !== bUri) return aUri.localeCompare(bUri);
    if (a.range.start.line !== b.range.start.line) return a.range.start.line - b.range.start.line;
    return a.range.start.column - b.range.start.column;
  });

  return {
    document: combineDocuments(parsedDocs.map(({ document }) => document)),
    symbols,
    diagnostics: allDiagnostics,
    sourceFiles,
  };
}

function parseQueryCommandArgs(args: string[]): { targetPath?: string; query: string; queryArgs: string[] } {
  if (args.length === 0) {
    console.error("Usage: weft query [path] <query> [args]");
    process.exit(1);
  }

  const first = args[0];
  if (QUERY_NAMES.has(first)) {
    return { query: first, queryArgs: args.slice(1) };
  }

  if (args.length < 2) {
    console.error(`Error: Missing query after path '${first}'`);
    console.error("Usage: weft query [path] <query> [args]");
    process.exit(1);
  }

  return { targetPath: first, query: args[1], queryArgs: args.slice(2) };
}

function resolveSourceFiles(targetPath?: string): string[] {
  const resolved = targetPath ? path.resolve(targetPath) : process.cwd();

  if (!existsSync(resolved)) {
    console.error(`Error: Path not found: ${resolved}`);
    process.exit(1);
  }

  if (statSync(resolved).isDirectory()) {
    return listWeftFiles(resolved);
  }

  if (!resolved.endsWith(".weft")) {
    console.error(`Error: Expected a .weft file or directory: ${resolved}`);
    process.exit(1);
  }

  return [resolved];
}

function listWeftFiles(dirPath: string): string[] {
  const result: string[] = [];
  const ignoredDirs = new Set([".git", "node_modules", "dist", "target", ".zed"]);

  const stack = [dirPath];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    let entries: Dirent[];
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (isIgnoredWeftPath(fullPath)) {
        continue;
      }
      if (entry.isDirectory()) {
        if (!ignoredDirs.has(entry.name)) {
          stack.push(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith(".weft")) {
        result.push(fullPath);
      }
    }
  }

  result.sort((a, b) => a.localeCompare(b));
  return result;
}

function isIgnoredWeftPath(filePath: string): boolean {
  const normalized = filePath.split(path.sep).join("/");
  return normalized.includes("/packages/zed/grammars/");
}

function combineDocuments(documents: Document[]): Document {
  if (documents.length === 1) {
    return documents[0];
  }

  const declarations = documents.flatMap((d) => d.declarations);
  const first = documents[0];
  const last = documents[documents.length - 1];

  return {
    kind: "Document",
    declarations,
    range: {
      start: first.range.start,
      end: last.range.end,
    },
  };
}

function formatDiagnosticLocation(diag: { uri?: string; range: { start: { line: number; column: number } } }): string {
  const pos = `${diag.range.start.line}:${diag.range.start.column}`;
  if (!diag.uri) {
    return pos;
  }

  const displayPath = path.isAbsolute(diag.uri)
    ? path.relative(process.cwd(), diag.uri) || path.basename(diag.uri)
    : diag.uri;
  return `${displayPath}:${pos}`;
}

function printUsage(): void {
  console.log(`
Weft CLI - Analyze and query Weft specifications

USAGE:
  weft <command> [args]

COMMANDS:
  check [path]                  Validate spec file(s) from path (default: current directory)
  stats [path]                  Show architecture statistics
  coverage [path]               Show coverage gaps (undocumented types, etc.)
  query [path] <query> [args]   Query spec file(s)
  deps [path]                   Show dependency graph

QUERIES:
  types                         List all types
  rules                         List all rules
  definitions                   List all definitions
  decisions                     List all decisions
  questions                     List all open questions
  role <role>                   List types with specific role
  lifecycle <scope>             List types with specific lifecycle
  schemas                       List schema types

EXAMPLES:
  weft check spec.weft
  weft check                    # scan all .weft files under current directory
  weft check ./domain           # scan all .weft files under ./domain
  weft stats spec.weft
  weft query rules              # all rules from current directory downward
  weft query ./domain rules     # all rules under ./domain
  weft query spec.weft types    # query one file
  weft query lifecycle singleton
  weft deps spec.weft
`);
}
