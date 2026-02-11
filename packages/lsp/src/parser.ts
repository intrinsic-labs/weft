/**
 * Recursive descent parser for Weft specifications.
 * Converts tokens into an AST.
 */

import type { Token, TokenKind } from "./lexer.js";
import { lex } from "./lexer.js";
import type {
  Declaration,
  Document,
  TypeDeclaration,
  ServiceDeclaration,
  EnumDeclaration,
  ViewDeclaration,
  RuleDeclaration,
  DefinitionDeclaration,
  DecisionDeclaration,
  OpenQuestionDeclaration,
  TypeAnnotation,
  FieldAnnotation,
  Member,
  Field,
  Method,
  Parameter,
  EnumCase,
  TypeExpr,
  Literal,
  Range,
  TypeKeyword,
  RoleKind,
  LifecycleKind,
} from "./ast.js";
import { isPrimitive } from "./ast.js";

export interface ParseError {
  message: string;
  range: Range;
}

export interface ParseResult {
  document: Document;
  errors: ParseError[];
}

class Parser {
  private tokens: Token[];
  private pos: number = 0;
  private errors: ParseError[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ParseResult {
    const declarations: Declaration[] = [];
    const start = this.current().range.start;

    while (!this.isAtEnd()) {
      try {
        const decl = this.declaration();
        if (decl) declarations.push(decl);
      } catch {
        this.synchronize();
      }
    }

    const end = this.previous()?.range.end ?? this.current().range.end;

    return {
      document: {
        kind: "Document",
        declarations,
        range: { start, end },
      },
      errors: this.errors,
    };
  }

  private declaration(): Declaration | null {
    // Top-level annotations
    if (this.check("@Rule")) return this.ruleDeclaration();
    if (this.check("@Definition")) return this.definitionDeclaration();
    if (this.check("@Decision")) return this.decisionDeclaration();
    if (this.check("@OpenQuestion")) return this.openQuestionDeclaration();

    // Collect type annotations
    const annotations = this.typeAnnotations();

    // Type declarations
    if (this.check("type", "struct", "data", "protocol", "interface")) {
      return this.typeDeclaration(annotations);
    }
    if (this.check("service")) return this.serviceDeclaration(annotations);
    if (this.check("enum")) return this.enumDeclaration(annotations);
    if (this.check("view")) return this.viewDeclaration(annotations);

    // Unknown token
    this.error(`Unexpected token: ${this.current().value}`);
    this.advance();
    return null;
  }

  // ============================================
  // Top-level annotations
  // ============================================

  private ruleDeclaration(): RuleDeclaration {
    const start = this.current().range.start;
    this.expect("@Rule");
    this.expect("(");
    const id = this.expectString();
    this.expect(",");
    const prose = this.expectProse();
    this.expect(")");

    return {
      kind: "Rule",
      id,
      prose,
      range: { start, end: this.previous().range.end },
    };
  }

  private definitionDeclaration(): DefinitionDeclaration {
    const start = this.current().range.start;
    this.expect("@Definition");
    this.expect("(");
    const id = this.expectString();
    this.expect(",");
    const prose = this.expectProse();
    this.expect(")");

    return {
      kind: "Definition",
      id,
      prose,
      range: { start, end: this.previous().range.end },
    };
  }

  private decisionDeclaration(): DecisionDeclaration {
    const start = this.current().range.start;
    this.expect("@Decision");
    this.expect("(");
    const id = this.expectString();
    this.expect(",");
    const prose = this.expectProse();
    this.expect(")");

    return {
      kind: "Decision",
      id,
      prose,
      range: { start, end: this.previous().range.end },
    };
  }

  private openQuestionDeclaration(): OpenQuestionDeclaration {
    const start = this.current().range.start;
    this.expect("@OpenQuestion");
    this.expect("(");
    const id = this.expectString();
    this.expect(",");
    const prose = this.expectProse();
    this.expect(")");

    return {
      kind: "OpenQuestion",
      id,
      prose,
      range: { start, end: this.previous().range.end },
    };
  }

  // ============================================
  // Type annotations
  // ============================================

  private typeAnnotations(): TypeAnnotation[] {
    const annotations: TypeAnnotation[] = [];

    while (this.check("@Implements", "@See", "@Role", "@Lifecycle", "@Schema")) {
      if (this.match("@Implements")) {
        const start = this.previous().range.start;
        this.expect("(");
        const ruleId = this.expectString();
        this.expect(")");
        annotations.push({
          kind: "Implements",
          ruleId,
          range: { start, end: this.previous().range.end },
        });
      } else if (this.match("@See")) {
        const start = this.previous().range.start;
        this.expect("(");
        const target = this.expectString();
        this.expect(")");
        annotations.push({
          kind: "See",
          target,
          range: { start, end: this.previous().range.end },
        });
      } else if (this.match("@Role")) {
        const start = this.previous().range.start;
        this.expect("(");
        const role = this.expectIdentifier() as RoleKind;
        this.expect(")");
        annotations.push({
          kind: "Role",
          role,
          range: { start, end: this.previous().range.end },
        });
      } else if (this.match("@Lifecycle")) {
        const start = this.previous().range.start;
        this.expect("(");
        const scope = this.expectIdentifier() as LifecycleKind;
        this.expect(")");
        annotations.push({
          kind: "Lifecycle",
          scope,
          range: { start, end: this.previous().range.end },
        });
      } else if (this.match("@Schema")) {
        const start = this.previous().range.start;
        annotations.push({
          kind: "Schema",
          range: { start, end: this.previous().range.end },
        });
      }
    }

    return annotations;
  }

  // ============================================
  // Type declarations
  // ============================================

  private typeDeclaration(annotations: TypeAnnotation[]): TypeDeclaration {
    const start = annotations[0]?.range.start ?? this.current().range.start;
    const keyword = this.advance().value as TypeKeyword;
    const name = this.expectIdentifier();
    this.expect("{");

    const docstring = this.optionalDocstring();
    const members = this.members();

    this.expect("}");

    return {
      kind: "TypeDeclaration",
      keyword,
      name,
      docstring,
      annotations,
      members,
      range: { start, end: this.previous().range.end },
    };
  }

  private serviceDeclaration(annotations: TypeAnnotation[]): ServiceDeclaration {
    const start = annotations[0]?.range.start ?? this.current().range.start;
    this.expect("service");
    const name = this.expectIdentifier();
    this.expect("{");

    const docstring = this.optionalDocstring();
    const methods: Method[] = [];

    while (!this.check("}") && !this.isAtEnd()) {
      const memberDocstring = this.optionalDocstring();
      const method = this.method();
      if (memberDocstring) method.docstring = memberDocstring;
      methods.push(method);
    }

    this.expect("}");

    return {
      kind: "ServiceDeclaration",
      name,
      docstring,
      annotations,
      methods,
      range: { start, end: this.previous().range.end },
    };
  }

  private enumDeclaration(annotations: TypeAnnotation[] = []): EnumDeclaration {
    const start = annotations[0]?.range.start ?? this.current().range.start;
    this.expect("enum");
    const name = this.expectIdentifier();
    this.expect("{");

    const docstring = this.optionalDocstring();
    const cases: EnumCase[] = [];

    while (!this.check("}") && !this.isAtEnd()) {
      cases.push(this.enumCase());
    }

    this.expect("}");

    return {
      kind: "EnumDeclaration",
      name,
      docstring,
      annotations,
      cases,
      range: { start, end: this.previous().range.end },
    };
  }

  private viewDeclaration(annotations: TypeAnnotation[] = []): ViewDeclaration {
    const start = annotations[0]?.range.start ?? this.current().range.start;
    this.expect("view");
    const name = this.expectIdentifier();
    this.expect("{");

    const docstring = this.optionalDocstring();
    const members = this.members();

    this.expect("}");

    return {
      kind: "ViewDeclaration",
      name,
      docstring,
      annotations,
      members,
      range: { start, end: this.previous().range.end },
    };
  }

  // ============================================
  // Members
  // ============================================

  private members(): Member[] {
    const members: Member[] = [];

    while (!this.check("}") && !this.isAtEnd()) {
      const docstring = this.optionalDocstring();
      const member = this.member();
      if (docstring) member.docstring = docstring;
      members.push(member);
    }

    return members;
  }

  private member(): Member {
    // Parse field annotations first
    const fieldAnnotations = this.fieldAnnotations();

    // Check if it's a method (starts with func/fn/function or identifier followed by ()
    if (this.check("func", "fn", "function")) {
      return this.method();
    }

    // Look ahead to distinguish field from method
    if (this.check("identifier")) {
      const next = this.peek(1);
      if (next?.kind === "(") {
        return this.method();
      }
      return this.field(fieldAnnotations);
    }

    this.error("Expected field or method");
    throw new Error("Parse error");
  }

  private fieldAnnotations(): FieldAnnotation[] {
    const annotations: FieldAnnotation[] = [];

    while (this.check("@Id", "@Unique", "@Index", "@Required")) {
      if (this.match("@Id")) {
        const start = this.previous().range.start;
        let generated = false;
        if (this.match("(")) {
          const value = this.expectIdentifier();
          generated = value === "generated";
          this.expect(")");
        }
        annotations.push({
          kind: "Id",
          generated,
          range: { start, end: this.previous().range.end },
        });
      } else if (this.match("@Unique")) {
        annotations.push({
          kind: "Unique",
          range: this.previous().range,
        });
      } else if (this.match("@Index")) {
        annotations.push({
          kind: "Index",
          range: this.previous().range,
        });
      } else if (this.match("@Required")) {
        annotations.push({
          kind: "Required",
          range: this.previous().range,
        });
      }
    }

    return annotations;
  }

  private field(annotations: FieldAnnotation[] = []): Field {
    const start = annotations[0]?.range.start ?? this.current().range.start;
    const name = this.expectIdentifier();
    this.expect(":");
    const type = this.type();

    let defaultValue: Literal | undefined;
    if (this.match("=")) {
      defaultValue = this.literal();
    }

    return {
      kind: "Field",
      name,
      annotations,
      type,
      defaultValue,
      range: { start, end: this.previous().range.end },
    };
  }

  private method(): Method {
    const start = this.current().range.start;

    // Optional func keyword
    this.match("func", "fn", "function");

    const name = this.expectIdentifier();
    this.expect("(");

    const parameters: Parameter[] = [];
    if (!this.check(")")) {
      do {
        parameters.push(this.parameter());
      } while (this.match(","));
    }
    this.expect(")");

    let returnType: TypeExpr | undefined;
    if (this.match("->")) {
      returnType = this.type();
    }

    let throws = false;
    let throwsType: TypeExpr | undefined;
    if (this.match("throws")) {
      throws = true;
      if (!this.check("{", "}", "func", "fn", "function", "identifier", "docstring") && !this.isAtEnd()) {
        throwsType = this.type();
      }
    }

    return {
      kind: "Method",
      name,
      parameters,
      returnType,
      throws,
      throwsType,
      range: { start, end: this.previous().range.end },
    };
  }

  private parameter(): Parameter {
    const start = this.current().range.start;
    const name = this.expectIdentifier();
    this.expect(":");
    const type = this.type();

    let defaultValue: Literal | undefined;
    if (this.match("=")) {
      defaultValue = this.literal();
    }

    return {
      kind: "Parameter",
      name,
      type,
      defaultValue,
      range: { start, end: this.previous().range.end },
    };
  }

  private enumCase(): EnumCase {
    const start = this.current().range.start;
    const docstring = this.optionalDocstring();
    const name = this.expectIdentifier();

    let associatedValues: Parameter[] | undefined;
    if (this.match("(")) {
      associatedValues = [];
      if (!this.check(")")) {
        do {
          associatedValues.push(this.parameter());
        } while (this.match(","));
      }
      this.expect(")");
    }

    return {
      kind: "EnumCase",
      name,
      docstring,
      associatedValues,
      range: { start, end: this.previous().range.end },
    };
  }

  // ============================================
  // Types
  // ============================================

  private type(): TypeExpr {
    let type = this.baseType();

    // Optional suffix
    if (this.match("?")) {
      type = {
        kind: "OptionalType",
        innerType: type,
        range: { start: type.range.start, end: this.previous().range.end },
      };
    }

    return type;
  }

  private baseType(): TypeExpr {
    const start = this.current().range.start;

    // Array or Dictionary
    if (this.match("[")) {
      const first = this.type();

      if (this.match(":")) {
        // Dictionary
        const valueType = this.type();
        this.expect("]");
        return {
          kind: "DictionaryType",
          keyType: first,
          valueType,
          range: { start, end: this.previous().range.end },
        };
      }

      // Array
      this.expect("]");
      return {
        kind: "ArrayType",
        elementType: first,
        range: { start, end: this.previous().range.end },
      };
    }

    // Named type
    const name = this.expectIdentifier();

    if (isPrimitive(name)) {
      return {
        kind: "PrimitiveType",
        name,
        range: { start, end: this.previous().range.end },
      };
    }

    return {
      kind: "NamedType",
      name,
      range: { start, end: this.previous().range.end },
    };
  }

  // ============================================
  // Literals
  // ============================================

  private literal(): Literal {
    const start = this.current().range.start;

    if (this.match("string")) {
      return {
        kind: "StringLiteral",
        value: this.previous().value,
        range: { start, end: this.previous().range.end },
      };
    }

    if (this.match("number")) {
      return {
        kind: "NumberLiteral",
        value: parseFloat(this.previous().value),
        range: { start, end: this.previous().range.end },
      };
    }

    if (this.match("true")) {
      return {
        kind: "BooleanLiteral",
        value: true,
        range: { start, end: this.previous().range.end },
      };
    }

    if (this.match("false")) {
      return {
        kind: "BooleanLiteral",
        value: false,
        range: { start, end: this.previous().range.end },
      };
    }

    if (this.match("null")) {
      return {
        kind: "NullLiteral",
        range: { start, end: this.previous().range.end },
      };
    }

    if (this.match("[")) {
      const elements: Literal[] = [];
      if (!this.check("]")) {
        do {
          elements.push(this.literal());
        } while (this.match(","));
      }
      this.expect("]");
      return {
        kind: "ArrayLiteral",
        elements,
        range: { start, end: this.previous().range.end },
      };
    }

    this.error("Expected literal value");
    throw new Error("Parse error");
  }

  // ============================================
  // Helpers
  // ============================================

  private optionalDocstring(): string | undefined {
    if (this.match("docstring")) {
      return this.previous().value;
    }
    return undefined;
  }

  private expectString(): string {
    if (this.match("string")) {
      return this.previous().value;
    }
    this.error("Expected string");
    throw new Error("Parse error");
  }

  private expectProse(): string {
    if (this.match("string", "docstring")) {
      return this.previous().value;
    }
    this.error("Expected string or docstring");
    throw new Error("Parse error");
  }

  private expectIdentifier(): string {
    if (this.match("identifier")) {
      return this.previous().value;
    }
    // Allow primitives as identifiers in type position
    const primitives = ["string", "int", "float", "double", "bool", "date", "datetime", "url", "void", "any"];
    for (const p of primitives) {
      if (this.current().value === p) {
        this.advance();
        return p;
      }
    }
    this.error("Expected identifier");
    throw new Error("Parse error");
  }

  private expect(...kinds: TokenKind[]): Token {
    for (const kind of kinds) {
      if (this.check(kind)) {
        return this.advance();
      }
    }
    this.error(`Expected ${kinds.join(" or ")}, got ${this.current().kind}`);
    throw new Error("Parse error");
  }

  private match(...kinds: TokenKind[]): boolean {
    for (const kind of kinds) {
      if (this.check(kind)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(...kinds: TokenKind[]): boolean {
    return kinds.includes(this.current().kind);
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.pos++;
    return this.previous();
  }

  private current(): Token {
    return this.tokens[this.pos];
  }

  private previous(): Token {
    return this.tokens[this.pos - 1];
  }

  private peek(offset: number): Token | undefined {
    return this.tokens[this.pos + offset];
  }

  private isAtEnd(): boolean {
    return this.current().kind === "eof";
  }

  private error(message: string): void {
    this.errors.push({
      message,
      range: this.current().range,
    });
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      // Synchronize on declaration boundaries
      if (
        this.check(
          "@Rule",
          "@Definition",
          "@Decision",
          "@OpenQuestion",
          "@Implements",
          "@See",
          "type",
          "struct",
          "data",
          "protocol",
          "interface",
          "service",
          "view",
          "enum"
        )
      ) {
        return;
      }
      this.advance();
    }
  }
}

export function parse(source: string): ParseResult {
  const tokens = lex(source);
  return new Parser(tokens).parse();
}
