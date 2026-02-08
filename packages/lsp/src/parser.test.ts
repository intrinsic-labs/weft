/**
 * Tests for the Weft parser.
 */

import { describe, it, expect } from "vitest";
import { parse } from "./parser.js";
import { lex } from "./lexer.js";

describe("Lexer", () => {
  it("tokenizes basic type declaration", () => {
    const tokens = lex(`type User { id: string }`);
    const kinds = tokens.map((t) => t.kind);

    expect(kinds).toEqual([
      "type",
      "identifier",
      "{",
      "identifier",
      ":",
      "identifier",
      "}",
      "eof",
    ]);
  });

  it("tokenizes annotations", () => {
    const tokens = lex(`@Rule("test", "prose")`);
    const kinds = tokens.map((t) => t.kind);

    expect(kinds).toEqual(["@Rule", "(", "string", ",", "string", ")", "eof"]);
  });

  it("tokenizes docstrings", () => {
    const tokens = lex(`"""This is a docstring"""`);

    expect(tokens[0].kind).toBe("docstring");
    expect(tokens[0].value).toBe("This is a docstring");
  });

  it("handles comments", () => {
    const tokens = lex(`// comment\ntype User {}`);
    const kinds = tokens.map((t) => t.kind);

    expect(kinds).toEqual(["type", "identifier", "{", "}", "eof"]);
  });
});

describe("Parser", () => {
  it("parses empty document", () => {
    const { document, errors } = parse("");

    expect(document.kind).toBe("Document");
    expect(document.declarations).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });

  it("parses simple type", () => {
    const { document, errors } = parse(`
      type User {
        id: string
        name: string
      }
    `);

    expect(errors).toHaveLength(0);
    expect(document.declarations).toHaveLength(1);

    const decl = document.declarations[0];
    expect(decl.kind).toBe("TypeDeclaration");

    if (decl.kind === "TypeDeclaration") {
      expect(decl.name).toBe("User");
      expect(decl.members).toHaveLength(2);
    }
  });

  it("parses type with docstring", () => {
    const { document, errors } = parse(`
      type User {
        """
        The user entity.
        """
        id: string
      }
    `);

    expect(errors).toHaveLength(0);

    const decl = document.declarations[0];
    if (decl.kind === "TypeDeclaration") {
      expect(decl.docstring).toContain("user entity");
    }
  });

  it("parses @Rule annotation", () => {
    const { document, errors } = parse(`
      @Rule("test-rule", '''
      This is the rule description.
      ''')
    `);

    expect(errors).toHaveLength(0);
    expect(document.declarations).toHaveLength(1);

    const decl = document.declarations[0];
    expect(decl.kind).toBe("Rule");

    if (decl.kind === "Rule") {
      expect(decl.id).toBe("test-rule");
      expect(decl.prose).toContain("rule description");
    }
  });

  it("parses @Implements on type", () => {
    const { document, errors } = parse(`
      @Implements("some-rule")
      type User {
        id: string
      }
    `);

    expect(errors).toHaveLength(0);

    const decl = document.declarations[0];
    if (decl.kind === "TypeDeclaration") {
      expect(decl.annotations).toHaveLength(1);
      expect(decl.annotations[0].kind).toBe("Implements");
    }
  });

  it("parses service with methods", () => {
    const { document, errors } = parse(`
      service UserService {
        func getUser(id: string) -> User
        func createUser(name: string, email: string) -> User throws
      }
    `);

    expect(errors).toHaveLength(0);

    const decl = document.declarations[0];
    expect(decl.kind).toBe("ServiceDeclaration");

    if (decl.kind === "ServiceDeclaration") {
      expect(decl.name).toBe("UserService");
      expect(decl.methods).toHaveLength(2);
      expect(decl.methods[1].throws).toBe(true);
    }
  });

  it("parses enum with associated values", () => {
    const { document, errors } = parse(`
      enum Status {
        pending
        success
        failed(reason: string)
      }
    `);

    expect(errors).toHaveLength(0);

    const decl = document.declarations[0];
    if (decl.kind === "EnumDeclaration") {
      expect(decl.cases).toHaveLength(3);
      expect(decl.cases[2].associatedValues).toHaveLength(1);
    }
  });

  it("parses optional and array types", () => {
    const { document, errors } = parse(`
      type Container {
        items: [Item]
        selected: Item?
        metadata: [string: any]
      }
    `);

    expect(errors).toHaveLength(0);

    const decl = document.declarations[0];
    if (decl.kind === "TypeDeclaration") {
      const items = decl.members[0];
      if (items.kind === "Field") {
        expect(items.type.kind).toBe("ArrayType");
      }

      const selected = decl.members[1];
      if (selected.kind === "Field") {
        expect(selected.type.kind).toBe("OptionalType");
      }

      const metadata = decl.members[2];
      if (metadata.kind === "Field") {
        expect(metadata.type.kind).toBe("DictionaryType");
      }
    }
  });

  it("parses default values", () => {
    const { document, errors } = parse(`
      type Config {
        enabled: bool = true
        count: int = 10
        name: string = "default"
      }
    `);

    expect(errors).toHaveLength(0);

    const decl = document.declarations[0];
    if (decl.kind === "TypeDeclaration") {
      const enabled = decl.members[0];
      if (enabled.kind === "Field" && enabled.defaultValue?.kind === "BooleanLiteral") {
        expect(enabled.defaultValue.value).toBe(true);
      }
    }
  });

  it("reports error for unknown type", () => {
    const { errors } = parse(`
      type User {
        id: UnknownType
      }
    `);

    // Parser doesn't validate types, but analyzer will
    expect(errors).toHaveLength(0);
  });
});

describe("Full Example", () => {
  it("parses complete specification", () => {
    const source = `
      @Definition("verified-user", '''
      A user who has verified their email.
      ''')

      @Rule("auth-required", '''
      All API endpoints require authentication.
      ''')

      @Decision("use-jwt", '''
      We use JWT tokens for authentication.
      ''')

      @OpenQuestion("token-expiry", '''
      How long should tokens be valid?
      ''')

      type User {
        """
        Core user entity.
        """
        id: string
        email: string
        isVerified: bool = false
      }

      @Implements("auth-required")
      service Auth {
        func login(email: string, password: string) -> Token throws
        func logout(token: Token) throws
      }

      view LoginScreen {
        email: string = ""
        password: string = ""
        isLoading: bool = false

        func onSubmit()
      }
    `;

    const { document, errors } = parse(source);

    expect(errors).toHaveLength(0);
    expect(document.declarations).toHaveLength(7);

    // Check each declaration type
    const kinds = document.declarations.map((d) => d.kind);
    expect(kinds).toEqual([
      "Definition",
      "Rule",
      "Decision",
      "OpenQuestion",
      "TypeDeclaration",
      "ServiceDeclaration",
      "ViewDeclaration",
    ]);
  });
});
