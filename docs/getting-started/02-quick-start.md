# Quick Start

## 1. Create a Spec File

Create `spec.weft`:

```weft
@Definition("verified-user", '''
A user with `isVerified == true`.
''')

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

## 2. Validate from CLI

Install the CLI globally first:

```bash
npm install -g @rocketbro/weft
```

Then validate:

```bash
weft check spec.weft
```

If no issues are found, the command reports success.

If you see a stale build error, rebuild and retry:

```bash
npm run build --workspace=@rocketbro/weft
weft check spec.weft
```

## 3. Validate in Editor

- Open the folder in VS Code or Zed
- Open your `.weft` file
- Fix diagnostics as you type

The LSP now resolves symbols across `.weft` files in the workspace.

## 4. Use a Real Spec

Start from `examples/workflow-annotations.weft` and adapt it to your project domain.

For command workflows and triage, use `docs/PLAYBOOK.md`.
