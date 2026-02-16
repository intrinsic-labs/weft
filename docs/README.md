# Weft Docs

This directory contains the canonical documentation for the current Weft implementation.

## Read Order (Required)

1. [`STATUS.md`](STATUS.md) - exact implemented surface area
2. [`GRAMMAR.md`](GRAMMAR.md) - accepted syntax
3. [`GLOSSARY.md`](GLOSSARY.md) - term definitions
4. [`PLAYBOOK.md`](PLAYBOOK.md) - build/test/debug command workflows
5. [`getting-started/01-introduction.md`](getting-started/01-introduction.md)
6. [`getting-started/02-quick-start.md`](getting-started/02-quick-start.md)
7. [`getting-started/03-philosophy.md`](getting-started/03-philosophy.md)
8. [`ADOPTION.md`](ADOPTION.md) - using Weft outside this repo
9. [`RELEASING_NPM.md`](RELEASING_NPM.md) - npm release process

For realistic examples, read:

- [`../examples/workflow-annotations.weft`](../examples/workflow-annotations.weft)
- `../examples/wild-collab/*.weft`

## Source Of Truth Precedence

When docs and code disagree, trust in this order:

1. `packages/lsp/src/*.ts`
2. `examples/*.weft`
3. `docs/STATUS.md`
4. `docs/GRAMMAR.md`

## Scope

Weft is a **specification + validation** language.
It is not an executable programming language.

Legacy pseudocode/translation docs were removed to reduce drift and context bloat.
Use git history for historical material.
