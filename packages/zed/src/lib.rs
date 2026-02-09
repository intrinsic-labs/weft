use zed_extension_api::{self as zed, Command, LanguageServerId, Result, Worktree};

/// Weft language extension for Zed.
///
/// Provides LSP support for Weft specification files via the weft-lsp server.
struct WeftExtension;

impl zed::Extension for WeftExtension {
    fn new() -> Self {
        WeftExtension
    }

    fn language_server_command(
        &mut self,
        _language_server_id: &LanguageServerId,
        worktree: &Worktree,
    ) -> Result<Command> {
        // Try to find node in the PATH
        let node_path = worktree
            .which("node")
            .ok_or_else(|| "node must be installed and in PATH".to_string())?;

        // The LSP server path - users should set this in their settings
        // or we could look for it in node_modules
        //
        // For now, we expect users to either:
        // 1. Have weft-lsp installed globally (npm install -g @weft/lsp)
        // 2. Configure the path in their Zed settings
        //
        // Try to find the server script via npx or global install
        let server_path = worktree
            .which("weft-lsp")
            .or_else(|| {
                // Try to find in common locations
                // This is a fallback - ideally users install globally
                None
            })
            .ok_or_else(|| {
                "weft-lsp not found. Install with: npm install -g @weft/lsp".to_string()
            })?;

        Ok(Command {
            command: node_path,
            args: vec![server_path, "--stdio".to_string()],
            env: Default::default(),
        })
    }
}

zed::register_extension!(WeftExtension);
