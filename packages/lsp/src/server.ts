#!/usr/bin/env node

/**
 * Weft Language Server
 * Provides real-time validation for Weft specification files.
 */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  InitializeResult,
  TextDocumentSyncKind,
  Diagnostic as LspDiagnostic,
  DiagnosticSeverity,
  Hover,
  MarkupKind,
  CompletionItem,
  CompletionItemKind,
  Definition,
  Location,
} from "vscode-languageserver/node.js";

import { TextDocument } from "vscode-languageserver-textdocument";

import { parse } from "./parser.js";
import { analyze, type SymbolTable, type Diagnostic, type Symbol } from "./analyzer.js";
import type { Document } from "./ast.js";

// ============================================
// Server Setup
// ============================================

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

// Cache parsed documents and symbols
const documentCache = new Map<string, { document: Document; symbols: SymbolTable }>();

connection.onInitialize((_params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      hoverProvider: true,
      completionProvider: {
        triggerCharacters: ["@", '"', "`"],
      },
      definitionProvider: true,
    },
  };
});

// ============================================
// Document Validation
// ============================================

documents.onDidChangeContent((change) => {
  validateDocument(change.document);
});

function validateDocument(textDocument: TextDocument): void {
  const text = textDocument.getText();
  const uri = textDocument.uri;

  // Parse
  const { document, errors: parseErrors } = parse(text);

  // Analyze
  const { symbols, diagnostics: analyzerDiagnostics } = analyze(document);

  // Cache for other features
  documentCache.set(uri, { document, symbols });

  // Convert to LSP diagnostics
  const diagnostics: LspDiagnostic[] = [];

  for (const error of parseErrors) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line: error.range.start.line - 1, character: error.range.start.column - 1 },
        end: { line: error.range.end.line - 1, character: error.range.end.column - 1 },
      },
      message: error.message,
      source: "weft",
    });
  }

  for (const diag of analyzerDiagnostics) {
    diagnostics.push({
      severity: mapSeverity(diag.severity),
      range: {
        start: { line: diag.range.start.line - 1, character: diag.range.start.column - 1 },
        end: { line: diag.range.end.line - 1, character: diag.range.end.column - 1 },
      },
      message: diag.message,
      source: "weft",
    });
  }

  connection.sendDiagnostics({ uri, diagnostics });
}

function mapSeverity(severity: Diagnostic["severity"]): DiagnosticSeverity {
  switch (severity) {
    case "error": return DiagnosticSeverity.Error;
    case "warning": return DiagnosticSeverity.Warning;
    case "info": return DiagnosticSeverity.Information;
  }
}

// ============================================
// Hover
// ============================================

connection.onHover((params): Hover | null => {
  const cached = documentCache.get(params.textDocument.uri);
  if (!cached) return null;

  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  const position = params.position;
  const offset = document.offsetAt(position);
  const text = document.getText();

  // Find word at position
  const word = getWordAtOffset(text, offset);
  if (!word) return null;

  // Look up in symbol table
  const symbol = findSymbol(word, cached.symbols);
  if (!symbol) return null;

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: formatSymbolHover(symbol),
    },
  };
});

function getWordAtOffset(text: string, offset: number): string | null {
  // Find word boundaries
  let start = offset;
  let end = offset;

  while (start > 0 && /[a-zA-Z0-9_-]/.test(text[start - 1])) {
    start--;
  }

  while (end < text.length && /[a-zA-Z0-9_-]/.test(text[end])) {
    end++;
  }

  if (start === end) return null;
  return text.slice(start, end);
}

function findSymbol(name: string, symbols: SymbolTable): Symbol | null {
  return (
    symbols.types.get(name) ??
    symbols.rules.get(name) ??
    symbols.definitions.get(name) ??
    symbols.decisions.get(name) ??
    symbols.questions.get(name) ??
    null
  );
}

function formatSymbolHover(symbol: Symbol): string {
  const lines: string[] = [];

  // Symbol kind and name
  lines.push(`**${symbol.kind}** \`${symbol.name}\``);

  // Docstring
  if (symbol.docstring) {
    lines.push("");
    lines.push(symbol.docstring.trim());
  }

  // Members
  if (symbol.members && symbol.members.size > 0) {
    lines.push("");
    lines.push("**Members:**");
    for (const [memberName, member] of symbol.members) {
      lines.push(`- \`${memberName}\` (${member.kind})`);
    }
  }

  return lines.join("\n");
}

// ============================================
// Completion
// ============================================

connection.onCompletion((params): CompletionItem[] => {
  const cached = documentCache.get(params.textDocument.uri);
  if (!cached) return [];

  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  const text = document.getText();
  const offset = document.offsetAt(params.position);

  // Check context for completion type
  const lineStart = text.lastIndexOf("\n", offset - 1) + 1;
  const lineText = text.slice(lineStart, offset);

  const items: CompletionItem[] = [];

  // After @, suggest annotations
  if (lineText.endsWith("@")) {
    items.push(
      { label: "Rule", kind: CompletionItemKind.Keyword, insertText: 'Rule("$1", \'\'\'\n$2\n\'\'\')' },
      { label: "Definition", kind: CompletionItemKind.Keyword, insertText: 'Definition("$1", \'\'\'\n$2\n\'\'\')' },
      { label: "Decision", kind: CompletionItemKind.Keyword, insertText: 'Decision("$1", \'\'\'\n$2\n\'\'\')' },
      { label: "OpenQuestion", kind: CompletionItemKind.Keyword, insertText: 'OpenQuestion("$1", \'\'\'\n$2\n\'\'\')' },
      { label: "Implements", kind: CompletionItemKind.Keyword, insertText: 'Implements("$1")' },
      { label: "See", kind: CompletionItemKind.Keyword, insertText: 'See("$1")' },
    );
  }

  // After @Implements(" or @See(", suggest existing rules/symbols
  if (/@Implements\("$/.test(lineText)) {
    for (const [name] of cached.symbols.rules) {
      items.push({ label: name, kind: CompletionItemKind.Reference });
    }
  }

  // In type position, suggest types
  if (/:\s*$/.test(lineText)) {
    // Primitives
    for (const prim of ["string", "int", "float", "double", "bool", "date", "datetime", "url", "void"]) {
      items.push({ label: prim, kind: CompletionItemKind.TypeParameter });
    }
    // User types
    for (const [name] of cached.symbols.types) {
      items.push({ label: name, kind: CompletionItemKind.Class });
    }
  }

  return items;
});

// ============================================
// Go to Definition
// ============================================

connection.onDefinition((params): Definition | null => {
  const cached = documentCache.get(params.textDocument.uri);
  if (!cached) return null;

  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  const offset = document.offsetAt(params.position);
  const text = document.getText();

  const word = getWordAtOffset(text, offset);
  if (!word) return null;

  const symbol = findSymbol(word, cached.symbols);
  if (!symbol) return null;

  return Location.create(params.textDocument.uri, {
    start: { line: symbol.range.start.line - 1, character: symbol.range.start.column - 1 },
    end: { line: symbol.range.end.line - 1, character: symbol.range.end.column - 1 },
  });
});

// ============================================
// Start Server
// ============================================

documents.listen(connection);
connection.listen();

console.error("Weft Language Server started");
