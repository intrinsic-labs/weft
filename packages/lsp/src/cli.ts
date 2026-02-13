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
  getTypesByBoundary,
  getTypesByPriority,
  getTodos,
  type SymbolTable,
} from "./analyzer.js";
import type { Document, RoleKind, LifecycleKind, BoundaryKind, PriorityLevel, TodoStatus } from "./ast.js";

// ============================================
// CLI Entry Point
// ============================================

const args = process.argv.slice(2);

if (args.length === 0) {
  printUsage();
  process.exit(0);
}

const command = args[0];
const QUERY_NAMES = new Set([
  "types",
  "rules",
  "definitions",
  "decisions",
  "questions",
  "role",
  "lifecycle",
  "schemas",
  "boundary",
  "priority",
  "todos",
]);
type OutputFormat = "text" | "json";

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
  case "contract": {
    const { targetPath, format } = parsePathWithFormatArgs(args.slice(1), "contract");
    runContract(targetPath, format);
    break;
  }
  case "bootstrap": {
    const { targetPath, format, target } = parseBootstrapArgs(args.slice(1));
    runBootstrap(targetPath, format, target);
    break;
  }
  case "docs":
    runDocs(args.slice(1));
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
    case "boundary":
      if (!queryArgs[0]) {
        console.error("Usage: weft query [path] boundary <boundary>");
        console.error("Boundaries: api, database|db, queue, filesystem|fs, ui, external");
        process.exit(1);
      }
      listByBoundary(symbols, normalizeBoundaryValue(queryArgs[0]));
      break;
    case "priority":
      if (!queryArgs[0]) {
        console.error("Usage: weft query [path] priority <level>");
        console.error("Priority levels: p0, p1, p2, p3, critical, high, medium, low");
        process.exit(1);
      }
      listByPriority(symbols, normalizePriorityValue(queryArgs[0]));
      break;
    case "todos":
      if (queryArgs[0]) {
        listTodos(symbols, normalizeTodoStatus(queryArgs[0]));
      } else {
        listTodos(symbols);
      }
      break;
    default:
      console.error(`Unknown query: ${query}`);
      console.error("Available queries: types, rules, definitions, decisions, questions, role, lifecycle, schemas, boundary, priority, todos");
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

function runContract(targetPath: string | undefined, format: OutputFormat): void {
  const { document, symbols, diagnostics, sourceFiles } = loadAndAnalyze(targetPath);
  const report = coverage(symbols, document);
  const todos = getTodos(symbols);
  const graph = getDependencyGraph(symbols);

  const dependencyGraph = Object.fromEntries([...graph.entries()]);
  const blockers = diagnostics
    .filter((d) => d.severity === "error")
    .map((d) => ({ message: d.message, code: d.code, uri: d.uri, line: d.range.start.line, column: d.range.start.column }));

  const contract = {
    sourceFiles,
    summary: {
      types: symbols.types.size,
      rules: symbols.rules.size,
      definitions: symbols.definitions.size,
      decisions: symbols.decisions.size,
      questions: symbols.questions.size,
    },
    diagnostics: {
      total: diagnostics.length,
      errors: diagnostics.filter((d) => d.severity === "error").length,
      warnings: diagnostics.filter((d) => d.severity === "warning").length,
      infos: diagnostics.filter((d) => d.severity === "info").length,
    },
    obligations: {
      rules: [...symbols.rules.keys()],
      unimplementedRules: report.unimplementedRules,
      openQuestions: report.openQuestions,
      todos: todos.map(({ symbol, todo }) => ({
        symbol: symbol.name,
        status: todo.status,
        priority: todo.priority ?? symbol.priority,
        owner: todo.owner,
        due: todo.due,
        id: todo.id,
        summary: todo.summary,
      })),
    },
    architecture: {
      dependencyGraph,
    },
    blockers,
  };

  if (format === "json") {
    console.log(JSON.stringify(contract, null, 2));
    return;
  }

  console.log("=== Implementation Contract ===\n");
  console.log(`Files: ${sourceFiles.length}`);
  console.log(`Types: ${contract.summary.types}`);
  console.log(`Rules: ${contract.summary.rules}`);
  console.log(`Open Questions: ${contract.obligations.openQuestions.length}`);
  console.log(`TODOs: ${contract.obligations.todos.length}`);
  console.log(`Diagnostics: ${contract.diagnostics.total} (${contract.diagnostics.errors} errors, ${contract.diagnostics.warnings} warnings)`);
  console.log("");

  if (contract.obligations.unimplementedRules.length > 0) {
    console.log("Unimplemented Rules:");
    for (const rule of contract.obligations.unimplementedRules) {
      console.log(`  - ${rule}`);
    }
    console.log("");
  }

  if (contract.obligations.openQuestions.length > 0) {
    console.log("Open Questions:");
    for (const question of contract.obligations.openQuestions) {
      console.log(`  - ${question}`);
    }
    console.log("");
  }

  if (contract.obligations.todos.length > 0) {
    console.log("TODOs:");
    for (const todo of contract.obligations.todos) {
      const owner = todo.owner ? ` owner:${todo.owner}` : "";
      const due = todo.due ? ` due:${todo.due}` : "";
      const priority = todo.priority ? ` priority:${todo.priority}` : "";
      console.log(`  - [${todo.status}] ${todo.symbol} - ${todo.summary}${priority}${owner}${due}`);
    }
    console.log("");
  }

  if (contract.blockers.length > 0) {
    console.log("Blocking Diagnostics:");
    for (const blocker of contract.blockers) {
      const location = blocker.uri ? `${blocker.uri}:${blocker.line}:${blocker.column}` : `${blocker.line}:${blocker.column}`;
      console.log(`  - [${location}] ${blocker.message}${blocker.code ? ` (${blocker.code})` : ""}`);
    }
  } else {
    console.log("✓ No blocking diagnostics");
  }
}

function runBootstrap(targetPath: string | undefined, format: OutputFormat, target?: string): void {
  const { document, symbols, diagnostics, sourceFiles } = loadAndAnalyze(targetPath);
  const report = coverage(symbols, document);
  const graph = getDependencyGraph(symbols);
  const todos = getTodos(symbols);

  const byRole = {
    entity: getTypesByRole(symbols, "entity").map((s) => s.name),
    usecase: getTypesByRole(symbols, "usecase").map((s) => s.name),
    repository: getTypesByRole(symbols, "repository").map((s) => s.name),
    service: getTypesByRole(symbols, "service").map((s) => s.name),
    viewmodel: getTypesByRole(symbols, "viewmodel").map((s) => s.name),
    gateway: getTypesByRole(symbols, "gateway").map((s) => s.name),
    dto: getTypesByRole(symbols, "dto").map((s) => s.name),
    adapter: getTypesByRole(symbols, "adapter").map((s) => s.name),
  };

  const boundaries = [...symbols.types.values()]
    .filter((s) => s.boundary)
    .map((s) => ({ symbol: s.name, boundary: s.boundary, system: s.boundarySystem }));

  const firstActions: string[] = [];
  if (diagnostics.some((d) => d.severity === "error")) {
    firstActions.push("Resolve all parser/analyzer errors before implementation.");
  }
  if (report.openQuestions.length > 0) {
    firstActions.push("Resolve open questions or set temporary assumptions before coding.");
  }
  if (report.unimplementedRules.length > 0) {
    firstActions.push("Map each unimplemented rule to concrete code paths and tests.");
  }
  if (todos.some((t) => t.todo.status === "blocked")) {
    firstActions.push("Unblock @TODO items marked blocked or explicitly defer them.");
  }
  if (firstActions.length === 0) {
    firstActions.push("Start implementing use cases and enforce rules with tests.");
  }

  const bootstrap = {
    target: target ?? null,
    languageCard: {
      declarations: ["type", "struct", "data", "protocol", "interface", "service", "enum", "view"],
      keyAnnotations: [
        "@Rule",
        "@Definition",
        "@Decision",
        "@OpenQuestion",
        "@Implements",
        "@See",
        "@Role",
        "@Lifecycle",
        "@Schema",
        "@Boundary",
        "@Priority",
        "@TODO",
      ],
    },
    projectCard: {
      sourceFiles,
      counts: {
        types: symbols.types.size,
        rules: symbols.rules.size,
        definitions: symbols.definitions.size,
        decisions: symbols.decisions.size,
        openQuestions: symbols.questions.size,
      },
    },
    executionContract: {
      unimplementedRules: report.unimplementedRules,
      openQuestions: report.openQuestions,
      diagnostics: {
        errors: diagnostics.filter((d) => d.severity === "error").length,
        warnings: diagnostics.filter((d) => d.severity === "warning").length,
      },
      todos: todos.map(({ symbol, todo }) => ({
        symbol: symbol.name,
        summary: todo.summary,
        status: todo.status,
        priority: todo.priority ?? symbol.priority,
      })),
    },
    implementationMap: {
      byRole,
      boundaries,
      dependencyGraph: Object.fromEntries([...graph.entries()]),
    },
    firstActions,
  };

  if (format === "json") {
    console.log(JSON.stringify(bootstrap, null, 2));
    return;
  }

  console.log("=== Bootstrap ===\n");
  console.log(`Files: ${bootstrap.projectCard.sourceFiles.length}`);
  if (bootstrap.target) {
    console.log(`Target: ${bootstrap.target}`);
  }
  console.log(`Errors: ${bootstrap.executionContract.diagnostics.errors}`);
  console.log(`Open Questions: ${bootstrap.executionContract.openQuestions.length}`);
  console.log(`Unimplemented Rules: ${bootstrap.executionContract.unimplementedRules.length}`);
  console.log(`TODOs: ${bootstrap.executionContract.todos.length}`);
  console.log("");
  console.log("First Actions:");
  for (const action of bootstrap.firstActions) {
    console.log(`  - ${action}`);
  }
}

function runDocs(args: string[]): void {
  const subcommand = args[0];
  if (subcommand !== "query") {
    console.error("Usage: weft docs query <terms...> [--limit N] [--format text|json]");
    process.exit(1);
  }

  const { query, limit, format } = parseDocsQueryArgs(args.slice(1));
  const root = findDocsRoot(process.cwd());
  if (!root) {
    console.error("Error: Could not find repository docs root.");
    process.exit(1);
  }

  const files = collectDocsFiles(root);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results: Array<{ file: string; score: number; snippets: string[] }> = [];

  for (const filePath of files) {
    const text = readFileSync(filePath, "utf-8");
    const lower = text.toLowerCase();
    let score = 0;
    for (const term of terms) {
      score += countOccurrences(lower, term);
    }
    if (score === 0) continue;

    const snippets = pickSnippets(text, terms, 2);
    results.push({
      file: path.relative(root, filePath),
      score,
      snippets,
    });
  }

  results.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));
  const top = results.slice(0, limit);

  if (format === "json") {
    console.log(JSON.stringify({ query, limit, results: top }, null, 2));
    return;
  }

  if (top.length === 0) {
    console.log("No docs matches found.");
    return;
  }

  console.log(`Docs matches for "${query}":\n`);
  for (const item of top) {
    console.log(`- ${item.file} (score: ${item.score})`);
    for (const snippet of item.snippets) {
      console.log(`    ${snippet}`);
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
    const boundary = sym.boundary ? ` @Boundary(${sym.boundary}${sym.boundarySystem ? `, "${sym.boundarySystem}"` : ""})` : "";
    const priority = sym.priority ? ` @Priority(${sym.priority})` : "";
    const todoCount = sym.todos?.length ? ` @TODO(${sym.todos.length})` : "";
    console.log(`  ${name}${role}${lifecycle}${schema}${boundary}${priority}${todoCount}`);
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

function listByBoundary(symbols: SymbolTable, boundary: BoundaryKind): void {
  const types = getTypesByBoundary(symbols, boundary);
  console.log(`Types with @Boundary(${boundary}):\n`);

  if (types.length === 0) {
    console.log("  (none)");
    return;
  }

  for (const sym of types) {
    const system = sym.boundarySystem ? ` "${sym.boundarySystem}"` : "";
    console.log(`  ${sym.name}${system}`);
  }
}

function listByPriority(symbols: SymbolTable, priority: PriorityLevel): void {
  const types = getTypesByPriority(symbols, priority);
  console.log(`Types with @Priority(${priority}):\n`);

  if (types.length === 0) {
    console.log("  (none)");
    return;
  }

  for (const sym of types) {
    console.log(`  ${sym.name}`);
  }
}

function listTodos(symbols: SymbolTable, status?: TodoStatus): void {
  const todos = getTodos(symbols, status);
  const heading = status ? `TODOs with status=${status}:\n` : "TODOs:\n";
  console.log(heading);

  if (todos.length === 0) {
    console.log("  (none)");
    return;
  }

  for (const { symbol, todo } of todos) {
    const details = [
      `status:${todo.status}`,
      todo.priority ? `priority:${todo.priority}` : undefined,
      todo.owner ? `owner:${todo.owner}` : undefined,
      todo.due ? `due:${todo.due}` : undefined,
      todo.id ? `id:${todo.id}` : undefined,
    ].filter(Boolean).join(" ");
    console.log(`  - ${symbol.name}: ${todo.summary}${details ? ` (${details})` : ""}`);
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

function parsePathWithFormatArgs(args: string[], commandName: string): { targetPath?: string; format: OutputFormat } {
  let targetPath: string | undefined;
  let format: OutputFormat = "text";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--format") {
      const value = args[++i];
      if (value !== "text" && value !== "json") {
        console.error(`Invalid --format for ${commandName}: ${value}`);
        process.exit(1);
      }
      format = value;
      continue;
    }

    if (!targetPath) {
      targetPath = arg;
      continue;
    }

    console.error(`Unexpected argument for ${commandName}: ${arg}`);
    process.exit(1);
  }

  return { targetPath, format };
}

function parseBootstrapArgs(args: string[]): { targetPath?: string; format: OutputFormat; target?: string } {
  let targetPath: string | undefined;
  let format: OutputFormat = "text";
  let target: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--format") {
      const value = args[++i];
      if (value !== "text" && value !== "json") {
        console.error(`Invalid --format for bootstrap: ${value}`);
        process.exit(1);
      }
      format = value;
      continue;
    }

    if (arg === "--target") {
      const value = args[++i];
      if (!value) {
        console.error("Missing value for --target");
        process.exit(1);
      }
      target = value;
      continue;
    }

    if (!targetPath) {
      targetPath = arg;
      continue;
    }

    console.error(`Unexpected argument for bootstrap: ${arg}`);
    process.exit(1);
  }

  return { targetPath, format, target };
}

function parseDocsQueryArgs(args: string[]): { query: string; limit: number; format: OutputFormat } {
  let limit = 5;
  let format: OutputFormat = "text";
  const terms: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--limit") {
      const value = args[++i];
      const parsed = Number.parseInt(value ?? "", 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        console.error(`Invalid --limit value: ${value}`);
        process.exit(1);
      }
      limit = parsed;
      continue;
    }

    if (arg === "--format") {
      const value = args[++i];
      if (value !== "text" && value !== "json") {
        console.error(`Invalid --format for docs query: ${value}`);
        process.exit(1);
      }
      format = value;
      continue;
    }

    terms.push(arg);
  }

  const query = terms.join(" ").trim();
  if (!query) {
    console.error("Usage: weft docs query <terms...> [--limit N] [--format text|json]");
    process.exit(1);
  }

  return { query, limit, format };
}

function normalizeBoundaryValue(value: string): BoundaryKind {
  switch (value) {
    case "api":
    case "database":
    case "queue":
    case "filesystem":
    case "ui":
    case "external":
      return value;
    case "db":
      return "database";
    case "fs":
      return "filesystem";
    default:
      console.error(`Invalid boundary: ${value}`);
      console.error("Boundaries: api, database|db, queue, filesystem|fs, ui, external");
      process.exit(1);
  }
}

function normalizePriorityValue(value: string): PriorityLevel {
  switch (value) {
    case "p0":
    case "critical":
      return "p0";
    case "p1":
    case "high":
      return "p1";
    case "p2":
    case "medium":
      return "p2";
    case "p3":
    case "low":
      return "p3";
    default:
      console.error(`Invalid priority: ${value}`);
      console.error("Priority levels: p0, p1, p2, p3, critical, high, medium, low");
      process.exit(1);
  }
}

function normalizeTodoStatus(value: string): TodoStatus {
  switch (value) {
    case "open":
    case "in_progress":
    case "blocked":
    case "done":
      return value;
    default:
      console.error(`Invalid TODO status: ${value}`);
      console.error("TODO statuses: open, in_progress, blocked, done");
      process.exit(1);
  }
}

function findDocsRoot(startDir: string): string | null {
  let current = path.resolve(startDir);
  while (true) {
    const docsPath = path.join(current, "docs");
    if (existsSync(docsPath) && statSync(docsPath).isDirectory()) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function collectDocsFiles(root: string): string[] {
  const files: string[] = [];
  const docsDir = path.join(root, "docs");
  const stack = [docsDir];
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
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  }

  const visionPath = path.join(root, "VISION.md");
  if (existsSync(visionPath)) {
    files.push(visionPath);
  }

  files.sort((a, b) => a.localeCompare(b));
  return files;
}

function countOccurrences(text: string, term: string): number {
  if (!term) return 0;
  let count = 0;
  let index = 0;
  while (true) {
    index = text.indexOf(term, index);
    if (index === -1) break;
    count++;
    index += term.length;
  }
  return count;
}

function pickSnippets(text: string, terms: string[], max: number): string[] {
  const snippets: string[] = [];
  const lines = text.split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const lower = line.toLowerCase();
    if (terms.some((term) => lower.includes(term))) {
      snippets.push(line.length > 120 ? `${line.slice(0, 117)}...` : line);
      if (snippets.length >= max) break;
    }
  }
  return snippets;
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
  contract [path] [--format]    Emit implementation contract (text/json)
  bootstrap [path] [options]    Emit agent bootstrap payload (text/json)
  docs query <terms...>          Search local Weft docs

QUERIES:
  types                         List all types
  rules                         List all rules
  definitions                   List all definitions
  decisions                     List all decisions
  questions                     List all open questions
  role <role>                   List types with specific role
  lifecycle <scope>             List types with specific lifecycle
  schemas                       List schema types
  boundary <kind>               List types by boundary
  priority <level>              List types by priority
  todos [status]                List TODO annotations

EXAMPLES:
  weft check spec.weft
  weft check                    # scan all .weft files under current directory
  weft check ./domain           # scan all .weft files under ./domain
  weft stats spec.weft
  weft query rules              # all rules from current directory downward
  weft query ./domain rules     # all rules under ./domain
  weft query spec.weft types    # query one file
  weft query lifecycle singleton
  weft query boundary api
  weft query todos blocked
  weft deps spec.weft
  weft contract --format json
  weft bootstrap . --target typescript --format json
  weft docs query lifecycle singleton --limit 3
`);
}
