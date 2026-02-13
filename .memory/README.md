# Weft Project Memory

This folder holds short-lived context for ongoing work. Keep it concise and current.

## Current Identity

Weft is a structured specification language for machine-checkable software specs.

Core implementation in this repo:
- `packages/lsp`: lexer/parser/analyzer, CLI, LSP server
- `packages/tree-sitter-weft`: syntax grammar + highlights
- `packages/vscode` and `packages/zed`: editor integrations
- `packages/mcp`: MCP wrapper over Weft analysis

## Source Of Truth

- Product direction: `VISION.md`
- Implemented behavior: `docs/STATUS.md`
- Language syntax: `docs/GRAMMAR.md`
- Usage and workflows: `docs/README.md`, `docs/ADOPTION.md`

When docs disagree, prefer parser/analyzer behavior and `docs/STATUS.md`.

## Notes For New Sessions

1. Run `node packages/lsp/dist/cli.js check examples/wild-collab` for a quick health check.
2. Use `examples/wild-collab` as the canonical multi-file example.
3. Treat commented-only examples as non-executable references unless reactivated.
