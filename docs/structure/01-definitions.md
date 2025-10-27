# Definitions

Weft provides multiple keywords to define types and structures. Use whichever feels most natural for your context—Weft's flexible syntax accepts various approaches, and the translator will use context and annotations to implement correctly for the target platform.

## Overview

Weft supports five primary definition keywords:

- **`type`** - General-purpose, flexible type definition
- **`class`** - Complex types with inheritance and state management
- **`struct`** - Data-centric types with helper methods
- **`data`** - Pure data containers (auto-generates boilerplate)
- **`object`** - Singleton instances or constant containers

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
- You want flexibility in implementation
- The translator should choose the best platform-specific approach
- You're defining a simple data model
- You don't need to specify inheritance or complex behavior

**Translates to:**
- **Swift**: `struct` (value type with automatic copying)
- **Kotlin**: `data class` (with equals, hashCode, toString)
- **TypeScript**: `interface` or `type` alias

## Class Keyword

The `class` keyword indicates complex types with inheritance, state management, and reference semantics.

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

The `data` keyword indicates pure data containers with no custom methods. The translator auto-generates boilerplate like equality, hashing, string representation, and copying.

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
- You want automatic equality and hashing
- You don't need custom methods
- You're defining DTOs (Data Transfer Objects) or API models

**Auto-generated functionality:**
- Equality comparison (`==`, `!=`)
- Hash code generation
- String representation (`toString`, `description`)
- Copy/clone functionality

**Translates to:**
- **Swift**: `struct` with `Equatable`, `Hashable`, `CustomStringConvertible`
- **Kotlin**: `data class` (auto-generates all boilerplate)
- **TypeScript**: `interface` or `type`

## Object Keyword

The `object` keyword defines singleton instances or constant containers. Only one instance exists throughout your application.

```weft
object ENDPOINTS {
    let BASE_URL = "https://api.example.com"
    let ARTICLES = BASE_URL + "/articles"
    let VIDEOS = BASE_URL + "/videos"
    let USERS = BASE_URL + "/users"
}

object Config {
    let MAX_RETRIES = 3
    let TIMEOUT_SECONDS = 30
    let API_VERSION = "v2"
}
```

**Use `object` when:**
- You need a singleton (only one instance)
- You're defining global constants
- You're creating a namespace for related values
- You want shared configuration or resources

**Translates to:**
- **Swift**: `enum` with static properties (no instances) or `class` with shared instance
- **Kotlin**: `object` (singleton)
- **TypeScript**: `const` object or singleton pattern

### Usage

```weft
// Access singleton properties
var url = ENDPOINTS.ARTICLES
var maxRetries = Config.MAX_RETRIES

// Cannot instantiate
// var config = Config()  // Error: object cannot be instantiated
```

## Comparison

| Keyword | Purpose | Methods | Inheritance | Semantics | Boilerplate |
|---------|---------|---------|-------------|-----------|-------------|
| `type` | General definition | Optional | No | Platform-specific | None |
| `class` | Complex behavior | Yes | Yes | Reference | None |
| `struct` | Data + methods | Yes | No | Value | None |
| `data` | Pure data | No | No | Value | Auto-generated |
| `object` | Singleton | Yes | No | Singleton | None |

## Examples

### API Response Model

```weft
// Pure data from API
data ArticleResponse {
    var id: string
    var title: string
    var content: string
    var author_id: string
    var published_at: string
}

// Domain model with methods
struct Article {
    var id: string
    var title: string
    var content: string
    var authorId: string
    var publishedDate: datetime
    
    static func fromResponse(response: ArticleResponse) => Article {
        return Article(
            id: response.id,
            title: response.title,
            content: response.content,
            authorId: response.author_id,
            publishedDate: datetime.parse(response.published_at)
        )
    }
    
    func wordCount() => int {
        return content.split(" ").count
    }
}
```

### Configuration Management

```weft
object AppConfig {
    let ENVIRONMENT = "production"
    let API_BASE_URL = "https://api.example.com"
    let ENABLE_ANALYTICS = true
    let LOG_LEVEL = "info"
}

object Colors {
    let PRIMARY = Color(hex: "#007AFF")
    let SECONDARY = Color(hex: "#5856D6")
    let ERROR = Color(hex: "#FF3B30")
    let SUCCESS = Color(hex: "#34C759")
}
```

### State Management

```weft
class AppState {
    private(set) var isAuthenticated: bool = false
    private(set) var currentUser: User? = null
    private var listeners: [(AppState) => void] = []
    
    func login(user: User) {
        self.currentUser = user
        self.isAuthenticated = true
        notifyListeners()
    }
    
    func logout() {
        self.currentUser = null
        self.isAuthenticated = false
        notifyListeners()
    }
    
    func subscribe(listener: (AppState) => void) {
        listeners.append(listener)
    }
    
    private func notifyListeners() {
        for listener in listeners {
            listener(self)
        }
    }
}
```

### Inheritance Hierarchy

```weft
class BaseRepository {
    protected var database: Database
    
    func init(database: Database) {
        self.database = database
    }
    
    protected func logQuery(query: string) {
        print("Query: \(query)")
    }
}

class ArticleRepository: BaseRepository {
    func getAll() => [Article] {
        logQuery("SELECT * FROM articles")
        return database.query("SELECT * FROM articles")
    }
    
    func getById(id: string) => Article? {
        logQuery("SELECT * FROM articles WHERE id = \(id)")
        return database.queryOne("SELECT * FROM articles WHERE id = ?", id)
    }
}
```

## Best Practices

**Choose the right keyword for your intent**: Don't default to `class` for everything.

```weft
// Good: Clear intent
data UserDTO {                    // Pure data from API
    var id: string
    var name: string
}

struct User {                     // Domain model with methods
    var id: string
    var name: string
    func validate() => bool { }
}

class UserManager {               // Complex state management
    private var users: [User]
    func addUser(user: User) { }
}
```

**Use `object` for constants**: Group related constants together.

```weft
// Good: Organized constants
object API {
    let BASE_URL = "https://api.example.com"
    let TIMEOUT = 30
}

// Avoid: Scattered constants
let API_BASE_URL = "https://api.example.com"
let API_TIMEOUT = 30
```

**Prefer `data` for simple DTOs**: Let the translator generate boilerplate.

```weft
// Good: Simple and clean
data ArticleDTO {
    var id: string
    var title: string
}

// Unnecessary: Manual boilerplate
class ArticleDTO {
    var id: string
    var title: string
    
    func equals(other: ArticleDTO) => bool {
        return self.id == other.id && self.title == other.title
    }
}
```

## See Also

- [Access Control](02-access-control.md) - Controlling visibility of members
- [Scope](03-scope.md) - Scoping with braces vs indentation
- [Imports](04-imports.md) - Importing types from other files