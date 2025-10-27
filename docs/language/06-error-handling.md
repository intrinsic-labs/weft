# Error Handling

Weft provides familiar error handling patterns that translate cleanly to try/catch mechanisms in all target platforms. Handle errors gracefully to build robust applications.

## Syntax Overview

Weft supports standard error handling syntax:

```weft
// Throwing errors
throw ErrorType("message")
throw ValidationError("Invalid input")

// Marking throwing functions
func riskyOperation() throws => Result {
    if problem {
        throw SomeError("details")
    }
    return result
}

// Try-catch blocks
try {
    // code that might throw
} catch error {
    // handle error
} catch error: SpecificError {
    // handle specific type
} finally {
    // always runs
}
```

The `throws` keyword explicitly marks functions that can throw errors, helping the LSP warn when errors aren't properly handled.

## Try-Catch-Finally

The standard error handling pattern in Weft:

```weft
try {
    // code that might throw an error
    var data = await fetchData()
    processData(data)
} catch error {
    // handle the error
    logError(error)
} finally {
    // always executes (optional)
    cleanup()
}
```

## Throwing Errors

Use `throw` to raise an error:

```weft
func validateUser(user: User) {
    if user.email == null {
        throw ValidationError("Email is required")
    }
    
    if user.age < 18 {
        throw ValidationError("User must be 18 or older")
    }
}
```

## Error Types

Define custom error types for specific error cases:

```weft
enum NetworkError {
    TIMEOUT(message),
    NO_CONNECTION(message),
    SERVER_ERROR(code, message),
    UNAUTHORIZED
}

enum ValidationError {
    MISSING_FIELD(fieldName),
    INVALID_FORMAT(fieldName, expected),
    OUT_OF_RANGE(fieldName, min, max)
}
```

## Catching Specific Errors

Handle different error types with multiple catch blocks:

```weft
try {
    var response = await api.fetchArticles()
    return response.data
} catch error: NetworkError {
    // handle network-specific errors
    if error == NetworkError.TIMEOUT {
        showMessage("Request timed out. Please try again.")
    } else {
        showMessage("Network error occurred")
    }
} catch error: ValidationError {
    // handle validation errors
    showMessage("Validation failed: \(error.message)")
} catch error {
    // catch-all for any other errors
    logError("Unexpected error: \(error)")
}
```

## Error Propagation

Functions that can throw errors should be marked with the `throws` keyword:

```weft
// Function that throws
func loadUserProfile(id: string) throws => User {
    if id.isEmpty {
        throw ValidationError("User ID cannot be empty")
    }
    
    var user = await database.getUser(id)
    
    if user == null {
        throw NotFoundError("User not found")
    }
    
    return user
}

// Caller must handle the error
try {
    var user = loadUserProfile("123")
    displayUser(user)
} catch error {
    handleError(error)
}
```

## Async Error Handling

Combine async/await with try/catch:

```weft
async func fetchAndSaveArticles() {
    try {
        // Fetch from network
        var articles = await api.fetchArticles()
        
        // Save to database
        await database.saveArticles(articles)
        
        showMessage("Articles updated successfully")
    } catch error: NetworkError {
        showMessage("Failed to fetch articles: \(error.message)")
    } catch error: DatabaseError {
        showMessage("Failed to save articles: \(error.message)")
    } catch error {
        logError("Unexpected error: \(error)")
        showMessage("An unexpected error occurred")
    } finally {
        hideLoadingIndicator()
    }
}
```

## Result Types

For operations where errors are expected, consider using a Result type:

```weft
enum Result<T> {
    SUCCESS(value: T),
    ERROR(message: string)
}

func parseJSON(json: string) => Result<Article> {
    try {
        var article = Article.fromJSON(json)
        return Result.SUCCESS(article)
    } catch error {
        return Result.ERROR(error.message)
    }
}

// Usage
var result = parseJSON(jsonString)
match result {
    SUCCESS(article) => displayArticle(article)
    ERROR(message) => showError(message)
}
```

## Optional Return Values

For simple cases, return null instead of throwing:

```weft
func findArticle(id: string) => Article? {
    for article in articles {
        if article.id == id {
            return article
        }
    }
    return null  // not found, but not an error
}

// Usage
if let article = findArticle("123") {
    displayArticle(article)
} else {
    showMessage("Article not found")
}
```

## Error Context

Provide helpful error messages with context:

```weft
func deleteArticle(id: string) async throws {
    var article = await database.getArticle(id)
    
    if article == null {
        throw NotFoundError("Cannot delete article: article with id '\(id)' not found")
    }
    
    if article.isPublished {
        throw ValidationError("Cannot delete article: article '\(article.title)' is currently published")
    }
    
    try {
        await database.deleteArticle(id)
    } catch error {
        throw DatabaseError("Failed to delete article '\(article.title)': \(error.message)")
    }
}
```

## Examples

### API Request with Error Handling

```weft
async func fetchUserProfile(userId: string) => User? {
    try {
        var response = await api.get("/users/\(userId)")
        
        if response.status == 404 {
            logInfo("User \(userId) not found")
            return null
        }
        
        if response.status != 200 {
            throw NetworkError.SERVER_ERROR(response.status, response.message)
        }
        
        return User.fromJSON(response.data)
    } catch error: NetworkError.TIMEOUT {
        logError("Request timed out for user \(userId)")
        return null
    } catch error: NetworkError.NO_CONNECTION {
        logError("No network connection")
        return null
    } catch error {
        logError("Failed to fetch user profile: \(error)")
        return null
    }
}
```

### Form Validation

```weft
func validateRegistrationForm(form: RegistrationForm) throws {
    if form.email.isEmpty {
        throw ValidationError.MISSING_FIELD("email")
    }
    
    if !form.email.contains("@") {
        throw ValidationError.INVALID_FORMAT("email", "valid email address")
    }
    
    if form.password.length < 8 {
        throw ValidationError.OUT_OF_RANGE("password", 8, 100)
    }
    
    if form.age < 13 {
        throw ValidationError.OUT_OF_RANGE("age", 13, 120)
    }
}

// Usage
try {
    validateRegistrationForm(form)
    submitRegistration(form)
} catch error: ValidationError.MISSING_FIELD(field) {
    showFieldError(field, "\(field) is required")
} catch error: ValidationError.INVALID_FORMAT(field, expected) {
    showFieldError(field, "Please enter a \(expected)")
} catch error: ValidationError.OUT_OF_RANGE(field, min, max) {
    showFieldError(field, "\(field) must be between \(min) and \(max)")
}
```

### Resource Cleanup

```weft
async func processLargeFile(path: string) {
    var file: File? = null
    
    try {
        file = await File.open(path)
        var data = await file.read()
        processData(data)
    } catch error: FileNotFoundError {
        logError("File not found: \(path)")
    } catch error: PermissionError {
        logError("Permission denied: \(path)")
    } catch error {
        logError("Error processing file: \(error)")
    } finally {
        // Always close the file, even if an error occurred
        if let file = file {
            await file.close()
        }
    }
}
```

## Best Practices

**Be specific about errors**: Use custom error types to communicate what went wrong.

```weft
// Good: Specific error types
throw NetworkError.TIMEOUT("Request exceeded 30 second limit")
throw ValidationError.INVALID_EMAIL(userInput)

// Avoid: Generic errors
throw Error("Something went wrong")
```

**Handle errors at the appropriate level**: Don't catch errors too early if the caller should handle them.

```weft
// Let the caller handle errors they care about
async func fetchData() throws => [Article] {
    return await api.fetchArticles()  // don't catch here
}

// Caller decides how to handle
try {
    var articles = await fetchData()
    displayArticles(articles)
} catch error {
    showErrorMessage(error)
}
```

**Always clean up resources**: Use finally blocks or defer patterns for cleanup.

```weft
try {
    openConnection()
    performOperation()
} finally {
    closeConnection()  // always executes
}
```

**Log errors for debugging**: Even when handling errors gracefully, log them for debugging.

```weft
try {
    performOperation()
} catch error {
    logError("Operation failed", error)  // log for debugging
    showUserMessage("Please try again")  // user-friendly message
}
```

**Don't swallow errors silently**: Always handle or log errors.

```weft
// Bad: Silent failure
try {
    riskyOperation()
} catch error {
    // nothing - error is lost
}

// Good: At minimum, log it
try {
    riskyOperation()
} catch error {
    logError("riskyOperation failed: \(error)")
}
```

## See Also

- [Functions](04-functions.md) - Async functions and error propagation
- [Control Flow](03-control-flow.md) - Conditional error handling
- [Types](01-types.md) - Optional types as error alternatives