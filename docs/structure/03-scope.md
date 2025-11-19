# Scope

Weft supports multiple scoping styles to accommodate developers from different language backgrounds. You can use curly braces, indentation, or mix both—all approaches are valid and translate correctly.

## Curly Braces

C-style curly braces are the most common approach:

```weft
func calculateTotal(items: [Item]) => float {
    var total: float = 0.0

    for item in items {
        total += item.price
    }

    return total
}

class ArticleRepository {
    private var cache: [Article] = []

    func getArticles() => [Article] {
        if cache.isEmpty {
            cache = fetchArticles()
        }
        return cache
    }
}
```

This style is familiar to developers from Swift, Kotlin, JavaScript, Java, C#, and many other languages.

## Indentation

Python-style indentation is also supported:

```weft
def calculateTotal(items: [Item]) => float:
    var total: float = 0.0

    for item in items:
        total += item.price

    return total

class ArticleRepository:
    private var cache: [Article] = []

    def getArticles() => [Article]:
        if cache.isEmpty:
            cache = fetchArticles()
        return cache
```

Use a colon (`:`) at the end of the declaration line, then indent the body.

## Mixed Styles

You can technically mix both styles in the same file (although we recommend you pick one style and stick with it on a per-project basis) - Weft accepts whatever feels natural:

```weft
def processArticles(articles: [Article]) => [Article] {
    var results: [Article] = []

    for article in articles:
        if article.isPublished {
            results.append(article)
        }

    return results
}
```

The translator understands both styles and can parse them correctly.

## Semicolons

Semicolons are optional in Weft. Use them if you prefer, or omit them—both work:

```weft
// With semicolons
func greet(name: string) => string {
    var message = "Hello, \(name)!";
    return message;
}

// Without semicolons
func greet(name: string) => string {
    var message = "Hello, \(name)!"
    return message
}
```

## Parentheses

Parentheses around conditions are optional:

```weft
// With parentheses (C-style)
if (user.isActive && user.age >= 18) {
    grantAccess()
}

// Without parentheses (Swift/Python style)
if user.isActive && user.age >= 18 {
    grantAccess()
}

// Both work with while loops too
while (count < 10) {
    count += 1
}

while count < 10 {
    count += 1
}
```

## Block Expressions

Blocks define scope for variables:

```weft
func example() {
    var x = 10

    {
        var y = 20
        print(x)  // OK: x is in outer scope
        print(y)  // OK: y is in this scope
    }

    print(x)  // OK: x is in this scope
    // print(y)  // Error: y is not in scope
}
```

## Nested Scopes

Scopes can be nested to any depth:

```weft
class UserManager {
    func processUsers(users: [User]) {
        for user in users {
            if user.isActive {
                if user.isPremium {
                    grantPremiumAccess(user)
                } else {
                    grantBasicAccess(user)
                }
            }
        }
    }
}
```

## Best Practices

**Be consistent within a project**: While you can mix styles, it's clearer to stick to one approach per project.

**Use the style your team prefers**: Weft's flexibility means you can match your team's conventions.

**Let the LSP help**: The Weft LSP will understand both styles and provide appropriate formatting suggestions.

## See Also

- [Definitions](01-definitions.md) - Type and structure definitions
- [Control Flow](../language/03-control-flow.md) - Conditionals and loops
- [Functions](../language/04-functions.md) - Function declarations
