# Variables & Enums

This guide covers variable declarations and enum definitions in Weft.

## Variable Declarations

Weft supports multiple keywords for declaring variables, allowing you to use the syntax you're most comfortable with.

### Mutable Variables

Use `var`, `mut`, or `mutable` to declare variables whose values can be changed:

```weft
var someVariable = "initial value"
mut someMutable = 42
mutable someOtherVar = true
```

All three keywords are equivalent.

### Immutable Variables

Use `const`, `let`, `val`, or `final` to declare constants whose values cannot be changed after initialization:

```weft
const someConstant = "fixed value"
let someLet = 42
val someVal = true
final someFinal = "immutable"
```

All four keywords are equivalent—they all create immutable bindings.

## Examples

### Basic Variable Usage

```weft
// Mutable variable
var counter = 0
counter += 1
counter = counter * 2

// Immutable variable
let maxAttempts = 3
// maxAttempts = 5  // Error: cannot reassign immutable variable

// Type annotations
var username: string = "user123"
var score: float = 95.5
var tags: [string] = ["swift", "kotlin", "weft"]
```

### Optional Variables

Optional types may or may not contain a value. Use the `?` suffix to declare an optional type.

```weft
var username: string?        // optional string, initially null
var age: int? = null        // explicit null assignment
var email: string? = "user@example.com"  // optional with value

// Using optional values
if let email = user.email {
    sendEmail(email)
}

var displayName = user.nickname ?? user.username ?? "Anonymous"
```

### Collections

```weft
// Arrays
var numbers: [int] = [1, 2, 3, 4, 5]
var names = ["Alice", "Bob", "Charlie"]  // inferred as [string]

// Dictionaries
var scores: [string: int] = ["Alice": 95, "Bob": 87]
var cache = [string: Article]  // empty dictionary

// Sets
var uniqueTags: Set<string> = Set(["swift", "kotlin", "weft"])
```

## Enums

Enums define a type with a fixed set of possible values. Use the `enum` keyword and comma-separate case values.

### Basic Enums

```weft
enum Status {
    PENDING,
    ACTIVE,
    COMPLETED,
    CANCELLED
}

enum Direction {
    NORTH,
    SOUTH,
    EAST,
    WEST
}
```

Case values are typically written in UPPERCASE, but lowercase or sentence case are also acceptable.

### Enums with Associated Values

Enums can carry additional data with each case:

```weft
enum Result {
    SUCCESS(message),
    ERROR(code, message),
    TIMEOUT
}

enum LoadingState {
    IDLE,
    LOADING(progress),
    SUCCESS(data),
    ERROR(message)
}
```

### Enums with Raw Values

Enums can have raw values of primitive types:

```weft
// String raw values
enum Status: string {
    PENDING = "pending",
    ACTIVE = "active",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}

// Integer raw values
enum Priority: int {
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3,
    URGENT = 4
}

// Access raw value
var status = Status.ACTIVE
var rawValue = status.rawValue  // "active"
```

## Using Enums

### Switch Statements

Enums work naturally with switch statements:

```weft
func getStatusColor(status: Status) => Color {
    switch status {
        case PENDING:
            return Color.yellow
        case ACTIVE:
            return Color.green
        case COMPLETED:
            return Color.blue
        case CANCELLED:
            return Color.red
    }
}
```

### Pattern Matching with Associated Values

```weft
func handleResult(result: Result) {
    match result {
        SUCCESS(message) => {
            showMessage(message)
        }
        ERROR(code, message) => {
            logError("Error \(code): \(message)")
            showErrorDialog(message)
        }
        TIMEOUT => {
            showMessage("Request timed out. Please try again.")
        }
    }
}
```

## Best Practices

**Use immutable variables by default**: Prefer `let`/`const` unless you need to mutate the value.

**Be explicit about optionals**: Make it clear when a value can be null.

**Use enums for fixed sets of values**: Instead of string constants, use enums.

**Use associated values for contextual data**: When enum cases need additional information.

## See Also

- [Types](01-types.md) - Type system and collections
- [Control Flow](03-control-flow.md) - Using enums in switch statements
- [Functions](04-functions.md) - Function parameters and return types
