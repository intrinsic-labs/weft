# @rocketbro/weft

Weft CLI and language server for machine-checkable `.weft` specification files.

Weft exists to solve spec drift: detailed markdown specs become inconsistent as systems evolve, and those mistakes are hard to catch early. `@rocketbro/weft` gives you a structured spec language plus real-time validation so references, rules, and architecture constraints stay coherent before implementation.

## Install

```bash
npm install -g @rocketbro/weft
```

This installs:

- `weft` (CLI)
- `weft-lsp` (Language Server Protocol server)

## CLI Quick Start

```bash
weft --help
weft check .
weft stats .
weft deps .
weft contract . --format json
```

## Core Commands

- `weft check [path]` validate `.weft` files
- `weft stats [path]` architecture/spec counts
- `weft coverage [path]` coverage gaps
- `weft query [path] <query> [args]` query rules/types/etc.
- `weft deps [path]` dependency graph
- `weft contract [path] [--format text|json]` implementation contract
- `weft bootstrap [path] [--target <name>] [--format text|json]`
- `weft docs query <terms...>` local docs search
- `weft agents` print Weft's built-in `AGENTS.md` guide

## Editor Integration

- VS Code extension wrapper in `packages/vscode`
- Zed extension in `packages/zed`
- Both use `weft-lsp` underneath

## Example

See:

- `examples/workflow-annotations.weft`
- `examples/wild-collab/*.weft`

## Source

- Repository: `https://github.com/rocketbro/weft`
