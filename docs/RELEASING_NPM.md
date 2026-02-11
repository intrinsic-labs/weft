# Releasing `@weft/lsp` to npm

This project ships both:

- CLI binary: `weft`
- LSP binary: `weft-lsp`

Both are published from the `@weft/lsp` package.

## 1. Login

```bash
npm whoami
```

If not logged in:

```bash
npm login
```

## 2. Build and Test

```bash
npm run typecheck --workspace=@weft/lsp
npm run test --workspace=@weft/lsp -- --run
npm run build --workspace=@weft/lsp
```

## 3. Bump Version

```bash
npm version patch --workspace=@weft/lsp
```

Use `minor` or `major` as needed.

## 4. Publish

```bash
npm publish --workspace=@weft/lsp --access public
```

## 5. Verify

```bash
npm view @weft/lsp version
npm install -g @weft/lsp
which weft
which weft-lsp
```

## 6. Post-Release

- Push commit and tag created by `npm version`.
- Note release changes in PR/release notes.
- Reinstall/reload Weft extension in Zed to pick up latest `@weft/lsp`.

## Notes

- If `@weft/lsp` scope/package does not exist yet, create/claim scope access first.
- If publishing from CI later, use a fine-scoped npm automation token.
