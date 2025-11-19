# Functions

Functions in Weft can be declared using multiple keywords to accommodate different language backgrounds. All variants are valid and translate to idiomatic implementations on each platform.

## Function Declaration

Weft supports several function declaration keywords and return type syntaxes:

```weft
// Various function keywords (all equivalent)
func fetchData() => Result { }
function fetchData() => Result { }
fn fetchData() => Result { }
def fetchData() => Result { }

// Various return type syntaxes (all equivalent)
func getName() => string { }        // Arrow style
func getName(): string { }          // Colon style
func getName() -> string { }        // Swift arrow style
func getName() returns string { }   // Natural language style
```

Use whichever feels most natural to you—they all mean the same thing.

## Basic Syntax

```weft
func functionName(parameter: Type) => ReturnType {
    // function body
    return value
}
```

### Parameters

Weft requires function parameters to be explicitly declared, typed, and named. 

```weft
// Single parameter
func greet(name: string) => string {
    return "Hello, \(name)!"
}

// Multiple parameters
func calculateTotal(price: float, quantity: int) => float {
    return price * quantity
}

// No parameters
func getCurrentTime() => datetime {
    return DateTime.now()
}

// Optional parameters
func greet(name: string, title: string?) => string {
    if let title = title {
        return "Hello, \(title) \(name)!"
    }
    return "Hello, \(name)!"
}
```

## Return Types

```weft
// Explicit return type
func add(a: int, b: int) => int {
    return a + b
}

// Optional return type
func findUser(id: string) => User? {
    // may return User or null
}

// No return value (void)
func logMessage(message: string) => void {
    print(message)
}

// Array return type
func getActiveUsers() => [User] {
    return users.filter(user => user.isActive)
}
```

## Async Functions

Use the `async` keyword for asynchronous functions. Call them with `await` in an async context.:

```weft
// Async function declaration
async func fetchArticles() => [Article] {
    var response = await apiClient.get("/articles")
    return response.data
}

// Async function with error handling
async func loadUserProfile(id: string) => User? {
    try {
        var user = await api.fetchUser(id)
        return user
    } catch error {
        logError(error)
        return null
    }
}

// Calling async functions (must be in async context)
async func loadData() {
    var articles = await fetchArticles()
    var user = await loadUserProfile("123")
}
```

## Function Shortcuts

### Arrow Functions

For simple single-expression functions:

```weft
// Single expression
func double(x: int) => int = x * 2

// With arrow syntax
var isEven = (x: int) => x % 2 == 0
```

### Closures/Lambdas

```weft
// Closure syntax
var numbers = [1, 2, 3, 4, 5]
var doubled = numbers.map(n => n * 2)

// Closure with 'in' keyword
var doubled = numbers.map { n in
    return n * 2
}

var filtered = items.filter { item in
    item.isActive && item.score > 50
}

// Multi-line closure
var filtered = numbers.filter(n => {
    return n > 2 && n < 5
})

// Closure with multiple parameters
var combined = items.reduce((acc, item) => {
    return acc + item.value
}, 0)
```

## Throwing Functions

Mark functions that can throw errors with the `throws` keyword:

```weft
// Function that can throw
func loadUser(id: string) throws => User {
    if id.isEmpty {
        throw ValidationError("User ID cannot be empty")
    }
    
    var user = await database.getUser(id)
    
    if user == null {
        throw NotFoundError("User not found")
    }
    
    return user
}

// Caller must handle errors
func displayUser(id: string) {
    try {
        var user = loadUser(id)
        showProfile(user)
    } catch error {
        showError(error.message)
    }
}

// Or propagate errors up
func getAndValidateUser(id: string) throws => User {
    var user = loadUser(id)  // Propagates throw
    validateUser(user)
    return user
}
```

## Access Modifiers

Functions can have access modifiers to control visibility:

```weft
public func publicFunction() => void { }        // default (implicit)
private func privateFunction() => void { }      // only within the same file/module
protected func protectedFunction() => void { }  // within class and subclasses
```

## Static Functions

Use `static` for class-level functions that don't require an instance:

```weft
class MathUtils {
    static func max(a: int, b: int) => int {
        return a > b ? a : b
    }
    
    static func min(a: int, b: int) => int {
        return a < b ? a : b
    }
}

// Usage: call without creating an instance
var maximum = MathUtils.max(10, 20)
```

## Best Practices

**Keep functions focused**: Each function should do one thing well.

**Use descriptive names**: Function names should clearly indicate what they do.

**Handle errors appropriately**: Use try/catch for operations that can fail.

## See Also

- [Control Flow](03-control-flow.md) - Conditionals and loops
- [Error Handling](06-error-handling.md) - Try/catch/throw and throws keyword
- [Operators](05-operators.md) - Operators used in functions
- [Types](01-types.md) - Parameter and return types
- [Variables & Enums](02-variables-enums.md) - Variable declarations
