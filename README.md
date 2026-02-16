# Weft

Weft is a specification language for writing machine-checkable system specs.

It targets the gap between free-form markdown (easy, no validation) and heavyweight enterprise/formal tools (powerful, high friction).

## Why It Exists

Detailed specs drift over time:

- renamed types leave stale references
- global rules are declared but not implemented
- prose references break silently
- architecture decisions and constraints become inconsistent

Weft keeps specs coherent as they evolve by validating structure and references continuously.

## What Weft Is

- A `.weft` language for structured specifications
- A parser + analyzer that validates references and architecture constraints
- A CLI (`weft`) for checks, queries, coverage, dependency graphs, and implementation views
- An LSP server (`weft-lsp`) for real-time editor diagnostics

## What Works Today

Supported declarations:

- `type`, `struct`, `data`, `protocol`, `interface`, `service`, `enum`, `view`

Supported top-level annotations:

- `@Rule`, `@Definition`, `@Decision`, `@OpenQuestion`

Supported declaration annotations:

- `@Implements`, `@See`, `@Role`, `@Lifecycle`, `@Schema`, `@Boundary`, `@Priority`, `@TODO`

Supported field annotations:

- `@Id`, `@Unique`, `@Index`, `@Required`

Validation includes:

- unknown type/rule/definition/decision/question detection
- prose reference validation (including field paths like `` `User.email` ``)
- cross-file workspace analysis
- role-based dependency checks (`@Role`)
- lifecycle dependency checks (`@Lifecycle`)

## Example (Valid Current Syntax)

```weft
@Definition("verified-user", '''
A user whose identity is verified.
''')

@Rule("verification-required", '''
Only verified users can send first-contact messages.
''')

@Role(entity)
type User {
  id: string
  email: string
  isVerified: bool = false
}

@Role(usecase)
@Lifecycle(singleton)
@Implements("verification-required")
service Messaging {
  func sendMessage(sender: User, recipient: User, content: string) -> bool throws
}
```

## Quick Start

From repo root:

```bash
npm run build --workspace=@weft/lsp
npm run test --workspace=@weft/lsp -- --run
npx weft check ./examples
```

For deeper operational flows, use:

- `docs/PLAYBOOK.md`
- `docs/ADOPTION.md`

## Current Boundary

Weft is for specification and validation.

It is not an executable language and does not run function bodies.

## Not Implemented Yet

- imports/module system
- executable statement-level language / full expression language
- `@Constraint`, `@Example`, `@Assumption`

## Project Layout

Core implementation:

- `packages/lsp/src/lexer.ts`
- `packages/lsp/src/parser.ts`
- `packages/lsp/src/analyzer.ts`
- `packages/lsp/src/cli.ts`
- `packages/lsp/src/server.ts`

Related packages:

- `packages/tree-sitter-weft` (grammar/highlighting)
- `packages/vscode` (VS Code extension wrapper)
- `packages/zed` (Zed extension)
- `packages/mcp` (MCP server)

Examples:

- `examples/workflow-annotations.weft`
- `examples/wild-collab/*.weft`

## Canonical Docs

Read in order:

1. `docs/STATUS.md`
2. `docs/GRAMMAR.md`
3. `docs/GLOSSARY.md`
4. `docs/PLAYBOOK.md`
5. `docs/getting-started/01-introduction.md`

## Source-Of-Truth Rule

When docs and implementation disagree, trust:

1. `packages/lsp/src/*.ts`
2. `examples/*.weft`
3. `docs/STATUS.md`
4. `docs/GRAMMAR.md`

## Audience

Primary:

- solo developers and small teams writing serious specs before coding

Not optimized for:

- enterprise requirements management workflows
- formal verification use cases requiring mathematical proofs

