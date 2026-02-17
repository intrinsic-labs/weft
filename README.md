# Weft

Weft is a spec language and toolchain for teams that want clearer system design docs without giving up velocity.

It sits between two extremes:
- plain markdown specs that are easy to write but hard to keep consistent
- heavyweight modeling/formal tools that are powerful but often too costly for day-to-day product work

With Weft, you write `.weft` files and get fast feedback from the CLI and editor diagnostics when references, rules, or architecture constraints drift.

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
