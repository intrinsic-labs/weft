# Control Flow & Operators

Weft supports common control flow patterns and operators with familiar variants from popular languages. Write using the syntax you're most comfortable with — all variants are valid and will be properly translated.

## Conditionals

Weft accepts multiple conditional syntax styles:

```weft
// C-style braces (Swift, Kotlin, JS)
if condition {
    // do something
} else if otherCondition {
    // do something else
} else {
    // fallback
}

// Python-style keywords (also works: elsif)
if condition {
    // do something
} elif otherCondition {
    // do something else
} else {
    // fallback
}

// With or without parentheses
if (user.isActive && user.age > 18) {
    // both work
}

if user.isActive && user.age > 18 {
    // both work
}
```

## Loops

```weft
// For-in loops (collection iteration)
for item in collection {
    // process item
}

// For-in with range
for i in 0..10 {
    // i goes from 0 to 9 (inclusive range)
}

// While loops
while condition {
    // keep going
}

// Loop control
break      // exit loop
continue   // skip to next iteration
return     // exit function
```

## Switch/Match

```weft
// Switch statements
switch value {
    case option1:
        // handle option1
    case option2:
        // handle option2
    default:
        // fallback
}

// Pattern matching style (Rust/Kotlin)
match value {
    option1 => result1
    option2 => result2
    _ => defaultResult
}
```

## Functions

Multiple function declaration styles are supported:

```weft
// Various function keywords (all work)
func fetchData() => Result { }
function fetchData() => Result { }
fn fetchData() => Result { }
def fetchData() => Result { }

// With parameters and return types
func calculateTotal(items: [Item], tax: float) => float {
    var total = 0.0
    for item in items {
        total += item.price
    }
    return total * (1 + tax)
}

// Async functions
async func fetchArticles() => [Article] {
    var articles = await apiClient.get("/articles")
    return articles
}
```

## Operators

Weft supports both symbol-based and word-based operators:

### Boolean Logic

```weft
// Use symbols or words (both valid)
if isActive && hasPermission { }
if isActive and hasPermission { }

if isAdmin || isModerator { }
if isAdmin or isModerator { }

if !isDeleted { }
if not isDeleted { }
```

### Comparison

```weft
// Standard comparison operators
==  // equal
!=  // not equal
<   // less than
>   // greater than
<=  // less than or equal
>=  // greater than or equal

// Membership
if item in collection { }
if item not in collection { }
```

### Null Safety

```weft
// Null/nil/none (all mean the same)
var value = null
var other = nil
var another = none

// Optional chaining
let title = article?.metadata?.title

// Null coalescing
let displayName = user.nickname ?? user.username ?? "Anonymous"

// Optional types
var maybeValue: string?
var definiteValue: string
```

## Error Handling

```weft
// Try-catch blocks
try {
    var data = await fetchData()
    processData(data)
} catch error {
    logError(error)
} finally {
    cleanup()
}

// Throw errors
if !isValid {
    throw ValidationError("Invalid input")
}
```

## Access Modifiers & Static Members

Control visibility of types, properties, and methods:

```weft
public var publicProperty       // accessible everywhere
private var privateProperty     // accessible only within this type
private(set) var privateSetProp // readable everywhere, writable only within this type
protected var protectedProp     // accessible in type and subclasses
internal var internalProp       // accessible within same module
```

Use `static` to define class-level (rather than instance-level) properties and methods:

```weft
class MathUtils {
    static let PI = 3.14159
    static let E = 2.71828

    static func max(a: int, b: int) => int {
        return a > b ? a : b
    }
}

// Usage: access without creating an instance
let pi = MathUtils.PI
let result = MathUtils.max(10, 20)

class User {
    static var userCount: int = 0    // shared across all instances
    var id: string                   // unique to each instance
    var name: string

    func init(name: string) {
        self.name = name
        User.userCount += 1          // increment shared counter
    }
}
```
