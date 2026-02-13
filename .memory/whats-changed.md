# What Changed (Spec Pivot Snapshot)

## Summary

Weft is now positioned and implemented as a spec language with validation, not as a cross-platform pseudocode-to-code generator.

## Implemented Today

- Top-level annotations: `@Rule`, `@Definition`, `@Decision`, `@OpenQuestion`
- Declarations: `type`, `struct`, `data`, `protocol`, `interface`, `service`, `enum`, `view`
- Type annotations: `@Implements`, `@See`, `@Role`, `@Lifecycle`, `@Schema`
- Field annotations: `@Id`, `@Unique`, `@Index`, `@Required`
- Cross-file symbol/type validation in CLI/LSP workspace analysis
- Architecture and lifecycle constraint checks

## Not Implemented (Yet)

- Imports/module system
- Statement-level executable language and function bodies
- `@Constraint`, `@Example`, `@Assumption` semantics in parser/analyzer

## Reference

Use `docs/STATUS.md` as the living status document.
