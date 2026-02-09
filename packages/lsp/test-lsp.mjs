#!/usr/bin/env node

/**
 * Manual LSP test script.
 * Tests the Weft LSP server by sending JSON-RPC messages directly.
 *
 * Usage: node test-lsp.mjs
 */

import { spawn } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, "dist", "server.js");

console.log("=== Weft LSP Manual Test ===\n");
console.log(`Server path: ${serverPath}`);
console.log(`Log file: /tmp/weft-lsp.log\n`);

// Spawn the LSP server
const server = spawn("node", [serverPath, "--stdio"], {
  stdio: ["pipe", "pipe", "inherit"],
});

let messageId = 0;
let buffer = "";

// Parse incoming LSP messages
server.stdout.on("data", (data) => {
  buffer += data.toString();

  // Parse Content-Length header and extract messages
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) break;

    const header = buffer.slice(0, headerEnd);
    const match = header.match(/Content-Length: (\d+)/);
    if (!match) break;

    const contentLength = parseInt(match[1], 10);
    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + contentLength;

    if (buffer.length < messageEnd) break;

    const message = buffer.slice(messageStart, messageEnd);
    buffer = buffer.slice(messageEnd);

    try {
      const json = JSON.parse(message);
      console.log("<<< Response:", JSON.stringify(json, null, 2).slice(0, 500));

      // Handle initialize response
      if (json.id === 1) {
        console.log("\n✓ Initialize successful!\n");
        sendInitialized();
        setTimeout(() => sendDidOpen(), 100);
      }

      // Handle diagnostics
      if (json.method === "textDocument/publishDiagnostics") {
        console.log(`\n✓ Received ${json.params.diagnostics.length} diagnostics`);
        if (json.params.diagnostics.length > 0) {
          console.log("  Diagnostics:", json.params.diagnostics.map(d => d.message).join(", "));
        }
        setTimeout(() => {
          console.log("\n=== Test Complete ===");
          console.log("Check /tmp/weft-lsp.log for detailed server logs\n");
          server.kill();
          process.exit(0);
        }, 500);
      }
    } catch (e) {
      console.error("Failed to parse:", message.slice(0, 200));
    }
  }
});

server.on("error", (err) => {
  console.error("Server error:", err);
});

server.on("exit", (code) => {
  console.log(`Server exited with code ${code}`);
});

function send(message) {
  const json = JSON.stringify(message);
  const packet = `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`;
  console.log(">>> Sending:", message.method || `response ${message.id}`);
  server.stdin.write(packet);
}

function sendInitialize() {
  send({
    jsonrpc: "2.0",
    id: ++messageId,
    method: "initialize",
    params: {
      processId: process.pid,
      clientInfo: { name: "test-client", version: "1.0.0" },
      rootUri: `file://${process.cwd()}`,
      capabilities: {},
    },
  });
}

function sendInitialized() {
  send({
    jsonrpc: "2.0",
    method: "initialized",
    params: {},
  });
}

function sendDidOpen() {
  // Open a test document with an intentional error (undefined type)
  const testContent = `
type User {
  id: string
  profile: UndefinedType  // This should cause an error
}
`;

  send({
    jsonrpc: "2.0",
    method: "textDocument/didOpen",
    params: {
      textDocument: {
        uri: "file:///test.weft",
        languageId: "weft",
        version: 1,
        text: testContent,
      },
    },
  });
  console.log("\n✓ Sent didOpen with test document (contains error: UndefinedType)\n");
}

// Start the test
console.log("Starting LSP server...\n");
setTimeout(sendInitialize, 500);

// Timeout after 10 seconds
setTimeout(() => {
  console.error("\n✗ Test timed out after 10 seconds");
  server.kill();
  process.exit(1);
}, 10000);
