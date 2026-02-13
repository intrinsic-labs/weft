# Introduction to Weft

## What Weft Is

Weft is a specification language for writing software design docs that are **machine-checkable**.

Instead of free-form markdown that drifts over time, you write typed declarations plus structured annotations like `@Rule`, `@Definition`, and `@Decision`. The LSP validates consistency as you edit.

## Why This Exists

Specs usually fail from drift:

- references to renamed types
- rules that are declared but never implemented
- contradictory prose vs declarations
- architecture decisions that are lost in docs

Weft aims to catch these while you are writing, before implementation.

## What Matters Most

- Fast authoring (close to code-like syntax)
- Strong validation (type + reference + architecture checks)
- Prose support (docstrings with markdown)
- Good editor loop (LSP diagnostics in VS Code/Zed)

## Current Direction

The active product direction is in `VISION.md`.

For exact implementation status, see `docs/STATUS.md`.
