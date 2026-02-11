import { describe, expect, it } from "vitest";
import { parse } from "./parser.js";
import { analyze, analyzeWorkspace, coverage } from "./analyzer.js";

describe("Analyzer", () => {
  it("resolves cross-file type references in workspace analysis", () => {
    const docA = parse(`
      type User {
        id: string
      }
    `).document;
    const docB = parse(`
      type Session {
        user: User
      }
    `).document;

    const single = analyze(docB);
    expect(single.diagnostics.some((d) => d.code === "unknown-type")).toBe(true);

    const workspace = analyzeWorkspace([
      { uri: "file:///a.weft", document: docA },
      { uri: "file:///b.weft", document: docB },
    ]);
    expect(workspace.diagnostics.some((d) => d.code === "unknown-type")).toBe(false);
  });

  it("validates @See targets", () => {
    const document = parse(`
      @See("missing-target")
      type User {
        id: string
      }
    `).document;

    const result = analyze(document);
    const seeDiagnostic = result.diagnostics.find((d) => d.code === "unknown-see-target");
    expect(seeDiagnostic).toBeDefined();
    expect(seeDiagnostic?.severity).toBe("warning");
  });

  it("validates role/lifecycle annotations on services", () => {
    const document = parse(`
      @Role(not_a_role)
      @Lifecycle(not_a_scope)
      service PingService {
        ping() -> bool
      }
    `).document;

    const result = analyze(document);
    expect(result.diagnostics.some((d) => d.code === "invalid-role")).toBe(true);
    expect(result.diagnostics.some((d) => d.code === "invalid-lifecycle")).toBe(true);
  });

  it("reports unreferenced definitions in coverage", () => {
    const source = `
      @Definition("used-def", "Used")
      @Definition("orphan-def", "Not referenced")

      type User {
        """
        Related: @Definition("used-def")
        """
        id: string
      }
    `;

    const { document } = parse(source);
    const { symbols } = analyze(document);
    const report = coverage(symbols, document);

    expect(report.unreferencedDefinitions).toContain("orphan-def");
    expect(report.unreferencedDefinitions).not.toContain("used-def");
  });
});
