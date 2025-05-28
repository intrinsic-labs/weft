# Weft Programming Language

`STATUS: new repo, language server coming soon`

A modern pseudocode language and VS Code integration designed to bridge human-readable logic and real-world programming languages. Weft serves as an intermediate representation that enables seamless translation between human thought and machine code, facilitating **much higher bandwidth per token** coding for developers by separating concerns of syntax and logical/creative flow in software engineering.

## Overview

**Weft** is a robust, structured pseudocode language that:

* Handles real-world edge cases (async/await, memory management, declarative UI)
* Enables translation to and from real code by LLMs without ambiguity
* Supports syntax highlighting, autocompletion, type inference, and error diagnostics
* Is as fun (ideally even more fun) to develop with as your favorite languages

**Implementation:** VS Code extension with language server (TypeScript), with future support for JetBrains, Zed, Sublime, and other major IDEs.

---

## Language Philosophy

**Write however you want.** Weft is designed to accept syntax from virtually any programming language, allowing you to express logic in whatever style feels natural to you. Whether you prefer brackets `{}`, indentation-based scoping, semicolons, or natural language - Weft adapts to your thinking style.

The core principle: **focus on logic and flow, not syntax memorization.**

### Universal Syntax Support

Weft accepts and understands:
* **All comment styles** - `//`, `/* */`, `#`, `<!-- -->`, etc
* **All scoping methods** - brackets, indentation, keywords
* **All operator styles** - symbolic (`==`, `+=`) or natural language (`equals`, `add to`)
* **Mixed paradigms** - functional, object-oriented, imperative - use what fits the problem

### What You Can Express in Weft

These examples showcase Weft's versatility - not limitations. Weft can handle any coding problem:

```weft
// Declarative UI (React/SwiftUI style)
component HomePage {
    state user = fetchUser()
    render: user.loading ? LoadingSpinner() : UserProfile(user)
}

// Async operations
async function fetchUser() {
    try {
        const response = await api.get('/user')
        return response.data
    } catch error {
        log error.message
        return null
    }
}

// Database operations
query users from database 
    where active is true 
    and lastLogin > 30.days.ago
    order by createdAt desc

// Concurrent processing
parallel tasks:
    worker processImages(imageQueue)
    worker sendNotifications(userList)
    worker updateAnalytics(eventData)
```

---

## Why Weft?

**Separate logic from syntax.** Every programming language forces you to learn its specific way of expressing ideas. Weft lets you focus on *what* your program does, not *how* to write it in a particular syntax.

**Perfect for LLM collaboration.** Large language models excel at understanding and translating logical flow. By expressing your ideas in Weft, you can seamlessly translate to any target language while preserving the core logic.

**Universal understanding.** Team members, stakeholders, and collaborators can read and contribute to Weft code regardless of their programming background, because it accepts natural language alongside traditional code syntax.

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

## File Organization

Weft uses a **mirror folder structure** to keep your codebase clean while maintaining perfect synchronization between executable code and Weft logic files.

### Directory Structure
```
src/
  App.tsx
  api.ts
  components/
    Button.tsx
    Modal.tsx
.weft/
  src/
    App.weft
    api.weft
    components/
      Button.weft
      Modal.weft
```

### How It Works

**Automatic Synchronization:** The Weft compiler maintains bidirectional sync between your executable code and Weft files. Edit either version, and the other updates automatically.

**Clean File Tree:** Your main codebase stays uncluttered. The `.weft/` directory mirrors your project structure but contains only the logical flow versions of your files.

**VS Code Integration:** The extension provides UI toggles to seamlessly switch between "Code Mode" and "Weft Mode" views, letting you work in whichever representation feels right for the task at hand.

---

## Developer Tools and Commands

### Extension Features

#### View Mode Toggle
* **Code Mode** - Work with your executable files (`.tsx`, `.ts`, `.py`, etc.)
* **Weft Mode** - Work with logical flow files (`.weft`)
* **Split View** - See both representations side-by-side

#### Seamless Navigation
* Jump between corresponding files instantly
* Maintain cursor position and context when switching modes
* Visual indicators showing sync status between file pairs

#### Auto-Hide Configuration
```json
// .vscode/settings.json
{
  "files.exclude": {
    ".weft/**": true  // Hide .weft folder in Code Mode
  }
}
```

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

### Syntax Highlighting (Weft 1.0 Starting Point)

Weft recognizes and highlights syntax from all major programming languages. Write using your favorite keywords, operators, and patterns from any language you know:

**Keywords:**
- Control flow: `if`, `then`, `else`, `elif`, `endif`, `for`, `while`, `do`, `loop`, `until`, `break`, `continue`, `switch`, `case`, `when`, `match`
- Functions: `function`, `def`, `func`, `fn`, `method`, `async`, `await`, `return`, `yield`, `lambda`
- Variables: `var`, `let`, `const`, `set`, `declare`, `auto`, `mut`, `static`, `final`
- Classes/Objects: `class`, `struct`, `interface`, `trait`, `enum`, `type`, `extends`, `implements`
- Modules: `import`, `export`, `from`, `include`, `require`, `use`, `namespace`, `module`

**Operators:**
- Natural language: `is`, `equals`, `contains`, `greater than`, `less than`, `and`, `or`, `not`, `to`, `from`, `with`, `in`
- Symbolic: `==`, `!=`, `<`, `>`, `<=`, `>=`, `&&`, `||`, `!`, `+`, `-`, `*`, `/`, `%`, `=`, `+=`, `-=`, `=>`, `->`, `::`, `::`

**Types:**
- Primitives: `String`, `Number`, `Int`, `Float`, `Bool`, `Boolean`, `Char`, `Byte`
- Collections: `Array`, `List`, `Vector`, `Set`, `Map`, `Dict`, `Tuple`, `Queue`, `Stack`
- Advanced: `Promise`, `Future`, `Option`, `Maybe`, `Result`, `Either`

**Support Functions:**
- CRUD: `create`, `read`, `update`, `delete`, `insert`, `select`, `modify`, `remove`
- Operations: `add`, `subtract`, `multiply`, `divide`, `append`, `prepend`, `push`, `pop`
- I/O: `print`, `log`, `console`, `read`, `write`, `fetch`, `send`, `call`, `invoke`

**Constants:**
- Literals: `"strings"`, `'chars'`, `123`, `45.67`, `true`, `false`, `null`, `undefined`, `nil`, `None`

**Comments:**
- All styles: `//`, `/* */`, `#`, `<!-- -->`, `--`, `'''`, `"""`, `(*  *)`

### Super Versatile For Modern Programming

```weft
// API calls with mixed syntax styles
const users = await fetch("/users", { auth: token })
let results = users.filter(user => user.active is true)

// Database operations (SQL-like)
SELECT * FROM orders WHERE status == "pending" 
    AND created_at > yesterday
UPDATE inventory SET quantity -= order.amount

// State management with natural language
update user state where id equals currentUserId
set loading to false
trigger dataChanged event

// Async/concurrent operations  
parallel {
    worker processImages(queue)
    worker sendEmails(users)
    worker updateAnalytics()
}

// Event handling (multiple styles)
on button.click -> submitForm()
when user.login { redirect("/dashboard") }
if mouse.hover then showTooltip()

// Functional programming patterns
map users to user.name
filter orders where amount > 100
reduce totals with (sum, item) => sum + item.value

// Type-safe operations
function calculateTax(amount: Number) -> Number {
    return amount * 0.08
}

// Error handling across paradigms
try {
    const result = await riskyOperation()
} catch error {
    log error.message
    return fallbackValue
}
```

---

## Integration Features

### Integration Features

* **Bidirectional sync** - Automatic translation between Weft and executable code maintains perfect consistency
* **Universal auto-completion** - Context-aware suggestions work with any syntax style you prefer
* **Intelligent error detection** - Understands logical flow and catches errors regardless of syntax choice
* **Flexible code folding** - Adapts to any scoping method (brackets, indentation, keywords)
* **Multi-language translation** - Seamless conversion to and from any programming language via LLM integration
* **Live collaboration** - Team members can edit in different syntax styles while working on the same logical flow

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

## Contributing

Weft is in active development. We welcome feedback, suggestions, and contributions as we build the future of human-readable programming.

**Next Steps:**
1. Scaffold the language server
2. Define initial grammar tokens
3. Iterate on UI/UX for the extension

---

**Write logic, not syntax. Think in Weft.** 🚀
