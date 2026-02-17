#!/usr/bin/env node

/**
 * Weft MCP Server
 *
 * Exposes Weft specification analysis as MCP tools for AI assistants.
 *
 * Tools:
 *   - weft_check: Validate a spec file
 *   - weft_stats: Get architecture statistics
 *   - weft_coverage: Get coverage report
 *   - weft_query: Query types, rules, etc.
 *   - weft_deps: Get dependency graph
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, existsSync } from "fs";
import { parse } from "@rocketbro/weft/dist/parser.js";
import {
  analyze,
  coverage,
  getTypesByRole,
  getTypesByLifecycle,
  getDependencyGraph,
  getSchemaTypes,
} from "@rocketbro/weft/dist/analyzer.js";
import type { RoleKind, LifecycleKind } from "@rocketbro/weft/dist/ast.js";

// ============================================
// Server Setup
// ============================================

const server = new McpServer({
  name: "weft",
  version: "0.1.0",
});

// ============================================
// Helper Functions
// ============================================

function loadSpec(filePath: string) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const source = readFileSync(filePath, "utf-8");
  const { document, errors } = parse(source);
  const { symbols, diagnostics } = analyze(document);

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

// ============================================
// Tools
// ============================================

server.tool(
  "weft_check",
  "Validate a Weft specification file and report any errors or warnings",
  {
    file: z.string().describe("Path to the .weft file to validate"),
  },
  async ({ file }) => {
    try {
      const { diagnostics } = loadSpec(file);

      if (diagnostics.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "✓ No errors found. The specification is valid.",
            },
          ],
        };
      }

      const errors = diagnostics.filter((d) => d.severity === "error");
      const warnings = diagnostics.filter((d) => d.severity === "warning");

      let result = `Found ${diagnostics.length} issue(s):\n\n`;

      if (errors.length > 0) {
        result += `Errors (${errors.length}):\n`;
        for (const e of errors) {
          result += `  - [${e.range.start.line}:${e.range.start.column}] ${e.message}\n`;
        }
        result += "\n";
      }

      if (warnings.length > 0) {
        result += `Warnings (${warnings.length}):\n`;
        for (const w of warnings) {
          result += `  - [${w.range.start.line}:${w.range.start.column}] ${w.message}\n`;
        }
      }

      return {
        content: [{ type: "text", text: result }],
        isError: errors.length > 0,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "weft_stats",
  "Get architecture statistics for a Weft specification",
  {
    file: z.string().describe("Path to the .weft file to analyze"),
  },
  async ({ file }) => {
    try {
      const { document, symbols, diagnostics } = loadSpec(file);
      const report = coverage(symbols, document);

      const errors = diagnostics.filter((d) => d.severity === "error").length;
      const warnings = diagnostics.filter((d) => d.severity === "warning").length;

      const result = {
        types: {
          total: symbols.types.size,
          breakdown: report.architectureStats,
        },
        specElements: {
          rules: symbols.rules.size,
          definitions: symbols.definitions.size,
          decisions: symbols.decisions.size,
          openQuestions: symbols.questions.size,
        },
        diagnostics: { errors, warnings },
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "weft_coverage",
  "Get coverage report showing gaps in the specification (undocumented types, unimplemented rules, open questions)",
  {
    file: z.string().describe("Path to the .weft file to analyze"),
  },
  async ({ file }) => {
    try {
      const { document, symbols } = loadSpec(file);
      const report = coverage(symbols, document);

      let result = "Coverage Report:\n\n";

      if (report.openQuestions.length > 0) {
        result += `Open Questions (${report.openQuestions.length}):\n`;
        for (const q of report.openQuestions) {
          const sym = symbols.questions.get(q);
          const desc = sym?.docstring?.split("\n")[0]?.substring(0, 60) || "";
          result += `  - ${q}: ${desc}...\n`;
        }
        result += "\n";
      }

      if (report.unimplementedRules.length > 0) {
        result += `Unimplemented Rules (${report.unimplementedRules.length}):\n`;
        for (const r of report.unimplementedRules) {
          result += `  - ${r}\n`;
        }
        result += "\n";
      }

      if (report.unreferencedDefinitions.length > 0) {
        result += `Unreferenced Definitions (${report.unreferencedDefinitions.length}):\n`;
        for (const d of report.unreferencedDefinitions) {
          result += `  - ${d}\n`;
        }
        result += "\n";
      }

      if (report.typesWithoutRole.length > 0) {
        result += `Types Without @Role (${report.typesWithoutRole.length}):\n`;
        for (const t of report.typesWithoutRole) {
          result += `  - ${t}\n`;
        }
        result += "\n";
      }

      if (report.undocumentedTypes.length > 0) {
        result += `Undocumented Types (${report.undocumentedTypes.length}):\n`;
        for (const t of report.undocumentedTypes) {
          result += `  - ${t}\n`;
        }
        result += "\n";
      }

      const total =
        report.openQuestions.length +
        report.unimplementedRules.length +
        report.unreferencedDefinitions.length +
        report.undocumentedTypes.length +
        report.typesWithoutRole.length;

      if (total === 0) {
        result = "✓ Full coverage - no gaps found in the specification.";
      }

      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "weft_query",
  "Query the specification for specific information (types, rules, definitions, etc.)",
  {
    file: z.string().describe("Path to the .weft file to query"),
    query: z
      .enum(["types", "rules", "definitions", "decisions", "questions", "role", "lifecycle", "schemas"])
      .describe("What to query"),
    filter: z.string().optional().describe("For role/lifecycle queries, the specific role or lifecycle to filter by"),
  },
  async ({ file, query, filter }) => {
    try {
      const { symbols } = loadSpec(file);
      let result = "";

      switch (query) {
        case "types": {
          result = "Types:\n";
          for (const [name, sym] of symbols.types) {
            const role = sym.role ? ` @Role(${sym.role})` : "";
            const lifecycle = sym.lifecycle ? ` @Lifecycle(${sym.lifecycle})` : "";
            result += `  - ${name}${role}${lifecycle}\n`;
          }
          break;
        }
        case "rules": {
          result = "Rules:\n";
          for (const [name, sym] of symbols.rules) {
            const desc = sym.docstring?.split("\n")[0]?.substring(0, 60) || "";
            result += `  - ${name}: ${desc}\n`;
          }
          break;
        }
        case "definitions": {
          result = "Definitions:\n";
          for (const [name, sym] of symbols.definitions) {
            const desc = sym.docstring?.split("\n")[0]?.substring(0, 60) || "";
            result += `  - ${name}: ${desc}\n`;
          }
          break;
        }
        case "decisions": {
          result = "Decisions:\n";
          for (const [name, sym] of symbols.decisions) {
            const desc = sym.docstring?.split("\n")[0]?.substring(0, 60) || "";
            result += `  - ${name}: ${desc}\n`;
          }
          break;
        }
        case "questions": {
          result = "Open Questions:\n";
          for (const [name, sym] of symbols.questions) {
            const desc = sym.docstring?.split("\n")[0]?.substring(0, 60) || "";
            result += `  - ${name}: ${desc}\n`;
          }
          break;
        }
        case "role": {
          if (!filter) {
            result = "Error: role query requires a filter (entity, usecase, repository, service, viewmodel, gateway, dto, adapter)";
          } else {
            const types = getTypesByRole(symbols, filter as RoleKind);
            result = `Types with @Role(${filter}):\n`;
            for (const sym of types) {
              result += `  - ${sym.name}\n`;
            }
            if (types.length === 0) {
              result += "  (none)\n";
            }
          }
          break;
        }
        case "lifecycle": {
          if (!filter) {
            result = "Error: lifecycle query requires a filter (singleton, session, feature, view)";
          } else {
            const types = getTypesByLifecycle(symbols, filter as LifecycleKind);
            result = `Types with @Lifecycle(${filter}):\n`;
            for (const sym of types) {
              result += `  - ${sym.name}\n`;
            }
            if (types.length === 0) {
              result += "  (none)\n";
            }
          }
          break;
        }
        case "schemas": {
          const schemas = getSchemaTypes(symbols);
          result = "Schema Types:\n";
          for (const sym of schemas) {
            result += `  - ${sym.name}\n`;
          }
          if (schemas.length === 0) {
            result += "  (none)\n";
          }
          break;
        }
      }

      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "weft_deps",
  "Get the dependency graph showing which types depend on which other types",
  {
    file: z.string().describe("Path to the .weft file to analyze"),
  },
  async ({ file }) => {
    try {
      const { symbols } = loadSpec(file);
      const graph = getDependencyGraph(symbols);

      let result = "Dependency Graph:\n\n";

      for (const [name, deps] of graph) {
        const sym = symbols.types.get(name);
        const role = sym?.role ? ` @Role(${sym.role})` : "";

        if (deps.length === 0) {
          result += `${name}${role}: (no dependencies)\n`;
        } else {
          result += `${name}${role}:\n`;
          for (const dep of deps) {
            const depSym = symbols.types.get(dep);
            const depRole = depSym?.role ? ` @Role(${depSym.role})` : "";
            result += `  -> ${dep}${depRole}\n`;
          }
        }
      }

      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  }
);

// ============================================
// Start Server
// ============================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weft MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
