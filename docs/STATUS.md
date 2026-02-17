# Weft Status

Last verified: 2026-02-16

## Implemented Today

Language declarations:

- `type`, `struct`, `data`, `protocol`, `interface`, `service`, `enum`, `view`

Top-level annotations:

- `@Rule`, `@Definition`, `@Decision`, `@OpenQuestion`

Type-level annotations:

- `@Implements`, `@See`, `@Role`, `@Lifecycle`, `@Schema`, `@Boundary`, `@Priority`, `@TODO`

Field annotations:

- `@Id`, `@Unique`, `@Index`, `@Required`

Validation capabilities:

- Type reference validation
- Rule/definition/decision/question reference validation in prose
- Field-path prose validation (e.g. `` `User.email` ``)
- Cross-file workspace analysis
- Clean Architecture dependency checks via `@Role`
- Lifecycle dependency checks via `@Lifecycle`
- Coverage reports and query helpers via CLI

CLI commands:

- `weft check`
- `weft stats`
- `weft coverage`
- `weft query`
- `weft deps`
- `weft contract`
- `weft bootstrap`
- `weft docs query`

## Not Implemented

- Imports/module system (`import ...`)
- Executable statement-level language / full expression language
- `@Constraint`, `@Example`, `@Assumption`
- Precise range mapping for references inside prose (currently declaration-level range)
- Rich markdown syntax highlighting/parsing inside docstrings in editor clients

## Runtime Notes

- CLI and LSP run from `@rocketbro/weft/dist/*`.
- Stale build artifacts are now detected at startup.
- If source is newer than dist, rebuild:

```bash
npm run build --workspace=@rocketbro/weft
```

## Canonical Implementation Files

- `packages/lsp/src/lexer.ts`
- `packages/lsp/src/parser.ts`
- `packages/lsp/src/analyzer.ts`
- `packages/lsp/src/cli.ts`
- `packages/lsp/src/server.ts`
- `packages/lsp/src/ast.ts`
