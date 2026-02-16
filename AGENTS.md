# AGENTS.md

## 1. Project Identity

- Name: `weft`
- Type: TypeScript monorepo (npm workspaces)
- Core purpose: a specification language (`.weft`) plus tooling that validates specs (parser + analyzer + CLI + LSP)
- Value proposition: structured specs with real-time validation instead of drift-prone markdown

Primary user outcomes:

- Keep system specs internally consistent
- Catch unknown types/rules/references early
- Enforce architecture/lifecycle dependency constraints
- Generate implementation-oriented views (`contract`, `bootstrap`, `deps`, `todos`)

## 2. Source-Of-Truth Order (Important)

When docs and code disagree, trust sources in this order:

1. `packages/lsp/src/*.ts` (actual parser/analyzer/CLI/LSP behavior)
2. `examples/*.weft` and `examples/wild-collab/*.weft` (real working language usage)
3. `docs/STATUS.md` and `docs/GRAMMAR.md` (intended current scope)
4. `packages/tree-sitter-weft/*` (syntax grammar/highlighting, not semantic authority)
5. Everything else in `docs/` is potentially legacy unless explicitly aligned with current implementation

## 3. Codebase Map

### Root

- `package.json`: workspace scripts (`build`, `test`, `typecheck`)
- `README.md`: product framing and why Weft exists
- `AGENTS.md`: this file (agent bootstrap)

### Core Runtime (`packages/lsp`)

- `packages/lsp/src/lexer.ts`: tokenization
- `packages/lsp/src/parser.ts`: recursive-descent parser, AST construction
- `packages/lsp/src/ast.ts`: AST + role/lifecycle dependency helpers
- `packages/lsp/src/analyzer.ts`: semantic checks + architecture/lifecycle validation + query helpers
- `packages/lsp/src/cli.ts`: `weft` command implementation
- `packages/lsp/src/server.ts`: `weft-lsp` language server
- `packages/lsp/src/build-freshness.ts`: stale `dist` detection guard for CLI/LSP startup
- `packages/lsp/src/*.test.ts`: parser/analyzer/build-freshness tests

### Editor Integrations

- `packages/vscode/src/extension.ts`: launches `@weft/lsp/dist/server.js`
- `packages/zed/src/lib.rs`: resolves `weft-lsp` binary and starts stdio server

### Grammar/Highlighting

- `packages/tree-sitter-weft/grammar.js`: tree-sitter grammar
- `packages/tree-sitter-weft/queries/highlights.scm`: highlight captures

### MCP

- `packages/mcp/src/server.ts`: MCP wrapper around parser/analyzer capabilities

### Examples

- `examples/workflow-annotations.weft`: compact feature sample
- `examples/wild-collab/*`: canonical multi-file example for realistic workflows

## 4. Implemented Language Surface (Current)

Top-level declarations:

- `@Rule`, `@Definition`, `@Decision`, `@OpenQuestion`
- `type`, `struct`, `data`, `protocol`, `interface`, `service`, `enum`, `view`

Type-attached annotations:

- `@Implements`, `@See`, `@Role`, `@Lifecycle`, `@Schema`, `@Boundary`, `@Priority`, `@TODO`

Field annotations:

- `@Id`, `@Unique`, `@Index`, `@Required`

Type features:

- primitives, named types, arrays, dictionaries, optional `?`
- literals for defaults (`string`, `number`, `bool`, `null`, array literals)
- methods with optional `func|fn|function`, return type, `throws` with optional typed throw

`@TODO` note:

- Required: summary string
- Optional fields: `id`, `owner`, `due`, `status`, `priority`
- Default `status`: `open`

Not supported yet (by implementation):

- imports/module system
- executable statement-level bodies
- full expression language
- `@Constraint`, `@Example`, `@Assumption`

## 5. Fast Command Playbook

From repo root:

- Build all workspaces: `npm run build`
- Build core package only: `npm run build --workspace=@weft/lsp`
- Typecheck core: `npm run typecheck --workspace=@weft/lsp`
- Tests once (no watch): `npm run test --workspace=@weft/lsp -- --run`
- Full tests (non-watch): `CI=1 npm test`

CLI smoke checks:

- `npx weft --help`
- `npx weft check ./examples`
- `npx weft stats ./examples/wild-collab`
- `npx weft deps ./examples/wild-collab`
- `npx weft contract ./examples/wild-collab`
- `npx weft bootstrap ./examples/wild-collab --target typescript`

## 6. Known Failure Modes

### Stale Build Artifacts (`src` newer than `dist`)

Symptom:

- parser appears "broken" in CLI/editor after restarting tooling
- valid syntax suddenly fails in runtime that is loading old `dist/*.js`

Current behavior:

- `weft` and `weft-lsp` now fail fast with a stale-build diagnostic

Fix:

- `npm run build --workspace=@weft/lsp`

One-off bypass:

- `WEFT_SKIP_BUILD_CHECK=1 weft ...`

### Test Process Hangs

Symptom:

- `npm test` appears to keep running (Vitest watch mode)

Fix:

- use `CI=1 npm test` or `npm run test --workspace=@weft/lsp -- --run`

### Docs Drift

Symptom:

- docs mention language features that parser does not support

Fix:

- validate against `packages/lsp/src/*` and runnable examples

## 7. Debug Playbooks

### Parser issue

1. Run `npm run build --workspace=@weft/lsp`
2. Run `npm run test --workspace=@weft/lsp -- --run`
3. Repro with `npx weft check <file-or-dir>`
4. Inspect `packages/lsp/src/lexer.ts` then `packages/lsp/src/parser.ts`

### Analyzer/diagnostic issue

1. Repro with `npx weft check` + `npx weft deps` + `npx weft contract`
2. Inspect `packages/lsp/src/analyzer.ts` and `packages/lsp/src/ast.ts`
3. Add/adjust tests in `packages/lsp/src/analyzer.test.ts`

### Editor-only issue

1. Confirm CLI behavior first (`npx weft check ...`)
2. VS Code path: `packages/vscode/src/extension.ts` (loads `@weft/lsp/dist/server.js`)
3. Zed path: `packages/zed/src/lib.rs` (resolves `weft-lsp` in PATH / npm package)
4. Rebuild `@weft/lsp` before deeper investigation

## 8. Glossary

- Weft: spec language + tooling stack
- Rule: global invariant (`@Rule`)
- Definition: glossary/domain term (`@Definition`)
- Decision: rationale record (`@Decision`)
- OpenQuestion: unresolved design item (`@OpenQuestion`)
- Implements: declaration claims to satisfy a rule
- Role: Clean Architecture layer label (`entity`, `usecase`, etc.)
- Lifecycle: object lifetime scope (`singleton`, `session`, `feature`, `view`)
- Boundary: integration surface (`api`, `database`, `ui`, etc.)
- Priority: implementation urgency (`p0`..`p3` or aliases)
- TODO: structured work item attached to declaration
- Coverage: report of spec gaps (rules, docs, references, roles)
- Contract: implementation-oriented summary payload from specs
- Bootstrap: startup payload for downstream coding agents

## 9. New-Thread 5-Minute Boot Sequence

1. Read this file fully.
2. Run:
   - `npm run build --workspace=@weft/lsp`
   - `npm run test --workspace=@weft/lsp -- --run`
   - `npx weft check ./examples`
3. Read these files:
   - `packages/lsp/src/parser.ts`
   - `packages/lsp/src/analyzer.ts`
   - `examples/wild-collab/context/00-governance.weft`
   - `examples/wild-collab/services/threading.weft`
4. Proceed with task-specific investigation.

## 10. Maintenance Notes

- Keep this file short, factual, and implementation-aligned.
- Update immediately when parser/analyzer/CLI behavior changes.
- Do not expand legacy docs first; document runtime truth first.
