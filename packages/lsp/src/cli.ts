#!/usr/bin/env node

/**
 * Weft CLI - Command-line interface for analyzing Weft specifications.
 *
 * Commands:
 *   weft check <file>           - Validate a spec file and report errors
 *   weft stats <file>           - Show architecture statistics
 *   weft coverage <file>        - Show coverage report
 *   weft query <file> <query>   - Query the spec (types, rules, etc.)
 *   weft deps <file>            - Show dependency graph
 */

import { readFileSync, existsSync } from "fs";
import { parse } from "./parser.js";
import {
  analyze,
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
  case "query":
    runQuery(args[1], args[2], args.slice(3));
    break;
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

function runCheck(file: string): void {
  const { document, symbols, diagnostics } = loadAndAnalyze(file);

  if (diagnostics.length === 0) {
    console.log("✓ No errors found");
    process.exit(0);
  }

  console.log(`Found ${diagnostics.length} issue(s):\n`);

  for (const diag of diagnostics) {
    const severity = diag.severity === "error" ? "ERROR" : diag.severity === "warning" ? "WARN" : "INFO";
    const loc = `${diag.range.start.line}:${diag.range.start.column}`;
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

function runStats(file: string): void {
  const { document, symbols, diagnostics } = loadAndAnalyze(file);
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

function runCoverage(file: string): void {
  const { document, symbols, diagnostics } = loadAndAnalyze(file);
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

function runQuery(file: string, query: string, queryArgs: string[]): void {
  const { document, symbols, diagnostics } = loadAndAnalyze(file);

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
        console.error("Usage: weft query <file> role <role>");
        console.error("Roles: entity, usecase, repository, service, viewmodel, gateway, dto, adapter");
        process.exit(1);
      }
      listByRole(symbols, queryArgs[0] as RoleKind);
      break;
    case "lifecycle":
      if (!queryArgs[0]) {
        console.error("Usage: weft query <file> lifecycle <scope>");
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

function runDeps(file: string): void {
  const { document, symbols, diagnostics } = loadAndAnalyze(file);
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

function loadAndAnalyze(file: string): {
  document: Document;
  symbols: SymbolTable;
  diagnostics: ReturnType<typeof analyze>["diagnostics"];
} {
  if (!file) {
    console.error("Error: No file specified");
    printUsage();
    process.exit(1);
  }

  if (!existsSync(file)) {
    console.error(`Error: File not found: ${file}`);
    process.exit(1);
  }

  const source = readFileSync(file, "utf-8");
  const { document, errors } = parse(source);
  const { symbols, diagnostics } = analyze(document);

  // Add parse errors to diagnostics
  const allDiagnostics = [
    ...errors.map((e) => ({
      message: e.message,
      range: e.range,
      severity: "error" as const,
      code: "parse-error",
    })),
    ...diagnostics,
  ];

  return { document, symbols, diagnostics: allDiagnostics };
}

function printUsage(): void {
  console.log(`
Weft CLI - Analyze and query Weft specifications

USAGE:
  weft <command> [args]

COMMANDS:
  check <file>                  Validate a spec and report errors
  stats <file>                  Show architecture statistics
  coverage <file>               Show coverage gaps (undocumented types, etc.)
  query <file> <query> [args]   Query the specification
  deps <file>                   Show dependency graph

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
  weft stats spec.weft
  weft query spec.weft types
  weft query spec.weft role entity
  weft query spec.weft lifecycle singleton
  weft deps spec.weft
`);
}
