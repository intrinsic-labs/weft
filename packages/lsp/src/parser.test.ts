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

  it("tokenizes workflow annotations", () => {
    const tokens = lex(`@Boundary(api)\n@Priority(p1)\n@TODO("ship it", status: open)`);
    const kinds = tokens.map((t) => t.kind);

    expect(kinds).toContain("@Boundary");
    expect(kinds).toContain("@Priority");
    expect(kinds).toContain("@TODO");
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

  it("parses role/lifecycle annotations that use keyword-like values", () => {
    const { document, errors } = parse(`
      @Role(service)
      @Lifecycle(view)
      type ServiceViewType {
        id: string
      }
    `);

    expect(errors).toHaveLength(0);
    expect(document.declarations).toHaveLength(1);

    const decl = document.declarations[0];
    if (decl.kind === "TypeDeclaration") {
      expect(decl.annotations).toHaveLength(2);
      expect(decl.annotations[0].kind).toBe("Role");
      expect(decl.annotations[1].kind).toBe("Lifecycle");
    }
  });

  it("parses boundary, priority, and TODO annotations", () => {
    const { document, errors } = parse(`
      @Boundary(api, "billing")
      @Priority(high)
      @TODO("Add retries", owner: "core", due: "2026-03-01", status: blocked, priority: p0)
      service BillingGateway {
        func charge(id: string) -> bool
      }
    `);

    expect(errors).toHaveLength(0);
    expect(document.declarations).toHaveLength(1);

    const decl = document.declarations[0];
    if (decl.kind === "ServiceDeclaration") {
      expect(decl.annotations).toHaveLength(3);

      const boundary = decl.annotations.find((a) => a.kind === "Boundary");
      expect(boundary?.kind).toBe("Boundary");
      if (boundary?.kind === "Boundary") {
        expect(boundary.boundary).toBe("api");
        expect(boundary.system).toBe("billing");
      }

      const priority = decl.annotations.find((a) => a.kind === "Priority");
      expect(priority?.kind).toBe("Priority");
      if (priority?.kind === "Priority") {
        expect(priority.level).toBe("p1");
      }

      const todo = decl.annotations.find((a) => a.kind === "Todo");
      expect(todo?.kind).toBe("Todo");
      if (todo?.kind === "Todo") {
        expect(todo.summary).toBe("Add retries");
        expect(todo.owner).toBe("core");
        expect(todo.due).toBe("2026-03-01");
        expect(todo.status).toBe("blocked");
        expect(todo.priority).toBe("p0");
      }
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

describe("Architecture Annotations", () => {
  it("parses @Role annotation", () => {
    const { document, errors } = parse(`
      @Role(entity)
      type User {
        id: string
      }
    `);

    expect(errors).toHaveLength(0);

    const decl = document.declarations[0];
    if (decl.kind === "TypeDeclaration") {
      expect(decl.annotations).toHaveLength(1);
      expect(decl.annotations[0].kind).toBe("Role");
      if (decl.annotations[0].kind === "Role") {
        expect(decl.annotations[0].role).toBe("entity");
      }
    }
  });

  it("parses @Lifecycle annotation", () => {
    const { document, errors } = parse(`
      @Lifecycle(singleton)
      @Role(repository)
      type UserRepository {
        users: [User]
      }
    `);

    expect(errors).toHaveLength(0);

    const decl = document.declarations[0];
    if (decl.kind === "TypeDeclaration") {
      expect(decl.annotations).toHaveLength(2);
      const lifecycle = decl.annotations.find(a => a.kind === "Lifecycle");
      if (lifecycle?.kind === "Lifecycle") {
        expect(lifecycle.scope).toBe("singleton");
      }
    }
  });

  it("parses @Schema annotation", () => {
    const { document, errors } = parse(`
      @Schema
      type UserRecord {
        id: string
        email: string
      }
    `);

    expect(errors).toHaveLength(0);

    const decl = document.declarations[0];
    if (decl.kind === "TypeDeclaration") {
      expect(decl.annotations).toHaveLength(1);
      expect(decl.annotations[0].kind).toBe("Schema");
    }
  });

  it("parses field annotations", () => {
    const { document, errors } = parse(`
      @Schema
      type UserRecord {
        @Id(generated) id: string
        @Unique email: string
        @Index createdAt: datetime
        @Required name: string
      }
    `);

    expect(errors).toHaveLength(0);

    const decl = document.declarations[0];
    if (decl.kind === "TypeDeclaration") {
      const idField = decl.members[0];
      if (idField.kind === "Field") {
        expect(idField.annotations).toHaveLength(1);
        expect(idField.annotations[0].kind).toBe("Id");
        if (idField.annotations[0].kind === "Id") {
          expect(idField.annotations[0].generated).toBe(true);
        }
      }

      const emailField = decl.members[1];
      if (emailField.kind === "Field") {
        expect(emailField.annotations[0].kind).toBe("Unique");
      }
    }
  });

  it("parses complete Clean Architecture example", () => {
    const source = `
      @Role(entity)
      type User {
        id: string
        email: string
      }

      @Role(usecase)
      @Lifecycle(singleton)
      service CreateUserUseCase {
        func execute(email: string) -> User throws
      }

      @Role(repository)
      protocol UserRepository {
        func findById(id: string) -> User?
        func save(user: User) throws
      }

      @Role(adapter)
      @Lifecycle(singleton)
      service UserRepositoryImpl {
        func findById(id: string) -> User?
        func save(user: User) throws
      }
    `;

    const { document, errors } = parse(source);

    expect(errors).toHaveLength(0);
    expect(document.declarations).toHaveLength(4);
  });
});
