/**
 * Semantic analyzer for Weft specifications.
 * Builds symbol table and validates references.
 */

import type {
  Document,
  Declaration,
  TypeDeclaration,
  ServiceDeclaration,
  EnumDeclaration,
  ViewDeclaration,
  RuleDeclaration,
  DefinitionDeclaration,
  DecisionDeclaration,
  OpenQuestionDeclaration,
  TypeExpr,
  Member,
  Range,
} from "./ast.js";

// ============================================
// Symbol Table
// ============================================

export type SymbolKind = "type" | "service" | "enum" | "view" | "rule" | "definition" | "decision" | "question" | "field" | "method";

export interface Symbol {
  name: string;
  kind: SymbolKind;
  range: Range;
  docstring?: string;
  members?: Map<string, Symbol>;
}

export interface SymbolTable {
  types: Map<string, Symbol>;
  rules: Map<string, Symbol>;
  definitions: Map<string, Symbol>;
  decisions: Map<string, Symbol>;
  questions: Map<string, Symbol>;
}

// ============================================
// Diagnostics
// ============================================

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface Diagnostic {
  message: string;
  range: Range;
  severity: DiagnosticSeverity;
}

// ============================================
// Analysis Result
// ============================================

export interface AnalysisResult {
  symbols: SymbolTable;
  diagnostics: Diagnostic[];
}

// ============================================
// Analyzer
// ============================================

export function analyze(document: Document): AnalysisResult {
  const symbols: SymbolTable = {
    types: new Map(),
    rules: new Map(),
    definitions: new Map(),
    decisions: new Map(),
    questions: new Map(),
  };

  const diagnostics: Diagnostic[] = [];

  // First pass: collect all symbols
  for (const decl of document.declarations) {
    collectSymbol(decl, symbols, diagnostics);
  }

  // Second pass: validate references
  for (const decl of document.declarations) {
    validateReferences(decl, symbols, diagnostics);
  }

  return { symbols, diagnostics };
}

function collectSymbol(decl: Declaration, symbols: SymbolTable, diagnostics: Diagnostic[]): void {
  switch (decl.kind) {
    case "Rule":
      addSymbol(symbols.rules, decl.id, {
        name: decl.id,
        kind: "rule",
        range: decl.range,
        docstring: decl.prose,
      }, diagnostics);
      break;

    case "Definition":
      addSymbol(symbols.definitions, decl.id, {
        name: decl.id,
        kind: "definition",
        range: decl.range,
        docstring: decl.prose,
      }, diagnostics);
      break;

    case "Decision":
      addSymbol(symbols.decisions, decl.id, {
        name: decl.id,
        kind: "decision",
        range: decl.range,
        docstring: decl.prose,
      }, diagnostics);
      break;

    case "OpenQuestion":
      addSymbol(symbols.questions, decl.id, {
        name: decl.id,
        kind: "question",
        range: decl.range,
        docstring: decl.prose,
      }, diagnostics);
      break;

    case "TypeDeclaration":
      addSymbol(symbols.types, decl.name, {
        name: decl.name,
        kind: "type",
        range: decl.range,
        docstring: decl.docstring,
        members: collectMembers(decl.members),
      }, diagnostics);
      break;

    case "ServiceDeclaration":
      addSymbol(symbols.types, decl.name, {
        name: decl.name,
        kind: "service",
        range: decl.range,
        docstring: decl.docstring,
        members: collectMethods(decl.methods),
      }, diagnostics);
      break;

    case "EnumDeclaration":
      addSymbol(symbols.types, decl.name, {
        name: decl.name,
        kind: "enum",
        range: decl.range,
        docstring: decl.docstring,
        members: collectEnumCases(decl),
      }, diagnostics);
      break;

    case "ViewDeclaration":
      addSymbol(symbols.types, decl.name, {
        name: decl.name,
        kind: "view",
        range: decl.range,
        docstring: decl.docstring,
        members: collectMembers(decl.members),
      }, diagnostics);
      break;
  }
}

function addSymbol(map: Map<string, Symbol>, name: string, symbol: Symbol, diagnostics: Diagnostic[]): void {
  if (map.has(name)) {
    diagnostics.push({
      message: `Duplicate symbol: ${name}`,
      range: symbol.range,
      severity: "error",
    });
    return;
  }
  map.set(name, symbol);
}

function collectMembers(members: Member[]): Map<string, Symbol> {
  const result = new Map<string, Symbol>();
  for (const member of members) {
    result.set(member.name, {
      name: member.name,
      kind: member.kind === "Field" ? "field" : "method",
      range: member.range,
      docstring: member.docstring,
    });
  }
  return result;
}

function collectMethods(methods: Member[]): Map<string, Symbol> {
  const result = new Map<string, Symbol>();
  for (const method of methods) {
    result.set(method.name, {
      name: method.name,
      kind: "method",
      range: method.range,
      docstring: method.docstring,
    });
  }
  return result;
}

function collectEnumCases(decl: EnumDeclaration): Map<string, Symbol> {
  const result = new Map<string, Symbol>();
  for (const c of decl.cases) {
    result.set(c.name, {
      name: c.name,
      kind: "field",
      range: c.range,
      docstring: c.docstring,
    });
  }
  return result;
}

// ============================================
// Reference Validation
// ============================================

function validateReferences(decl: Declaration, symbols: SymbolTable, diagnostics: Diagnostic[]): void {
  switch (decl.kind) {
    case "TypeDeclaration":
      validateTypeDeclaration(decl, symbols, diagnostics);
      break;
    case "ServiceDeclaration":
      validateServiceDeclaration(decl, symbols, diagnostics);
      break;
    case "ViewDeclaration":
      validateViewDeclaration(decl, symbols, diagnostics);
      break;
    case "Rule":
    case "Definition":
    case "Decision":
    case "OpenQuestion":
      validateProseReferences(decl.prose, decl.range, symbols, diagnostics);
      break;
  }
}

function validateTypeDeclaration(decl: TypeDeclaration, symbols: SymbolTable, diagnostics: Diagnostic[]): void {
  // Validate @Implements annotations
  for (const ann of decl.annotations) {
    if (ann.kind === "Implements") {
      if (!symbols.rules.has(ann.ruleId)) {
        diagnostics.push({
          message: `Unknown rule: ${ann.ruleId}`,
          range: ann.range,
          severity: "error",
        });
      }
    }
  }

  // Validate docstring references
  if (decl.docstring) {
    validateProseReferences(decl.docstring, decl.range, symbols, diagnostics);
  }

  // Validate member types
  for (const member of decl.members) {
    if (member.kind === "Field") {
      validateType(member.type, symbols, diagnostics);
    } else {
      for (const param of member.parameters) {
        validateType(param.type, symbols, diagnostics);
      }
      if (member.returnType) {
        validateType(member.returnType, symbols, diagnostics);
      }
    }
    if (member.docstring) {
      validateProseReferences(member.docstring, member.range, symbols, diagnostics);
    }
  }
}

function validateServiceDeclaration(decl: ServiceDeclaration, symbols: SymbolTable, diagnostics: Diagnostic[]): void {
  // Validate @Implements annotations
  for (const ann of decl.annotations) {
    if (ann.kind === "Implements") {
      if (!symbols.rules.has(ann.ruleId)) {
        diagnostics.push({
          message: `Unknown rule: ${ann.ruleId}`,
          range: ann.range,
          severity: "error",
        });
      }
    }
  }

  // Validate docstring references
  if (decl.docstring) {
    validateProseReferences(decl.docstring, decl.range, symbols, diagnostics);
  }

  // Validate method types
  for (const method of decl.methods) {
    for (const param of method.parameters) {
      validateType(param.type, symbols, diagnostics);
    }
    if (method.returnType) {
      validateType(method.returnType, symbols, diagnostics);
    }
    if (method.docstring) {
      validateProseReferences(method.docstring, method.range, symbols, diagnostics);
    }
  }
}

function validateViewDeclaration(decl: ViewDeclaration, symbols: SymbolTable, diagnostics: Diagnostic[]): void {
  if (decl.docstring) {
    validateProseReferences(decl.docstring, decl.range, symbols, diagnostics);
  }

  for (const member of decl.members) {
    if (member.kind === "Field") {
      validateType(member.type, symbols, diagnostics);
    } else {
      for (const param of member.parameters) {
        validateType(param.type, symbols, diagnostics);
      }
      if (member.returnType) {
        validateType(member.returnType, symbols, diagnostics);
      }
    }
    if (member.docstring) {
      validateProseReferences(member.docstring, member.range, symbols, diagnostics);
    }
  }
}

function validateType(type: TypeExpr, symbols: SymbolTable, diagnostics: Diagnostic[]): void {
  switch (type.kind) {
    case "PrimitiveType":
      // Always valid
      break;
    case "NamedType":
      if (!symbols.types.has(type.name)) {
        diagnostics.push({
          message: `Unknown type: ${type.name}`,
          range: type.range,
          severity: "error",
        });
      }
      break;
    case "ArrayType":
      validateType(type.elementType, symbols, diagnostics);
      break;
    case "DictionaryType":
      validateType(type.keyType, symbols, diagnostics);
      validateType(type.valueType, symbols, diagnostics);
      break;
    case "OptionalType":
      validateType(type.innerType, symbols, diagnostics);
      break;
  }
}

// ============================================
// Prose Reference Extraction
// ============================================

const REFERENCE_PATTERNS = [
  { pattern: /@Rule\("([^"]+)"\)/g, kind: "rule" as const },
  { pattern: /@Definition\("([^"]+)"\)/g, kind: "definition" as const },
  { pattern: /@Decision\("([^"]+)"\)/g, kind: "decision" as const },
  { pattern: /@OpenQuestion\("([^"]+)"\)/g, kind: "question" as const },
  { pattern: /`([A-Z][a-zA-Z0-9]*)`/g, kind: "type" as const },
];

function validateProseReferences(prose: string, range: Range, symbols: SymbolTable, diagnostics: Diagnostic[]): void {
  for (const { pattern, kind } of REFERENCE_PATTERNS) {
    // Reset regex state
    pattern.lastIndex = 0;

    let match;
    while ((match = pattern.exec(prose)) !== null) {
      const ref = match[1];
      let found = false;

      switch (kind) {
        case "rule":
          found = symbols.rules.has(ref);
          break;
        case "definition":
          found = symbols.definitions.has(ref);
          break;
        case "decision":
          found = symbols.decisions.has(ref);
          break;
        case "question":
          found = symbols.questions.has(ref);
          break;
        case "type":
          found = symbols.types.has(ref);
          break;
      }

      if (!found) {
        diagnostics.push({
          message: `Unknown ${kind}: ${ref}`,
          range, // TODO: calculate precise position within prose
          severity: "warning",
        });
      }
    }
  }
}

// ============================================
// Coverage Analysis
// ============================================

export interface CoverageReport {
  undocumentedTypes: string[];
  unimplementedRules: string[];
  unreferencedDefinitions: string[];
  openQuestions: string[];
}

export function coverage(symbols: SymbolTable, document: Document): CoverageReport {
  const report: CoverageReport = {
    undocumentedTypes: [],
    unimplementedRules: [],
    unreferencedDefinitions: [],
    openQuestions: [],
  };

  // Find types without docstrings
  for (const [name, sym] of symbols.types) {
    if (!sym.docstring) {
      report.undocumentedTypes.push(name);
    }
  }

  // Find rules that aren't implemented
  const implementedRules = new Set<string>();
  for (const decl of document.declarations) {
    if (decl.kind === "TypeDeclaration" || decl.kind === "ServiceDeclaration") {
      for (const ann of decl.annotations) {
        if (ann.kind === "Implements") {
          implementedRules.add(ann.ruleId);
        }
      }
    }
  }
  for (const name of symbols.rules.keys()) {
    if (!implementedRules.has(name)) {
      report.unimplementedRules.push(name);
    }
  }

  // Find definitions never referenced (simplified check)
  // In a full implementation, we'd scan all prose for references
  // For now, just report all definitions as potentially unreferenced

  // List all open questions
  for (const name of symbols.questions.keys()) {
    report.openQuestions.push(name);
  }

  return report;
}
