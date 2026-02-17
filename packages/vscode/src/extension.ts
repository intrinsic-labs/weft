/**
 * VSCode extension for Weft language support.
 * Thin wrapper that launches the LSP server.
 */

import * as path from "path";
import { workspace, ExtensionContext } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  // Find the LSP server from @rocketbro/weft package
  const serverModule = require.resolve("@rocketbro/weft/dist/server.js");

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "weft" }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher("**/*.weft"),
    },
  };

  client = new LanguageClient(
    "weft",
    "Weft Language Server",
    serverOptions,
    clientOptions
  );

  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
