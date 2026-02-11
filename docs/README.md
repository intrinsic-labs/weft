# Weft Docs

Weft is now focused on **verifiable specifications**:

- Write structured specs in `.weft`
- Validate references, types, and architecture with the LSP
- Keep prose and declarations in sync as specs evolve

The product direction is defined in `/Users/asherpope/dev/ai/weft/VISION.md`.

## Start Here

1. [Introduction](getting-started/01-introduction.md)
2. [Quick Start](getting-started/02-quick-start.md)
3. [Current Status](STATUS.md)
4. [Grammar](GRAMMAR.md)
5. [Example Spec](../examples/messaging.weft)

## Current Scope

The implemented language currently supports:

- Top-level spec annotations: `@Rule`, `@Definition`, `@Decision`, `@OpenQuestion`
- Declarations: `type`, `struct`, `data`, `protocol`, `interface`, `service`, `enum`, `view`
- Type-level annotations: `@Implements`, `@See`, `@Role`, `@Lifecycle`, `@Schema`
- Field annotations: `@Id`, `@Unique`, `@Index`, `@Required`
- Real-time validation in the LSP (including cross-file validation)

## Legacy Docs

Many files under `/Users/asherpope/dev/ai/weft/docs/language`, `/Users/asherpope/dev/ai/weft/docs/ui`, `/Users/asherpope/dev/ai/weft/docs/data`, and related architecture docs describe the older cross-platform pseudocode direction.

Treat those as archival notes for now. They are not the source of truth for current parser/LSP behavior.
