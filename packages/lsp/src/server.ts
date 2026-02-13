#!/usr/bin/env node

/**
 * Weft Language Server
 * Provides real-time validation for Weft specification files.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { fileURLToPath, pathToFileURL } from "url";
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
import { analyzeWorkspace, type SymbolTable, type Diagnostic, type Symbol, type AnalysisDocument } from "./analyzer.js";

// ============================================
// Logging
// ============================================

const LOG_FILE = path.join(os.tmpdir(), "weft-lsp.log");

function log(message: string): void {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
  // Also write to stderr for immediate feedback
  console.error(`[weft-lsp] ${message}`);
}

log(`Server starting. Log file: ${LOG_FILE}`);
log(`Process args: ${process.argv.join(" ")}`);
log(`Working directory: ${process.cwd()}`);

// ============================================
// Server Setup
// ============================================

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

let rootPath: string | undefined;
let workspaceSymbols: SymbolTable | undefined;
const publishedUris = new Set<string>();

connection.onInitialize((params: InitializeParams): InitializeResult => {
  log(`onInitialize called`);
  log(`  Client: ${params.clientInfo?.name ?? "unknown"} ${params.clientInfo?.version ?? ""}`);
  log(`  Root URI: ${params.rootUri ?? "none"}`);
  log(`  Capabilities: ${JSON.stringify(Object.keys(params.capabilities))}`);

  if (params.rootUri?.startsWith("file://")) {
    rootPath = fileURLToPath(params.rootUri);
  }

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      hoverProvider: true,
      completionProvider: {
        triggerCharacters: ["@", '"', "`", "("],
      },
      definitionProvider: true,
    },
  };

  log(`  Responding with capabilities: ${JSON.stringify(Object.keys(result.capabilities))}`);
  return result;
});

// ============================================
// Document Validation
// ============================================

documents.onDidChangeContent((change) => {
  log(`onDidChangeContent: ${change.document.uri}`);
  validateWorkspace(change.document.uri);
});

documents.onDidOpen((event) => {
  log(`onDidOpen: ${event.document.uri}`);
  validateWorkspace(event.document.uri);
});

documents.onDidClose((event) => {
  log(`onDidClose: ${event.document.uri}`);
  validateWorkspace(event.document.uri);
});

function validateWorkspace(triggerUri?: string): void {
  const sources = collectWorkspaceSources(triggerUri);
  log(`validateWorkspace: ${sources.length} source(s)`);

  const analysisDocs: AnalysisDocument[] = [];
  const parseErrorsByUri = new Map<string, ReturnType<typeof parse>["errors"]>();

  for (const { uri, text } of sources) {
    const { document, errors } = parse(text);
    analysisDocs.push({ uri, document });
    parseErrorsByUri.set(uri, errors);
  }

  const { symbols, diagnostics: analyzerDiagnostics } = analyzeWorkspace(analysisDocs);
  workspaceSymbols = symbols;
  const diagnosticsByUri = new Map<string, LspDiagnostic[]>();

  for (const [uri, errors] of parseErrorsByUri) {
    const bucket = diagnosticsByUri.get(uri) ?? [];
    for (const error of errors) {
      bucket.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: error.range.start.line - 1, character: error.range.start.column - 1 },
          end: { line: error.range.end.line - 1, character: error.range.end.column - 1 },
        },
        message: error.message,
        source: "weft",
      });
    }
    diagnosticsByUri.set(uri, bucket);
  }

  for (const diag of analyzerDiagnostics) {
    if (!diag.uri) {
      continue;
    }
    const bucket = diagnosticsByUri.get(diag.uri) ?? [];
    bucket.push({
      severity: mapSeverity(diag.severity),
      range: {
        start: { line: diag.range.start.line - 1, character: diag.range.start.column - 1 },
        end: { line: diag.range.end.line - 1, character: diag.range.end.column - 1 },
      },
      message: diag.message,
      source: "weft",
      code: diag.code,
    });
    diagnosticsByUri.set(diag.uri, bucket);
  }

  const currentUris = new Set<string>();
  for (const { uri } of sources) {
    currentUris.add(uri);
    connection.sendDiagnostics({ uri, diagnostics: diagnosticsByUri.get(uri) ?? [] });
    publishedUris.add(uri);
  }

  const staleUris: string[] = [];
  for (const uri of publishedUris) {
    if (!currentUris.has(uri)) {
      connection.sendDiagnostics({ uri, diagnostics: [] });
      staleUris.push(uri);
    }
  }
  for (const uri of staleUris) {
    publishedUris.delete(uri);
  }
}

function collectWorkspaceSources(triggerUri?: string): Array<{ uri: string; text: string }> {
  const byUri = new Map<string, string>();
  let hasOpenWorkspaceDoc = false;

  // Open buffers are source-of-truth for unsaved edits.
  for (const doc of documents.all()) {
    if (isIgnoredWeftUri(doc.uri)) {
      continue;
    }
    if (doc.languageId === "weft" || doc.uri.endsWith(".weft")) {
      byUri.set(doc.uri, doc.getText());
      if (isUriInRoot(doc.uri)) {
        hasOpenWorkspaceDoc = true;
      }
    }
  }

  // Include on-disk .weft files for cross-file resolution.
  const shouldScanWorkspaceFiles =
    rootPath &&
    (triggerUri === undefined ? hasOpenWorkspaceDoc : isUriInRoot(triggerUri)) &&
    hasOpenWorkspaceDoc;

  if (shouldScanWorkspaceFiles && rootPath) {
    for (const filePath of listWeftFiles(rootPath)) {
      const uri = pathToFileURL(filePath).toString();
      if (byUri.has(uri)) continue;
      try {
        byUri.set(uri, fs.readFileSync(filePath, "utf8"));
      } catch (error) {
        log(`Failed to read ${filePath}: ${String(error)}`);
      }
    }
  }

  return [...byUri.entries()].map(([uri, text]) => ({ uri, text }));
}

function listWeftFiles(dirPath: string): string[] {
  const result: string[] = [];
  const ignoredDirs = new Set([".git", "node_modules", "dist", "target", ".zed"]);

  const stack = [dirPath];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirs.has(entry.name) && !isIgnoredWeftPath(fullPath)) {
          stack.push(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith(".weft") && !isIgnoredWeftPath(fullPath)) {
        result.push(fullPath);
      }
    }
  }

  return result;
}

function isIgnoredWeftUri(uri: string): boolean {
  if (!uri.startsWith("file://")) {
    return false;
  }
  try {
    return isIgnoredWeftPath(fileURLToPath(uri));
  } catch {
    return false;
  }
}

function isIgnoredWeftPath(filePath: string): boolean {
  const normalized = filePath.split(path.sep).join("/");
  return normalized.includes("/packages/zed/grammars/");
}

function isUriInRoot(uri: string): boolean {
  if (!rootPath || !uri.startsWith("file://")) {
    return false;
  }

  try {
    const filePath = fileURLToPath(uri);
    const relative = path.relative(rootPath, filePath);
    return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
  } catch {
    return false;
  }
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
  if (!workspaceSymbols) return null;

  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  const position = params.position;
  const offset = document.offsetAt(position);
  const text = document.getText();

  // Find word at position
  const word = getWordAtOffset(text, offset);
  if (!word) return null;

  // Look up in symbol table
  const symbol = findSymbol(word, workspaceSymbols);
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
  if (!workspaceSymbols) return [];

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
      { label: "Role", kind: CompletionItemKind.Keyword, insertText: "Role(entity)" },
      { label: "Lifecycle", kind: CompletionItemKind.Keyword, insertText: "Lifecycle(singleton)" },
      { label: "Schema", kind: CompletionItemKind.Keyword, insertText: "Schema" },
      { label: "Implements", kind: CompletionItemKind.Keyword, insertText: 'Implements("$1")' },
      { label: "See", kind: CompletionItemKind.Keyword, insertText: 'See("$1")' },
    );
  }

  // Inside @Role(...), suggest valid role values.
  if (/@Role\([^)]*$/.test(lineText)) {
    for (const role of ["entity", "usecase", "repository", "service", "viewmodel", "gateway", "dto", "adapter"]) {
      items.push({ label: role, kind: CompletionItemKind.EnumMember });
    }
  }

  // Inside @Lifecycle(...), suggest valid lifecycle values.
  if (/@Lifecycle\([^)]*$/.test(lineText)) {
    for (const scope of ["singleton", "session", "feature", "view"]) {
      items.push({ label: scope, kind: CompletionItemKind.EnumMember });
    }
  }

  // After @Implements(" or @See(", suggest existing rules/symbols
  if (/@Implements\("$/.test(lineText)) {
    for (const [name] of workspaceSymbols.rules) {
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
    for (const [name] of workspaceSymbols.types) {
      items.push({ label: name, kind: CompletionItemKind.Class });
    }
  }

  return items;
});

// ============================================
// Go to Definition
// ============================================

connection.onDefinition((params): Definition | null => {
  if (!workspaceSymbols) return null;

  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  const offset = document.offsetAt(params.position);
  const text = document.getText();

  const word = getWordAtOffset(text, offset);
  if (!word) return null;

  const symbol = findSymbol(word, workspaceSymbols);
  if (!symbol) return null;

  const targetUri = symbol.uri ?? params.textDocument.uri;

  return Location.create(targetUri, {
    start: { line: symbol.range.start.line - 1, character: symbol.range.start.column - 1 },
    end: { line: symbol.range.end.line - 1, character: symbol.range.end.column - 1 },
  });
});

// ============================================
// Start Server
// ============================================

log("Setting up connection listeners...");
documents.listen(connection);
connection.listen();

log("Weft Language Server is now listening");
console.error(`Weft Language Server started. Log file: ${LOG_FILE}`);
