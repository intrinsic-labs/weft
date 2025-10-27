# Control Flow

Weft supports common control flow patterns with familiar variants from popular languages. Write using the syntax you're most comfortable with—all variants are valid and will be properly translated.

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

### For-In Loops

```weft
// Collection iteration
for item in collection {
    // process item
}

// Range iteration
for i in 0..10 {
    // i goes from 0 to 9 (inclusive range)
}

// Enumerated iteration
for (index, item) in items.enumerated() {
    // access both index and item
}

// Filtered iteration
for article in articles where article.isPublished {
    // only published articles
}
```

### While Loops

```weft
while condition {
    // keep going
}
```

### Loop Control

```weft
break      // exit loop
continue   // skip to next iteration
return     // exit function
```

## Switch/Match Statements

Weft supports both traditional switch statements and pattern matching syntax:

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

## Examples

### Conditional Logic

```weft
func getUserStatus(user: User) => string {
    if user.isActive && user.isPremium {
        return "Premium Active"
    } elif user.isActive {
        return "Active"
    } else {
        return "Inactive"
    }
}
```

### Collection Iteration

```weft
func calculateTotal(items: [Item]) => float {
    var total: float = 0.0
    
    for item in items {
        total += item.price
    }
    
    return total
}
```

### Filtered Iteration

```weft
func getPublishedTitles(articles: [Article]) => [string] {
    var titles: [string] = []
    
    for article in articles where article.isPublished {
        titles.append(article.title)
    }
    
    return titles
}
```

### Switch Statement

```weft
func getStatusColor(status: Status) => Color {
    switch status {
        case SUCCESS:
            return Color.green
        case ERROR:
            return Color.red
        case PENDING:
            return Color.yellow
        default:
            return Color.gray
    }
}
```

### Pattern Matching

```weft
func handleResponse(result: Result) => string {
    match result {
        SUCCESS(message) => message
        ERROR(code, message) => "Error \(code): \(message)"
        TIMEOUT => "Request timed out"
        _ => "Unknown result"
    }
}
```

## See Also

- [Functions](03-functions.md) - Function declarations and async/await
- [Operators](04-operators.md) - Boolean and comparison operators
- [Error Handling](05-error-handling.md) - Try/catch blocks