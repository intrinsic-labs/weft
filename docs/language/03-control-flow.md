# Control Flow

Weft supports common control flow patterns with familiar variants from popular languages. Write using the syntax you're most comfortable with—all variants are valid.

## Supported Keywords

Weft accepts multiple keyword variants for control flow:

**Conditionals:**
- `if`, `else`, `elif`, `else if`

**Loops:**
- `for`, `in`, `while`

**Loop Control:**
- `break`, `continue`, `return`

**Pattern Matching:**
- `switch`, `case`, `default`, `match`, `=>`, `_`

All variants are equivalent and communicate the same underlying intent. Below are details and examples on each category.

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

## See Also

- [Functions](04-functions.md) - Function declarations and async/await
- [Operators](05-operators.md) - Boolean and comparison operators
- [Error Handling](06-error-handling.md) - Try/catch blocks
