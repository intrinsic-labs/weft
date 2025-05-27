# Weft Programming Language

`STATUS: repo pretty empty, language server coming soon`

A modern pseudocode-like language and VS Code integration designed to bridge human-readable logic and real-world programming languages. Weft serves as an intermediate representation that enables seamless translation between human thought and machine code, facilitating **much higher bandwidth per token** coding for developers by separating concerns of syntax and logical/creative flow in software engineering.

## Overview

**Weft** is a robust, structured pseudocode language that:

* Handles real-world edge cases (async/await, memory management, declarative UI)
* Enables translation to and from real code by LLMs without ambiguity
* Supports syntax highlighting, autocompletion, type inference, and error diagnostics
* Is as fun (ideally even more fun) to develop with as your favorite languages

**Implementation:** VS Code extension with language server (TypeScript), with future support for JetBrains, Zed, Sublime, and other major IDEs.

---

## Language Capabilities

Weft is designed to be the most flexible pseudocode language in existence, versatile enough to support every edge case and cover the bases of every existing executable language.

### Key Features

* **Declarative UI** (inspired by React, SwiftUI, Jetpack Compose)
* **Asynchronous code patterns** (async/await, callbacks, promises)
* **Stateful logic** (state management primitives)
* **Memory and resource management** (abstracted but hint-able)
* **Database operations** (CRUD, transactions, schemas)
* **Strong type hinting** and **interfaces**
* **Custom modules and imports**
* **Pattern matching** and **control flow constructs**

### Example Syntax

```weft
component HomePage
    state user = fetchUser()
    render:
        if user is loading then
            show LoadingSpinner()
        else
            show UserProfile(user)
        endif
endcomponent

async function fetchUser
    await get('/api/user')
endfunction
```

---

## Handling Complex Cases

| Problem | Mitigation Strategy | Example |
|---------|-------------------|---------|
| Complex async flows | Use `async function`, `await`, `try/catch`, `then`, `finally` keywords | `async function fetchUser: await get('/api/user')` |
| Declarative UI with nested state | Use `component`, `state`, `computed`, and `render:` blocks | `component HomePage: state user = fetchUser() render: ...` |
| Interop with other languages | Define clear `bindings` blocks or `import js`, `import swift` | `import js from './analytics.js' bindings TrackEvent` |
| Memory/resource management | Abstract with `allocate`, `defer`, or `release` blocks | `allocate buffer = NewBuffer() defer release(buffer)` |
| Database operations | Use `database table`, `query`, `insert`, `transaction` keywords | `database table Users { id: Int, name: String } insert Users(id: 1, name: "Alice")` |
| Recursive algorithms | Use `function`, `node`, and `recurse:` patterns | `function traverseTree(node): if node: recurse traverseTree(node.left)` |
| Graph traversal with memory constraints | Leverage `visited` state tracking and explicit `allocate/release` | `function crawlGraph(start): state visited = Set() allocate queue = Queue()` |
| Streaming I/O with transforms | Use `stream`, `transform`, and `pipe` keywords | `stream input = ReadFile('data.csv') transform clean = RemoveEmptyRows(input) pipe clean` |
| Multi-threading or concurrency | Use `parallel`, `worker`, `lock`, and `shared` keywords | `parallel workers: worker compress(files), worker upload(files)` |
| Stateful UIs reacting to DB changes | Connect `state` blocks to `query` results with `onChange:` handlers | `state users = query AllUsers onChange: refresh UI` |

---

## Development Environment

### Language Server and Extension Setup

* **VS Code** with built-in Language Server Protocol (LSP) support
* Language server written in **TypeScript** for fast development and debugging
* Future optimization in **Rust** possible if performance becomes a bottleneck

### Extension Stack

* TypeScript runtime
* Node.js
* vscode-languageclient / vscode-languageserver packages

---

## File Organization Strategies

### Goals

* Prevent clutter from pseudocode mirrors
* Enable seamless navigation between real and pseudocode
* Make the system feel elegant and scalable

### Recommended Approach: Mirror Folder + Virtual Toggle

#### Option 1: Mirror Folder Structure
```
src/
  App.tsx
  api.ts
.weft/
  src/
    App.weft
    api.weft
```

**Pros:** Keeps file tree clean, scalable  
**Cons:** Slightly more complex tooling

#### Option 2: Virtual Mode via Extension
* Toggle Weft mode hides all `.ts` files and shows `.weft` or generated views
* Requires more extension logic but provides cleanest experience

### Alternative Options

#### Adjacent Files
```
src/
  App.tsx
  App.weft
  api.ts
  api.weft
```

#### Embedded in Comments
```typescript
// WEFT_START
// Describes a dynamic component with live data
// WEFT_END
function Widget() {...}
```

---

## Developer Tools and Commands

### File Management

Hide Weft files in `.vscode/settings.json`:
```json
{
  "files.exclude": {
    "**/*.weft": true
  }
}
```

### Extension Features

#### Command Palette
* `Toggle Weft View`
* `Generate Weft from Current File`
* `Convert Weft to Real Code`

#### CodeLens Integration
* `View/Edit Weft` buttons in file headers

#### Diff View
* Visual comparison between Weft and source code

---

## Project Setup

### Bootstrap (TypeScript Extension)

1. **Install dependencies:**
```bash
npm install --save-dev vscode vscode-languageclient typescript ts-node @types/node
```

2. **Project Structure:**
```
weft-language-server/
  src/
    server.ts      # Language server entry
    weft.ts        # Parser + validator for Weft
    lsp.ts         # LSP bindings
  package.json
  tsconfig.json
  extension/
    src/
      extension.ts # VS Code client extension entry
```

3. **Compile and Test:**
```bash
npx tsc
code .
```

4. **Debug** inside VS Code with launch configuration

### Core Dependencies
* Only core LSP tooling and minimal utilities
* No framework dependencies by default

---

## Language Syntax

### Basic Structure
```weft
function calculateTotal(items, taxRate)
    var total = 0
    var taxAmount = 0
    
    for each item in items
        if item.taxable is true then
            add item.price to total
            add (item.price * taxRate) to taxAmount
        else
            add item.price to total
        endif
    endfor
    
    return total + taxAmount
endfunction
```

### Syntax Highlighting Categories (very early rn)

**Keywords** (Blue): `function`, `if`, `then`, `else`, `for`, `while`, `return`, `async`, `await`

**Actions** (Green): `add`, `remove`, `call`, `create`, `update`, `delete`, `send`, `fetch`

**Operators** (Purple): `to`, `from`, `with`, `in`, `is`, `equals`, `greater than`

**Values** (Orange): Strings, numbers, booleans

**Comments** (Gray): `//`, `/* */`

### Modern Programming Concepts
```weft
// API calls
var users = fetch "/users" with auth token

// State management  
update user state where id equals currentUserId

// Event handling
on button click
    call submitForm
end
```

---

## Integration Features

### Auto-completion
* Type "f" → suggests `for each`, `function`
* Smart suggestions based on context and variable types

### Error Highlighting
* Missing `end` statements
* Undefined variables
* Type mismatches

### Code Folding
* Collapse `if` blocks, `for` loops, `function` definitions
* Visual hierarchy for complex logic

---

## Future Roadmap

### Phase 1: Core Language Server
* Basic keyword highlighting and indentation
* Bracket matching and auto-complete

### Phase 2: Intelligence
* Natural language syntax parsing
* Type inference and validation

### Phase 3: AI Integration
* Local LLM integration via Ollama
* Bidirectional code translation
* Logic validation and verification

### Phase 4: Advanced Features
* Multi-language code generation
* Real-time collaboration
* Visual programming interface

---

## Philosophy

Weft embodies the principle that **logic should be separate from syntax**. By providing structured design thinking with real-world tooling choices, Weft optimizes for:

* **Clarity** - Express ideas without syntactic overhead
* **Speed** - Rapid prototyping and iteration
* **Collaboration** - Non-programmers can read and contribute
* **Future-ready** - AI-assisted development and translation

---

## Contributing

Weft is in active development. We welcome feedback, suggestions, and contributions as we build the future of human-readable programming.

**Next Steps:**
1. Scaffold the language server
2. Define initial grammar tokens
3. Iterate on UI/UX for the extension

---

**Write logic, not syntax. Think in Weft.** 🚀