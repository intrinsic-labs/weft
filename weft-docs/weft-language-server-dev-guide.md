# Weft Language Server Development Guide 🚀

A comprehensive **MVP setup guide** for building a modern, forgiving pseudocode language server with TypeScript and VS Code. This guide provides the foundation for a language server that will eventually become a bridge between human thinking and machine execution through LLM integration.

## Project Vision & Context

**Weft's Mission**: Create a pseudocode language that separates logical thinking from syntactic constraints, enabling seamless human-AI collaborative programming.

### Long-term Vision
- **LLM-powered "compiler"** that validates logic rather than syntax
- **Bidirectional translation** between Weft and any target programming language
- **Cross-IDE support** for universal adoption
- **Logic validation** that catches algorithmic errors, not just syntax mistakes
- **Natural language programming** that feels more like conversation than coding

### This Guide's Scope
This is an **MVP implementation guide** focused on:
- Basic language server infrastructure
- Forgiving syntax handling
- Intelligent completion system
- Scaffolding for future LLM integration

**Not covered here**: Full LLM integration, complex semantic analysis, or production deployment patterns.

## Philosophy & Design Principles

**Core Principle**: Weft prioritizes developer experience and flexibility over rigid syntax enforcement. We're building a language server that:

- **Rarely throws errors** - Pseudocode should be forgiving and flexible
- **Supports multiple paradigms** - Users can write in their preferred style  
- **Emphasizes warnings over errors** - Guide users, don't block them
- **Provides intelligent snippets** - Hardcoded patterns for common use cases
- **Prepares for LLM integration** - Architecture that supports AI-powered features

## Prerequisites & Modern Setup

### Required Tools (2024 Stack)
```bash
# Node.js 20+ (required for --watch and modern features)
node --version  # Should be >= 20.6.0

# Package managers
npm --version
# OR use modern alternatives
pnpm --version
bun --version
```

### Project Scaffolding
Use the official VS Code extension generator for the most modern setup:

```bash
# Install scaffolding tools
npm install -g yo generator-code

# Generate language server extension
yo code

# Choose:
# ? What type of extension do you want to create? New Language Support
# ? Language id: weft
# ? Language name: Weft  
# ? File extensions: .weft
# ? Scope names: source.weft
```

## Project Architecture

### Folder Structure
```
weft-language-server/
├── client/                 # VS Code extension (TypeScript)
│   ├── src/extension.ts   # Extension entry point
│   └── package.json       # Client dependencies
├── server/                 # Language server (TypeScript) 
│   ├── src/server.ts      # Server logic
│   └── package.json       # Server dependencies
├── shared/                 # Shared utilities
│   ├── types.ts          # Common interfaces
│   └── constants.ts      # Keyword definitions
└── snippets/              # Code snippet definitions
    └── weft.json         # Hardcoded snippet library
```

### Modern Dependencies Setup
```bash
# Server dependencies (latest 2024 versions)
cd server
npm install vscode-languageserver@^9.0.0 vscode-languageserver-textdocument@^1.0.11

# Client dependencies  
cd ../client
npm install vscode-languageclient@^9.0.0

# Development dependencies (both)
npm install -D @types/node typescript@^5.5.0 esbuild
```

## Core Language Server Implementation

### 1. Flexible Keyword Matching
Support multiple keywords for the same functionality to accommodate different programming backgrounds:

```weft
// In shared/constants.ts
const FUNCTION_KEYWORDS = ['function', 'func', 'fun', 'def', 'method']
const VARIABLE_KEYWORDS = ['var', 'let', 'set', 'const']
const LOOP_KEYWORDS = ['for each', 'for', 'forEach', 'iterate', 'repeat']

function matchKeyword(input, keywordGroup) {
    // Fuzzy matching for user flexibility
    return keywordGroup.find(keyword => 
        input.toLowerCase().includes(keyword.toLowerCase())
    )
}
```

### 2. Forgiving Parser Design
Focus on **warnings** rather than **errors**:

```weft
// In server/src/parser.ts  
function parseFunction(text) {
    var issues = empty list
    var hasOpeningKeyword = false
    var hasClosingKeyword = false
    
    // Check for function start
    if text contains any FUNCTION_KEYWORDS then
        set hasOpeningKeyword to true
    endif
    
    // Multiple closing options supported
    if text contains 'endfunction' or text contains '}' or hasProperIndentation then
        set hasClosingKeyword to true
    endif
    
    // Generate warnings, not errors
    if hasOpeningKeyword and not hasClosingKeyword then
        add "Consider adding 'endfunction' or closing with proper indentation" to issues
    endif
    
    return { ast: buildAST(text), warnings: issues }
}
```

### 3. Multi-Paradigm Scope Detection
Support three scope definition styles:

```weft
// Scope detection utility
function detectScopeStyle(text) {
    if text contains '{' and text contains '}' then
        return 'braces'
    else if text contains 'end' keywords then  
        return 'keywords'
    else if lines have consistent indentation then
        return 'indentation'
    else
        return 'mixed'  // Allow combinations
    endif
}
```

### 4. Intelligent Code Snippets
Hardcoded patterns for common scenarios:

```json
// snippets/weft.json
{
  "API Call Pattern": {
    "prefix": ["api", "fetch", "call"],
    "body": [
      "async function ${1:fetchData}(${2:params})",
      "    try",
      "        var response to await call ${3:apiEndpoint} with ${2:params}",
      "        if response.status equals 'success' then",
      "            return response.data", 
      "        else",
      "            throw 'API call failed: ' + response.message",
      "        endif",
      "    catch error",
      "        log 'Error in ${1:fetchData}: ' + error",
      "        return null",
      "    endtry",
      "endfunction"
    ],
    "description": "Standard async API call pattern"
  },
  
  "Data Processing Loop": {
    "prefix": ["process", "loop", "iterate"],
    "body": [
      "var ${1:results} to empty list",
      "for each ${2:item} in ${3:collection}",
      "    if ${2:item}.${4:property} ${5|is,equals,greater than,contains|} ${6:condition} then",
      "        add ${7:processedItem} to ${1:results}",
      "    endif",
      "endfor",
      "return ${1:results}"
    ],
    "description": "Standard data processing pattern"
  }
}
```

## Language Server Core Features

### 1. Document Synchronization
Use the modern vscode-languageserver approach for efficient document handling:

```weft
// server.ts core structure
function initializeServer() {
    var connection to createConnection()
    var documents to new TextDocuments()
    
    // Document change handler - very forgiving
    call documents.onDidChangeContent with function(change) {
        var diagnostics to validateDocument(change.document)
        call connection.sendDiagnostics with diagnostics
    }
    
    return { connection, documents }
}
```

### 2. Completion Provider
Smart autocomplete based on context:

```weft
function provideCompletions(params) {
    var currentLine to getCurrentLine(params)
    var suggestions to empty list
    
    // Keyword suggestions
    if currentLine is empty or currentLine contains partial keyword then
        add ALL_KEYWORDS to suggestions
    endif
    
    // Snippet suggestions  
    if currentLine contains snippet trigger then
        add matchingSnippets to suggestions
    endif
    
    // Variable suggestions
    if currentLine contains variable reference then
        add availableVariables to suggestions  
    endif
    
    return suggestions
}
```

### 3. Diagnostic Provider (Warnings-First)
Focus on helpful guidance rather than strict error enforcement:

```weft
function validateDocument(document) {
    var diagnostics to empty list
    var ast to parseDocument(document.text)
    
    // Check for potential issues
    for each issue in ast.warnings
        var diagnostic to create warning with
            message: issue.message,
            severity: 'Warning',  // Not 'Error'
            range: issue.location
        
        add diagnostic to diagnostics
    endfor
    
    // Only error on truly broken syntax
    for each error in ast.errors where error.severity equals 'Critical'
        add createError(error) to diagnostics
    endfor
    
    return diagnostics
}
```

## Modern Development Workflow

### TypeScript Configuration
Use modern TypeScript setup with strict mode for better code quality:

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16", 
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "out"]
}
```

### Development Scripts
```json
// package.json scripts
{
  "scripts": {
    "build": "tsc -b",
    "watch": "tsc -b -w",
    "dev": "node --watch --env-file=.env out/server.js",
    "test": "node --test",
    "lint": "eslint src --ext ts"
  }
}
```

## Testing Strategy

### Unit Testing Approach
Focus on testing specific language server functionalities in isolation:

```weft
// tests/parser.test.ts
function testFlexibleKeywords() {
    var testCases to [
        'function test()', 
        'func test()', 
        'fun test()',
        'def test()'
    ]
    
    for each testCase in testCases
        var result to parseFunction(testCase)
        assert result.type equals 'function'
        assert result.warnings.length equals 0
    endfor
}

function testScopeDetection() {
    var bracesStyle to 'function test() { return true }'
    var keywordStyle to 'function test() return true endfunction'
    var indentStyle to 'function test():\n    return true'
    
    assert detectScopeStyle(bracesStyle) equals 'braces'
    assert detectScopeStyle(keywordStyle) equals 'keywords' 
    assert detectScopeStyle(indentStyle) equals 'indentation'
}
```

### End-to-End Testing
Test the full language server integration:

```weft
// tests/integration.test.ts
async function testCompletionFlow() {
    var client to createTestClient()
    await client.start()
    
    var document to openTestDocument('test.weft')
    var position to { line: 0, character: 3 }
    
    var completions to await client.sendCompletion(document, position)
    
    assert completions contains 'function'
    assert completions contains 'var'
    assert completions.length is greater than 10
    
    await client.stop()
}
```

## Next Steps & Extensions

### Phase 1: Core MVP
1. **Basic parsing** with flexible keyword support
2. **Warning-based diagnostics** 
3. **Snippet completion** for common patterns
4. **Multiple scope style support**

### Phase 2: Intelligence Layer
1. **Variable tracking** across scopes
2. **Type inference** for better suggestions
3. **Cross-reference support** (go-to-definition)
4. **Semantic validation** beyond syntax

### Phase 3: LLM Integration (Future)
1. **Local model integration** via Ollama/LM Studio
2. **Logic validation** ("This loop might not terminate")  
3. **Code translation** (Weft ↔ TypeScript/Python/etc.)
4. **Intent analysis** ("Did you mean to sort ascending?")
5. **Performance suggestions** ("This could be optimized with a hash map")
6. **Natural language debugging** ("Explain why this function isn't working")

## Deployment & Distribution

### VS Code Marketplace
Package and publish using modern bundling practices:

```bash
# Install packaging tools
npm install -g vsce

# Bundle for performance
npm run build:production

# Package extension
vsce package

# Publish to marketplace  
vsce publish
```

### Local Development
```bash
# Install locally for testing
code --install-extension weft-language-server-0.1.0.vsix

# Or run development host
npm run watch
# F5 in VS Code to launch Extension Development Host
```

---

## Key Success Metrics

1. **Zero blocking errors** for valid pseudocode patterns
2. **Sub-100ms completion responses** for snippet triggers  
3. **Support for 3+ coding style paradigms** simultaneously
4. **Helpful warnings** that guide without frustrating

The goal is creating a language server that feels more like a **collaborative coding partner** than a strict syntax enforcer. By focusing on developer experience and gradual enhancement rather than rigid rules, Weft can become the bridge between human thinking and machine execution.

**Remember**: Start with the basics, iterate based on real usage, and always prioritize the developer's creative flow over perfect syntax compliance.