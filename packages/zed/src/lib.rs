use zed_extension_api::{self as zed, Command, LanguageServerId, Result, Worktree};

/// Weft language extension for Zed.
///
/// Provides LSP support for Weft specification files via the weft-lsp server.
struct WeftExtension;

const LSP_NPM_PACKAGE: &str = "@rocketbro/weft";
const LSP_BINARY: &str = "weft-lsp";

impl zed::Extension for WeftExtension {
    fn new() -> Self {
        WeftExtension
    }

    fn language_server_command(
        &mut self,
        _language_server_id: &LanguageServerId,
        worktree: &Worktree,
    ) -> Result<Command> {
        // Prefer an already-installed local/global binary (dev-friendly path).
        if let Some(server_path) = worktree.which(LSP_BINARY) {
            return Ok(Command {
                command: server_path,
                args: vec!["--stdio".to_string()],
                env: Default::default(),
            });
        }

        // Fallback: try npm installation only if binary is missing.
        let latest = zed::npm_package_latest_version(LSP_NPM_PACKAGE).map_err(|err| {
            format!(
                "failed to resolve {LSP_NPM_PACKAGE}: {err}. Install `{LSP_BINARY}` manually (for local dev: `npm link --workspace=@rocketbro/weft`)."
            )
        })?;
        let installed = zed::npm_package_installed_version(LSP_NPM_PACKAGE)?;
        if installed.as_deref() != Some(latest.as_str()) {
            zed::npm_install_package(LSP_NPM_PACKAGE, latest.as_str())?;
        }

        let server_path = worktree.which(LSP_BINARY).ok_or_else(|| {
            format!(
                "{LSP_BINARY} was not found after npm install. For local development, run `npm link --workspace=@rocketbro/weft`."
            )
        })?;

        Ok(Command {
            command: server_path,
            args: vec!["--stdio".to_string()],
            env: Default::default(),
        })
    }
}

zed::register_extension!(WeftExtension);
