/**
 * Lexer for Weft specifications.
 * Converts source text into a stream of tokens.
 */

import type { Position, Range } from "./ast.js";

export type TokenKind =
  // Keywords
  | "type"
  | "struct"
  | "data"
  | "protocol"
  | "interface"
  | "service"
  | "view"
  | "enum"
  | "func"
  | "fn"
  | "function"
  | "var"
  | "let"
  | "const"
  | "async"
  | "throws"
  | "true"
  | "false"
  | "null"
  // Annotations
  | "@Rule"
  | "@Definition"
  | "@Decision"
  | "@OpenQuestion"
  | "@Implements"
  | "@See"
  | "@Constraint"
  | "@Example"
  | "@Assumption"
  // Punctuation
  | ":"
  | "?"
  | "->"
  | "["
  | "]"
  | "{"
  | "}"
  | "("
  | ")"
  | ","
  | "="
  // Literals
  | "string"
  | "docstring"
  | "number"
  | "identifier"
  // Special
  | "comment"
  | "eof"
  | "error";

export interface Token {
  kind: TokenKind;
  value: string;
  range: Range;
}

const KEYWORDS = new Set([
  "type",
  "struct",
  "data",
  "protocol",
  "interface",
  "service",
  "view",
  "enum",
  "func",
  "fn",
  "function",
  "var",
  "let",
  "const",
  "async",
  "throws",
  "true",
  "false",
  "null",
]);

const ANNOTATIONS = new Set([
  "@Rule",
  "@Definition",
  "@Decision",
  "@OpenQuestion",
  "@Implements",
  "@See",
  "@Constraint",
  "@Example",
  "@Assumption",
]);

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (!this.isAtEnd()) {
      this.skipWhitespaceAndComments();
      if (this.isAtEnd()) break;

      const token = this.nextToken();
      if (token.kind !== "comment") {
        tokens.push(token);
      }
    }

    tokens.push(this.makeToken("eof", ""));
    return tokens;
  }

  private nextToken(): Token {
    const start = this.position();
    const char = this.peek();

    // Docstrings (triple quotes)
    if (this.match('"""') || this.match("'''")) {
      return this.docstring(this.source.slice(this.pos - 3, this.pos));
    }

    // Strings
    if (char === '"' || char === "'") {
      return this.string(char);
    }

    // Numbers
    if (this.isDigit(char)) {
      return this.number();
    }

    // Annotations
    if (char === "@") {
      return this.annotation();
    }

    // Identifiers and keywords
    if (this.isAlpha(char)) {
      return this.identifier();
    }

    // Arrow
    if (this.match("->")) {
      return this.makeTokenFrom(start, "->", "->");
    }

    // Single-char punctuation
    const punctuation: Record<string, TokenKind> = {
      ":": ":",
      "?": "?",
      "[": "[",
      "]": "]",
      "{": "{",
      "}": "}",
      "(": "(",
      ")": ")",
      ",": ",",
      "=": "=",
    };

    if (punctuation[char]) {
      this.advance();
      return this.makeTokenFrom(start, punctuation[char], char);
    }

    // Unknown character
    this.advance();
    return this.makeTokenFrom(start, "error", char);
  }

  private docstring(delimiter: string): Token {
    const start = this.position();
    start.column -= 3;
    start.offset -= 3;

    let value = "";

    while (!this.isAtEnd()) {
      if (this.match(delimiter)) {
        return this.makeTokenFrom(start, "docstring", value);
      }
      value += this.advance();
    }

    return this.makeTokenFrom(start, "error", value);
  }

  private string(quote: string): Token {
    const start = this.position();
    this.advance(); // opening quote
    let value = "";

    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === "\\" && this.peekNext() === quote) {
        this.advance();
        value += this.advance();
      } else if (this.peek() === "\n") {
        break; // unterminated
      } else {
        value += this.advance();
      }
    }

    if (this.peek() === quote) {
      this.advance(); // closing quote
      return this.makeTokenFrom(start, "string", value);
    }

    return this.makeTokenFrom(start, "error", value);
  }

  private number(): Token {
    const start = this.position();
    let value = "";

    while (this.isDigit(this.peek())) {
      value += this.advance();
    }

    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      value += this.advance(); // decimal point
      while (this.isDigit(this.peek())) {
        value += this.advance();
      }
    }

    return this.makeTokenFrom(start, "number", value);
  }

  private annotation(): Token {
    const start = this.position();
    let value = "@";
    this.advance(); // @

    while (this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }

    if (ANNOTATIONS.has(value)) {
      return this.makeTokenFrom(start, value as TokenKind, value);
    }

    return this.makeTokenFrom(start, "error", value);
  }

  private identifier(): Token {
    const start = this.position();
    let value = "";

    while (this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }

    if (KEYWORDS.has(value)) {
      return this.makeTokenFrom(start, value as TokenKind, value);
    }

    return this.makeTokenFrom(start, "identifier", value);
  }

  private skipWhitespaceAndComments(): void {
    while (!this.isAtEnd()) {
      const char = this.peek();

      if (char === " " || char === "\t" || char === "\r") {
        this.advance();
      } else if (char === "\n") {
        this.advance();
      } else if (this.match("//")) {
        while (!this.isAtEnd() && this.peek() !== "\n") {
          this.advance();
        }
      } else if (this.match("/*")) {
        while (!this.isAtEnd() && !this.match("*/")) {
          this.advance();
        }
      } else {
        break;
      }
    }
  }

  private match(expected: string): boolean {
    if (this.source.slice(this.pos, this.pos + expected.length) === expected) {
      for (let i = 0; i < expected.length; i++) {
        this.advance();
      }
      return true;
    }
    return false;
  }

  private peek(): string {
    return this.source[this.pos] ?? "\0";
  }

  private peekNext(): string {
    return this.source[this.pos + 1] ?? "\0";
  }

  private advance(): string {
    const char = this.source[this.pos];
    this.pos++;

    if (char === "\n") {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }

    return char;
  }

  private isAtEnd(): boolean {
    return this.pos >= this.source.length;
  }

  private isDigit(char: string): boolean {
    return char >= "0" && char <= "9";
  }

  private isAlpha(char: string): boolean {
    return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z") || char === "_";
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private position(): Position {
    return { line: this.line, column: this.column, offset: this.pos };
  }

  private makeToken(kind: TokenKind, value: string): Token {
    const pos = this.position();
    return {
      kind,
      value,
      range: { start: pos, end: pos },
    };
  }

  private makeTokenFrom(start: Position, kind: TokenKind, value: string): Token {
    return {
      kind,
      value,
      range: { start, end: this.position() },
    };
  }
}

export function lex(source: string): Token[] {
  return new Lexer(source).tokenize();
}
