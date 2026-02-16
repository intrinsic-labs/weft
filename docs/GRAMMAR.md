# Weft Grammar

This document describes the grammar accepted by the current parser implementation (`packages/lsp/src/parser.ts`).

## 1. File Model

A `.weft` file is a sequence of declarations:

- top-level annotation declaration: `@Rule`, `@Definition`, `@Decision`, `@OpenQuestion`
- type declaration: `type|struct|data|protocol|interface`
- `service` declaration
- `enum` declaration
- `view` declaration

## 2. Lexical Notes

Comments:

- line: `// ...`
- block: `/* ... */`

Prose/doc text:

- string: `"..."` or `'...'`
- docstring: `"""..."""` or `'''...'''`

Identifiers:

- `[a-zA-Z_][a-zA-Z0-9_]*`

Primitives:

- `string`, `int`, `float`, `double`, `bool`, `date`, `datetime`, `url`, `void`, `any`

## 3. Top-Level Annotation Declarations

```ebnf
RuleDecl         = '@Rule' '(' STRING ',' Prose ')'
DefinitionDecl   = '@Definition' '(' STRING ',' Prose ')'
DecisionDecl     = '@Decision' '(' STRING ',' Prose ')'
OpenQuestionDecl = '@OpenQuestion' '(' STRING ',' Prose ')'

Prose            = STRING | DOCSTRING
```

Examples:

```weft
@Rule("verified-sender", '''Only verified senders can initiate contact.''')
@Definition("verified-user", "User with verified identity state")
```

## 4. Declaration-Level Annotations

Supported on `type|struct|data|protocol|interface|service|enum|view`:

```ebnf
TypeAnnotation = Implements
               | See
               | Role
               | Lifecycle
               | Schema
               | Boundary
               | Priority
               | Todo

Implements = '@Implements' '(' STRING ')'
See        = '@See' '(' STRING ')'
Schema     = '@Schema'
```

`@Role` values:

- `entity`, `usecase`, `repository`, `service`, `viewmodel`, `gateway`, `dto`, `adapter`

`@Lifecycle` values:

- `singleton`, `session`, `feature`, `view`

`@Boundary` values:

- canonical: `api`, `database`, `queue`, `filesystem`, `ui`, `external`
- aliases accepted by parser: `db` -> `database`, `fs` -> `filesystem`

Syntax:

```ebnf
Boundary = '@Boundary' '(' BoundaryKind (',' STRING)? ')'
```

`@Priority` values:

- canonical: `p0`, `p1`, `p2`, `p3`
- aliases accepted by parser: `critical`->`p0`, `high`->`p1`, `medium`->`p2`, `low`->`p3`

`@TODO`:

```ebnf
Todo      = '@TODO' '(' STRING (',' TodoField (',' TodoField)*)? ')'
TodoField = 'id' ':' STRING
          | 'owner' ':' STRING
          | 'due' ':' STRING
          | 'status' ':' TodoStatus
          | 'priority' ':' Priority

TodoStatus = 'open' | 'in_progress' | 'blocked' | 'done'
```

Notes:

- only summary string is required
- default status is `open`

## 5. Type/Service/Enum/View Declarations

```ebnf
TypeDecl    = TypeAnnotation* TypeKeyword IDENT '{' Docstring? Member* '}'
TypeKeyword = 'type' | 'struct' | 'data' | 'protocol' | 'interface'

ServiceDecl = TypeAnnotation* 'service' IDENT '{' Docstring? Method* '}'
EnumDecl    = TypeAnnotation* 'enum' IDENT '{' Docstring? EnumCase* '}'
ViewDecl    = TypeAnnotation* 'view' IDENT '{' Docstring? Member* '}'
```

Members:

```ebnf
Member   = Docstring? Field | Docstring? Method
Field    = FieldAnnotation* IDENT ':' Type FieldDefault?
Method   = ('func' | 'fn' | 'function')? IDENT '(' Params? ')' ReturnType? ThrowsClause?

Params   = Param (',' Param)*
Param    = IDENT ':' Type ParamDefault?

ReturnType   = '->' Type
ThrowsClause = 'throws' Type?
```

Field annotations:

- `@Id` or `@Id(generated)`
- `@Unique`
- `@Index`
- `@Required`

Enum cases:

```ebnf
EnumCase = Docstring? IDENT ('(' Params? ')')?
```

## 6. Type Expressions

```ebnf
Type         = BaseType '?'?
BaseType     = Primitive | IDENT | ArrayType | DictionaryType
ArrayType    = '[' Type ']'
DictionaryType = '[' Type ':' Type ']'
```

Examples:

```weft
name: string
owner: User
items: [Message]
metadata: [string: any]
deletedAt: datetime?
```

## 7. Default Values / Literals

```ebnf
Literal = STRING | NUMBER | 'true' | 'false' | 'null' | ArrayLiteral
ArrayLiteral = '[' (Literal (',' Literal)*)? ']'
```

Examples:

```weft
isEnabled: bool = true
retries: int = 3
tags: [string] = ["a", "b"]
```

## 8. Prose Reference Forms (Analyzer)

The analyzer scans prose/docstrings for:

- `@Rule("...")`
- `@Definition("...")`
- `@Decision("...")`
- `@OpenQuestion("...")`
- `` `TypeName` ``
- `` `TypeName.fieldName` ``

## 9. Explicit Non-Goals (Current)

Not part of current grammar/runtime behavior:

- imports/module declarations
- executable control flow/function bodies
- full expression language
- planned-but-unimplemented annotations: `@Constraint`, `@Example`, `@Assumption`
