# Error Handling

Weft provides familiar error handling patterns that translate cleanly to try/catch mechanisms in all target platforms. Handle errors gracefully to build robust applications. Weft supports standard error handling syntax. 

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

## Throwing and Propagating Errors

Use `throw` to raise an error. Functions that can throw errors should be marked with the `throws` keyword:

```weft
// Simple throwing function
func validateUser(user: User) throws {
    if user.email == null {
        throw ValidationError("Email is required")
    }

    if user.age < 18 {
        throw ValidationError("User must be 18 or older")
    }
}

// Function that throws and returns a value
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

## Best Practices

**Be specific about errors**: Use custom error types to communicate what went wrong.

**Handle errors at the appropriate level**: Don't catch errors too early if the caller should handle them.

**Always clean up resources**: Use finally blocks or defer patterns for cleanup.

**Log errors for debugging**: Even when handling errors gracefully, log them for debugging.

**Don't swallow errors silently**: Always handle or log errors.

## See Also

- [Functions](04-functions.md) - Async functions and error propagation
- [Control Flow](03-control-flow.md) - Conditional error handling
- [Types](01-types.md) - Optional types as error alternatives
