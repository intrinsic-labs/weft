# Variables & Enums

This guide covers variable declarations and enum definitions in Weft.

## Variable Declarations

Weft supports multiple keywords for declaring variables, allowing you to use the syntax you're most comfortable with.

### Mutable Variables

Use these keywords to declare variables whose values can be changed:

```weft
var someVariable = "initial value"
mut someMutable = 42
mutable someOtherVar = true
```

All three keywords are equivalent—use whichever feels most natural.

### Immutable Variables

Use these keywords to declare constants whose values cannot be changed after initialization:

```weft
const someConstant = "fixed value"
let someLet = 42
val someVal = true
final someFinal = "immutable"
```

All four keywords are equivalent—they all create immutable bindings.

## Type Annotations

Variables can have explicit type annotations or rely on type inference:

```weft
// Explicit type annotation
var name: string = "Alice"
var age: int = 30
var isActive: bool = true

// Type inference (type is inferred from value)
var name = "Alice"        // inferred as string
var age = 30              // inferred as int
var isActive = true       // inferred as bool

// Declaration without initialization (type required)
var name: string
var count: int
```

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

Case values are typically written in UPPERCASE, but lowercase or sentence case are also acceptable:

```weft
enum Status {
    pending,
    active,
    completed,
    cancelled
}
```

### Enums with Associated Values

Enums can carry additional data with each case:

```weft
enum Result {
    SUCCESS(message),
    ERROR(code, message),
    TIMEOUT
}

enum NetworkResponse {
    SUCCESS(data),
    ERROR(statusCode, message),
    NO_CONNECTION
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

### Enum Comparisons

```weft
var currentStatus = Status.ACTIVE

if currentStatus == Status.ACTIVE {
    // status is active
}

if currentStatus != Status.CANCELLED {
    // status is not cancelled
}
```

## Complete Examples

### User State Management

```weft
enum UserState {
    GUEST,
    AUTHENTICATED(user),
    ADMIN(user, permissions)
}

var currentState: UserState = UserState.GUEST

func updateUserState(state: UserState) {
    currentState = state
    
    match state {
        GUEST => {
            showLoginPrompt()
        }
        AUTHENTICATED(user) => {
            loadUserProfile(user)
        }
        ADMIN(user, permissions) => {
            loadAdminDashboard(user, permissions)
        }
    }
}
```

### API Response Handling

```weft
enum APIResponse<T> {
    SUCCESS(data: T),
    ERROR(statusCode: int, message: string),
    NETWORK_ERROR(message: string)
}

async func fetchArticles() => APIResponse<[Article]> {
    try {
        var response = await api.get("/articles")
        return APIResponse.SUCCESS(response.data)
    } catch error: NetworkError {
        return APIResponse.NETWORK_ERROR(error.message)
    } catch error {
        return APIResponse.ERROR(500, error.message)
    }
}

// Usage
var response = await fetchArticles()
match response {
    SUCCESS(articles) => displayArticles(articles)
    ERROR(code, message) => showError("Error \(code): \(message)")
    NETWORK_ERROR(message) => showError("Network error: \(message)")
}
```

### Form Validation

```weft
enum ValidationResult {
    VALID,
    INVALID(errors: [string])
}

func validateForm(form: RegistrationForm) => ValidationResult {
    var errors: [string] = []
    
    if form.email.isEmpty {
        errors.append("Email is required")
    }
    
    if form.password.length < 8 {
        errors.append("Password must be at least 8 characters")
    }
    
    if form.age < 18 {
        errors.append("Must be 18 or older")
    }
    
    if errors.isEmpty {
        return ValidationResult.VALID
    } else {
        return ValidationResult.INVALID(errors)
    }
}

// Usage
var result = validateForm(userForm)
match result {
    VALID => submitForm(userForm)
    INVALID(errors) => displayErrors(errors)
}
```

## Best Practices

**Use immutable variables by default**: Prefer `let`/`const` unless you need to mutate the value.

```weft
// Good: Clear that this won't change
let apiKey = "abc123"
let maxRetries = 3

// Only use var when needed
var currentAttempt = 0
currentAttempt += 1
```

**Be explicit about optionals**: Make it clear when a value can be null.

```weft
// Clear: username might be null
var username: string? = null

// Clear: email is always present
var email: string = "user@example.com"
```

**Use enums for fixed sets of values**: Instead of string constants, use enums.

```weft
// Good: Type-safe with autocomplete
enum Status { PENDING, ACTIVE, COMPLETED }
var status = Status.ACTIVE

// Avoid: Prone to typos
var status = "active"  // could be "Active", "ACTIVE", "activ", etc.
```

**Use associated values for contextual data**: When enum cases need additional information.

```weft
// Good: Error includes context
enum LoadingState {
    LOADING(progress: float),
    ERROR(message: string),
    SUCCESS(data: [Article])
}

// Less useful: No context
enum LoadingState {
    LOADING,
    ERROR,
    SUCCESS
}
```

## See Also

- [Types](01-types.md) - Type system and collections
- [Control Flow](03-control-flow.md) - Using enums in switch statements
- [Functions](04-functions.md) - Function parameters and return types