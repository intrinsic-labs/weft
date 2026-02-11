use zed_extension_api::{self as zed, Command, LanguageServerId, Result, Worktree};

/// Weft language extension for Zed.
///
/// Provides LSP support for Weft specification files via the weft-lsp server.
struct WeftExtension;

const LSP_NPM_PACKAGE: &str = "@weft/lsp";
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
        // Keep the language server package installed at the latest npm version.
        let latest = zed::npm_package_latest_version(LSP_NPM_PACKAGE)?;
        let installed = zed::npm_package_installed_version(LSP_NPM_PACKAGE)?;
        if installed.as_deref() != Some(latest.as_str()) {
            zed::npm_install_package(LSP_NPM_PACKAGE, latest.as_str())?;
        }

        let server_path = worktree.which(LSP_BINARY).ok_or_else(|| {
            format!("{LSP_BINARY} was not found after installing {LSP_NPM_PACKAGE}")
        })?;

        Ok(Command {
            command: server_path,
            args: vec!["--stdio".to_string()],
            env: Default::default(),
        })
    }
}

zed::register_extension!(WeftExtension);
