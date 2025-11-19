# Definitions

Weft provides multiple keywords to define types and structures. Use whichever feels most natural for your context—Weft's flexible syntax accepts various approaches, and the translator will use context and annotations to implement correctly for the target platform.

## Overview

Weft supports five primary definition keywords:

- **`type`** - General-purpose, flexible type definition
- **`class`** - Complex types with inheritance, state management, reference semantics
- **`struct`** - Data-centric types with helper methods, value semantics
- **`data`** - Pure data containers
- **`object`** - Stateless constant containers

Each keyword communicates different intent about how the type should be used and implemented.

## Type Keyword

The `type` keyword is a general-purpose definition that gives maximum flexibility to the translator.

```weft
type Article {
    var id: string
    var title: string
    var content: string
    var publishedDate: datetime
}
```

**Use `type` when:**
- You're rapidly prototyping and implementation details don't matter yet
- The best implementation truly depends on platform characteristics
- You need maximum flexibility for the translator to decide

**Prefer specific keywords:** While `type` provides flexibility, using `class`, `struct`, `data`, or `object` communicates clearer intent about how the type should behave. Reach for `type` only when you genuinely want the translator to decide the best implementation approach.

The translator chooses the best platform-specific implementation based on usage patterns and context.

## Class Keyword

The `class` keyword indicates complex types with inheritance, state management, reference semantics, etc.

```weft
class ArticleManager {
    private var cache: [Article] = []
    private var apiClient: APIClient

    func fetchArticles() async => [Article] {
        if cache.isEmpty {
            cache = await apiClient.fetchArticles()
        }
        return cache
    }

    func clearCache() {
        cache = []
    }
}
```

**Use `class` when:**
- You need inheritance or polymorphism
- The type manages mutable state
- You want reference semantics (shared instances)
- You need complex lifecycle management

**Translates to:**
- **Swift**: `class` (reference type)
- **Kotlin**: `class` (reference type)
- **TypeScript**: `class`

### Inheritance

Classes support inheritance with familiar syntax:

```weft
class Vehicle {
    var speed: float

    func accelerate() {
        speed += 10
    }
}

class Car: Vehicle {
    var numberOfDoors: int

    func honk() {
        playSound("beep")
    }
}
```

## Struct Keyword

The `struct` keyword indicates data-centric types that may include convenience methods.

```weft
struct Article {
    var id: string
    var title: string
    var content: string
    var author: string

    func toDisplayFormat() => DisplayArticle {
        return DisplayArticle(
            title: title,
            author: author,
            preview: content.substring(0, 100)
        )
    }

    func isPublishable() => bool {
        return !title.isEmpty && !content.isEmpty && !author.isEmpty
    }
}
```

**Use `struct` when:**
- The primary purpose is holding data
- You want to include helper methods or computed properties
- You prefer value semantics (copies instead of references)
- You don't need inheritance

**Translates to:**
- **Swift**: `struct` (value type)
- **Kotlin**: `data class` or regular class with methods
- **TypeScript**: `interface` with separate utility functions

## Data Keyword

The `data` keyword indicates pure data containers with no custom methods. 

```weft
data ArticleMetadata {
    var id: string
    var title: string
    var author: string
    var publishedDate: datetime
    var viewCount: int
}
```

**Use `data` when:**
- The type is purely for holding data
- You don't need custom methods
- You're defining DTOs (Data Transfer Objects), API models, or similar

**Translates to:**
- **Swift**: `struct` with `Equatable`, `Hashable`
- **Kotlin**: `data class`
- **TypeScript**: `interface` or `type`

## Object Keyword

The `object` keyword defines stateless constant containers—a namespace for related immutable values. No instances can be created, and no mutable state is allowed.

```weft
object API {
    let BASE_URL = "https://api.example.com"
    let ARTICLES = BASE_URL + "/articles"
    let VIDEOS = BASE_URL + "/videos"
    let TIMEOUT = 30
}

object Colors {
    let PRIMARY = "#007AFF"
    let SECONDARY = "#5856D6"
    let ERROR = "#FF3B30"
}
```

**Use `object` when:**
- You're defining groups of related constants
- You need a namespace for immutable values
- No state will ever change

**Note:** For singletons (like repositories or services), use `@Lifecycle(singleton)` with `class`. See [Lifecycle & Scope](../architecture/04-lifecycle-scope.md) for managing object lifetimes.

**Translates to:**
- **Swift**: `enum` with static properties (no instances)
- **Kotlin**: `object` declaration
- **TypeScript**: `const` object literal

### Usage

```weft
// Access constants directly
var url = API.ARTICLES
var primaryColor = Colors.PRIMARY

// Cannot instantiate
// var api = API()  // Error: object cannot be instantiated
```

## Comparison

| Keyword | Purpose | Methods | Inheritance | Semantics |
|---------|---------|---------|-------------|-----------|
| `type` | General definition | Optional | No | Platform-specific |
| `class` | Complex behavior | Yes | Yes | Reference |
| `struct` | Data + methods | Yes | No | Value |
| `data` | Pure data | No | No | Value |
| `object` | Singleton | Yes | No | Singleton |

## See Also

- [Access Control](02-access-control.md) - Controlling visibility of members
- [Scope](03-scope.md) - Scoping with braces vs indentation
- [Imports](04-imports.md) - Importing types from other files
