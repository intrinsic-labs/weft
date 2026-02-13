# Weft Grammar Specification

This document defines the formal grammar for Weft, a structured specification language.

## Design Principles

1. **Familiar syntax** - Looks like TypeScript/Swift, minimal learning curve
2. **Unambiguous** - No context-dependent parsing
3. **Permissive with whitespace** - Indentation is not significant
4. **Markdown inside prose** - Triple-quoted strings are opaque to the parser

---

## Lexical Grammar

### Keywords

```
type, struct, data, enum, protocol, interface, service, view
func, fn, function
var, let, const
true, false, null
async, throws
```

### Annotation Keywords

```
@Rule, @Definition, @Decision, @OpenQuestion
@Implements, @See, @Role, @Lifecycle, @Schema, @Boundary, @Priority, @TODO
```

Planned but not parsed yet:

```
@Constraint, @Example, @Assumption
```

### Primitives

```
string, int, float, double, bool, date, datetime, url, void, any
```

### Operators & Punctuation

```
:   Type annotation
?   Optional type
->  Return type
[]  Array type
{}  Block delimiters
()  Parameter list
,   Separator
=   Default value
```

### Literals

```
STRING        = '"' [^"]* '"' | "'" [^']* "'"
DOCSTRING     = '"""' .* '"""' | "'''" .* "'''"
NUMBER        = [0-9]+ ('.' [0-9]+)?
BOOLEAN       = 'true' | 'false'
IDENTIFIER    = [a-zA-Z_][a-zA-Z0-9_]*
```

### Comments

```
LINE_COMMENT  = '//' .* '\n'
BLOCK_COMMENT = '/*' .* '*/'
```

### Whitespace

Whitespace (spaces, tabs, newlines) is ignored except as token separator.

---

## Syntactic Grammar

### Document

A Weft file is a sequence of top-level declarations.

```ebnf
Document        = Declaration*

Declaration     = Annotation
                | TypeDeclaration
                | ServiceDeclaration
                | EnumDeclaration
```

### Annotations

Annotations are top-level or attached to declarations.

```ebnf
Annotation      = RuleAnnotation
                | DefinitionAnnotation
                | DecisionAnnotation
                | OpenQuestionAnnotation
                | ImplementsAnnotation
                | SeeAnnotation
                | RoleAnnotation
                | LifecycleAnnotation
                | SchemaAnnotation
                | BoundaryAnnotation
                | PriorityAnnotation
                | TodoAnnotation

RuleAnnotation        = '@Rule' '(' STRING ',' Prose ')'
DefinitionAnnotation  = '@Definition' '(' STRING ',' Prose ')'
DecisionAnnotation    = '@Decision' '(' STRING ',' Prose ')'
OpenQuestionAnnotation = '@OpenQuestion' '(' STRING ',' Prose ')'

ImplementsAnnotation  = '@Implements' '(' STRING ')'
SeeAnnotation         = '@See' '(' STRING ')'
RoleAnnotation        = '@Role' '(' IDENTIFIER ')'
LifecycleAnnotation   = '@Lifecycle' '(' IDENTIFIER ')'
SchemaAnnotation      = '@Schema'
BoundaryAnnotation    = '@Boundary' '(' IDENTIFIER (',' STRING)? ')'
PriorityAnnotation    = '@Priority' '(' IDENTIFIER ')'
TodoAnnotation        = '@TODO' '(' STRING (',' TodoField (',' TodoField)*)? ')'
TodoField             = 'id' ':' STRING
                      | 'owner' ':' STRING
                      | 'due' ':' STRING
                      | 'status' ':' IDENTIFIER
                      | 'priority' ':' IDENTIFIER

Prose           = DOCSTRING | STRING
```

**Examples:**

```weft
@Rule("verification-required", '''
All social features require verified users.
''')

@Definition("soft-delete", "Records are never physically deleted.")

@Implements("verification-required")
service Messaging { ... }
```

### Type Declarations

```ebnf
TypeDeclaration = TypeAnnotation* TypeKeyword IDENTIFIER TypeBody

TypeKeyword     = 'type' | 'struct' | 'data' | 'protocol' | 'interface'

TypeAnnotation  = ImplementsAnnotation
                | SeeAnnotation
                | RoleAnnotation
                | LifecycleAnnotation
                | SchemaAnnotation
                | BoundaryAnnotation
                | PriorityAnnotation
                | TodoAnnotation

TypeBody        = '{' Docstring? Member* '}'

Member          = Docstring? Field
                | Docstring? Method

Field           = IDENTIFIER ':' Type FieldDefault?
FieldDefault    = '=' Literal

Method          = 'func'? IDENTIFIER '(' Parameters? ')' ReturnType? ThrowsClause?

Parameters      = Parameter (',' Parameter)*
Parameter       = IDENTIFIER ':' Type ParameterDefault?
ParameterDefault = '=' Literal

ReturnType      = '->' Type
ThrowsClause    = 'throws' Type?
```

**Examples:**

```weft
type User {
    """
    Core identity in the system.
    """

    id: string
    email: string
    isVerified: bool = false
    profile: UserProfile?
    roles: [Role]

    func hasRole(role: Role) -> bool
}

protocol Repository {
    func findById(id: string) -> Entity?
    func save(entity: Entity) throws
}
```

### Service Declarations

Services are like types but semantically represent behavior groupings.

```ebnf
ServiceDeclaration = TypeAnnotation* 'service' IDENTIFIER ServiceBody

ServiceBody     = '{' Docstring? ServiceMember* '}'

ServiceMember   = Docstring? Method
```

**Examples:**

```weft
@Implements("verification-required")
service Messaging {
    """
    Handles user-to-user messaging.
    """

    func sendMessage(sender: User, recipient: User, content: string) -> Message throws
    func getConversation(userA: User, userB: User) -> [Message]
}
```

### Enum Declarations

```ebnf
EnumDeclaration = 'enum' IDENTIFIER EnumBody

EnumBody        = '{' Docstring? EnumCase* '}'

EnumCase        = Docstring? IDENTIFIER EnumAssociatedValues?

EnumAssociatedValues = '(' Parameters ')'
```

**Examples:**

```weft
enum TransactionStatus {
    """
    Possible states for a financial transaction.
    """

    pending
    processing
    completed
    failed(reason: string)
    refunded(amount: int, reason: string)
}
```

### View Declarations

Views represent UI components (for specs that include UI).

```ebnf
ViewDeclaration = 'view' IDENTIFIER ViewBody

ViewBody        = '{' Docstring? ViewMember* '}'

ViewMember      = Docstring? Field
                | Docstring? Method
```

**Examples:**

```weft
view UserProfile {
    """
    Displays user profile information with edit capability.
    """

    user: User
    isEditing: bool = false

    func onSave()
    func onCancel()
}
```

### Types

```ebnf
Type            = PrimitiveType
                | IDENTIFIER
                | ArrayType
                | DictionaryType
                | OptionalType

PrimitiveType   = 'string' | 'int' | 'float' | 'double' | 'bool'
                | 'date' | 'datetime' | 'url' | 'void' | 'any'

ArrayType       = '[' Type ']'
DictionaryType  = '[' Type ':' Type ']'
OptionalType    = Type '?'
```

**Examples:**

```weft
id: string
count: int
tags: [string]
metadata: [string: any]
deletedAt: datetime?
```

### Docstrings

Docstrings are triple-quoted strings containing markdown. They attach to the next declaration or member.

```ebnf
Docstring       = '"""' MarkdownContent '"""'
                | "'''" MarkdownContent "'''"

MarkdownContent = <opaque - passed through to LSP>
```

The parser treats docstring content as opaque. Markdown parsing happens in the LSP for cross-reference extraction.

**Examples:**

```weft
type Transaction {
    """
    Represents a financial transaction.

    ## Invariants
    - Amount is always in cents
    - Status follows: pending -> processing -> complete|failed

    ## Related
    See @Rule("transaction-immutability")
    """

    id: string
    amount: int
}
```

### Literals

```ebnf
Literal         = STRING
                | NUMBER
                | BOOLEAN
                | 'null'
                | ArrayLiteral

ArrayLiteral    = '[' (Literal (',' Literal)*)? ']'
```

---

## Reference Syntax

Within docstrings and prose, special syntax denotes references:

```
@Rule("rule-id")           Reference to a rule
@Definition("term")        Reference to a definition
@Decision("decision-id")   Reference to a decision

`TypeName`                 Reference to a type
`field.path`               Reference to a field path
```

The LSP parses these from docstring content for validation.

---

## File Extension

Weft files use the `.weft` extension.

```
user.weft
workflow-annotations.weft
types/core.weft
```

---

## Example: Complete Specification

```weft
// ============================================
// Domain Definitions
// ============================================

@Definition("verified-user", '''
A user who has completed email verification.
Represented by `User.isVerified == true`.
Required for all social features.
''')

@Definition("soft-delete", '''
Records are marked deleted but not removed.
All entities have `deletedAt: datetime?` field.
''')

// ============================================
// Rules
// ============================================

@Rule("verification-required", '''
All social features require `user.isVerified == true`.
No exceptions, including admin users.

**Affected services:**
- `Messaging`
- `Comments`
- `Follows`
''')

@Rule("idempotency", '''
All write operations must be idempotent.
Client provides idempotency key, valid for 24 hours.
''')

// ============================================
// Decisions
// ============================================

@Decision("use-cents", '''
Store monetary amounts as integers (cents).

**Considered:** float, decimal, integer
**Chose:** integer cents for cross-platform precision
''')

// ============================================
// Open Questions
// ============================================

@OpenQuestion("rate-limiting", '''
How should we rate limit API endpoints?

**Options:**
1. Per-user token bucket
2. Per-endpoint sliding window

**Decide by:** Sprint 4
''')

// ============================================
// Types
// ============================================

type User {
    """
    Core identity in the system.
    See @Definition("verified-user") for verification rules.
    """

    id: string
    email: string
    isVerified: bool = false
    createdAt: datetime
    deletedAt: datetime?
}

type Message {
    """
    A message between two users.
    """

    id: string
    sender: User
    recipient: User
    content: string
    sentAt: datetime
}

enum TransactionStatus {
    pending
    processing
    completed
    failed(reason: string)
}

// ============================================
// Services
// ============================================

@Implements("verification-required")
@Implements("idempotency")
service Messaging {
    """
    Handles all user-to-user messaging.
    Requires verified users per @Rule("verification-required").
    """

    func sendMessage(sender: User, recipient: User, content: string) -> Message throws
    func getConversation(userA: User, userB: User, limit: int = 50) -> [Message]
    func markAsRead(messageId: string) throws
}

// ============================================
// Views
// ============================================

view ConversationScreen {
    """
    Displays a conversation between two users.
    """

    currentUser: User
    otherUser: User
    messages: [Message]
    draftMessage: string = ""

    func onSend()
    func onLoadMore()
}
```

---

## Grammar Summary

| Construct | Syntax |
|-----------|--------|
| Type | `type Name { fields... }` |
| Protocol | `protocol Name { methods... }` |
| Service | `service Name { methods... }` |
| Enum | `enum Name { cases... }` |
| View | `view Name { fields, methods... }` |
| Field | `name: Type = default?` |
| Method | `func name(params) -> Return throws?` |
| Docstring | `""" markdown """` |
| Rule | `@Rule("id", '''prose''')` |
| Definition | `@Definition("term", '''prose''')` |
| Decision | `@Decision("id", '''prose''')` |
| Open Question | `@OpenQuestion("id", '''prose''')` |
| Implements | `@Implements("rule-id")` |

---

## Differences from Original Weft

This grammar is intentionally simpler than the original Weft pseudocode language:

| Original Weft | Spec Weft |
|---------------|-----------|
| Multiple syntax styles (let/const/var/val) | Single style per construct |
| Function bodies with control flow | Signatures only |
| Full expression language | Literals only |
| Code generation target | Validation only |
| UI component trees | UI type declarations |

The goal is a minimal grammar that supports structured specifications, not a programming language.
