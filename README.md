# Weft

Weft is a spec language and toolchain for teams that want clearer system design docs without giving up velocity.

It sits between two extremes:
- plain markdown specs that are easy to write but hard to keep consistent
- heavyweight modeling/formal tools that are powerful but often too costly for day-to-day product work

With Weft, you write `.weft` files and get fast feedback from the CLI and editor diagnostics when references, rules, or architecture constraints drift.

## Status

Weft works: it installs, builds, typechecks, and passes its full test suite today, after
months with no maintenance (no feature commit since February 2026). What's changed is the
founding bet. Weft's premise was that solo/indie teams need a typed spec DSL to keep design
docs from drifting; coding agents got good enough, fast enough, that an LLM reading plain
markdown now catches most of the same drift without asking anyone to learn new syntax. It's
kept here as a working demonstration of the craft (hand-written lexer/parser/analyzer, a real
language server wired into two editors, a tree-sitter grammar, `strict` TypeScript throughout),
not as something under active pursuit
for adoption. The one piece that still has a plausible future is `@weft/mcp`: handing an
agent grounded, non-hallucinated structured facts about a spec, on demand, is a job this
toolchain is still well-suited for even in an agent-heavy world.

## Install

Install globally from npm:

```bash
npm install -g @rocketbro/weft
```

Then verify:

```bash
weft --help
```

This installs:
- `weft` (CLI)
- `weft-lsp` (language server used by editor integrations)

## Quick Start

Create a `spec.weft` file:

```weft
@Rule("verification-required", '''
Only verified users may send messages.
''')

type User {
  id: string
  isVerified: bool
}

@Implements("verification-required")
service Messaging {
  sendMessage(sender: User, content: string) -> bool
}
```

Run validation:

```bash
weft check spec.weft
```

## What Works Today

- Core declarations: `type`, `struct`, `data`, `protocol`, `interface`, `service`, `enum`, `view`
- Top-level annotations: `@Rule`, `@Definition`, `@Decision`, `@OpenQuestion`
- Validation of symbol references, prose references, and cross-file workspace analysis
- Architecture checks via `@Role` and `@Lifecycle`

## Docs

Start here:
- [Docs index](docs/README.md)
- [Current status and implemented surface](docs/STATUS.md)
- [Grammar reference](docs/GRAMMAR.md)
- [Getting started](docs/getting-started/01-introduction.md)
- [Operational playbook](docs/PLAYBOOK.md)
- [Adoption outside this repo](docs/ADOPTION.md)

Examples:
- [Workflow annotations example](examples/workflow-annotations.weft)
- [Wild collab examples directory](examples/wild-collab)

## For Agents and Contributors

- Agent-oriented repository guide: [AGENTS.md](AGENTS.md)
- Package source of truth: [packages/lsp/src](packages/lsp/src)

When docs and implementation disagree, trust implementation under `packages/lsp/src`.
