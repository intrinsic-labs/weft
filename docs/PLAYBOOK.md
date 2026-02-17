# Weft Playbook

Operational commands and triage flows for working on Weft.

## 1. Core Commands

From repo root:

```bash
npm run build --workspace=@rocketbro/weft
npm run typecheck --workspace=@rocketbro/weft
npm run test --workspace=@rocketbro/weft -- --run
```

Workspace-wide checks:

```bash
CI=1 npm test
npm run typecheck
```

CLI smoke tests:

```bash
npx weft --help
npx weft check ./examples
npx weft stats ./examples/wild-collab
npx weft deps ./examples/wild-collab
npx weft contract ./examples/wild-collab
npx weft bootstrap ./examples/wild-collab --target typescript
```

## 2. First Response: "Parser Broke"

1. Rebuild runtime artifacts:

```bash
npm run build --workspace=@rocketbro/weft
```

2. Run parser/analyzer tests:

```bash
npm run test --workspace=@rocketbro/weft -- --run
```

3. Re-run failing CLI command.

4. If still failing, inspect in order:

- `packages/lsp/src/lexer.ts`
- `packages/lsp/src/parser.ts`
- `packages/lsp/src/analyzer.ts`

Notes:

- CLI/LSP execute `dist/*`, not `src/*` directly.
- Startup now detects stale build artifacts and exits with rebuild instructions.

## 3. Editor Issues (Zed / VS Code)

1. Confirm CLI reproduces issue first:

```bash
npx weft check <path>
```

2. If CLI is healthy but editor is not:

- rebuild `@rocketbro/weft`
- restart language server/editor

Integration locations:

- VS Code: `packages/vscode/src/extension.ts`
- Zed: `packages/zed/src/lib.rs`

## 4. Release/Distribution

- External usage: `docs/ADOPTION.md`

## 5. Agent/Handoff Boot Sequence (5 Minutes)

1. Read `docs/STATUS.md`.
2. Read `docs/GRAMMAR.md`.
3. Run build + tests (`@rocketbro/weft`).
4. Run `npx weft check ./examples`.
5. Read:
   - `packages/lsp/src/parser.ts`
   - `packages/lsp/src/analyzer.ts`
   - `examples/wild-collab/context/00-governance.weft`
   - `examples/wild-collab/services/threading.weft`
