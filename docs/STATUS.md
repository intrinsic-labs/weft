# Weft Status (Spec Pivot)

Last updated: 2026-02-11

## Working Today

- Parser/LSP support for:
  - `@Rule`, `@Definition`, `@Decision`, `@OpenQuestion`
  - `type`, `struct`, `data`, `protocol`, `interface`, `service`, `enum`, `view`
  - `@Implements`, `@See`, `@Role`, `@Lifecycle`, `@Schema`
  - `@Id`, `@Unique`, `@Index`, `@Required`
- Type/reference validation (including prose references like `@Definition("...")`)
- Cross-file validation in the language server across `.weft` files in the workspace
- Architecture and lifecycle constraint checks
- VS Code and Zed extension scaffolding in repo

## Not Supported Yet

- Executable function bodies/statement-level language features from legacy pseudocode docs
- Imports/module system (`import ...`)
- Full expression language
- `@Constraint`, `@Example`, `@Assumption` (planned, not implemented)
- Precise range mapping for prose reference diagnostics (currently declaration-level ranges)

## Guidance

For real-project testing, write specs to match `GRAMMAR.md` and validate in-editor with diagnostics as the source of truth.
