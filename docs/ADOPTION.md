# Weft Adoption Guide

This guide is for testing Weft in real projects outside this repository.

For local debugging workflows inside this repo, see `docs/PLAYBOOK.md`.

## 1. Prerequisites

- Node.js 20+ (22+ recommended)
- npm
- Zed (for editor integration)

## 2. Install Weft CLI

If the package is published:

```bash
npm install -g @weft/lsp
```

Verify:

```bash
which weft
which weft-lsp
weft --help
```

## 3. Local Dev Install (From This Repository)

For local development without publishing, link the workspace package:

```bash
npm run build --workspace=@weft/lsp
npm link --workspace=@weft/lsp
```

Verify:

```bash
which weft
which weft-lsp
weft --help
```

Remove the global link later if needed:

```bash
npm unlink -g @weft/lsp
```

## 4. Use Weft in Any Project

From any project directory:

```bash
weft check
weft query rules
weft query ./domain rules
weft stats
weft coverage
weft deps
weft contract --format json
weft bootstrap --target typescript --format json
weft docs query lifecycle singleton --limit 5
```

Behavior:

- `weft check` scans `.weft` files recursively from the current directory.
- Passing a path scopes analysis to that subtree.
- Passing a file analyzes only that file.

## 5. Zed Setup (Current Recommended Path)

Until marketplace publishing is complete, use the dev extension install path:

1. Open Zed command palette.
2. Run `zed: install dev extension`.
3. Select this folder: `packages/zed`.

Then open a repository containing `.weft` files. You should get:

- syntax highlighting
- diagnostics
- hover
- completion
- go-to-definition

## 6. Suggested Real-Project Validation

Start with a small folder (3-10 files), then scale:

1. Add a few `@Rule`/`@Definition` declarations.
2. Add cross-file types/services.
3. Run `weft check` and fix diagnostics.
4. Confirm `weft query rules` and `weft deps` are useful for navigation.
5. Integrate `weft check` into CI.

## 7. CI Gate (Minimal)

```bash
weft check .
```

Treat non-zero exit as a failed spec gate.

## 8. Common Gotchas

- If `weft` reports stale build artifacts, run:
  `npm run build --workspace=@weft/lsp`
- Restarting the language server is not the same as reloading syntax queries.
  After query/grammar changes, reinstall or reload the dev extension.
- Ignore generated Zed grammar artifacts in project scans:
  `packages/zed/grammars/` should not be treated as source specs.
- Markdown syntax highlighting inside Weft docstrings is currently disabled.
  Treat docstrings as plain text for now.
