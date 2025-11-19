# Access Control

Access control in Weft allows you to control the visibility and accessibility of types, properties, and functions. Use access modifiers to encapsulate implementation details and expose clean public APIs.

**By default, all declarations are public unless explicitly marked otherwise.** Use access modifiers to restrict visibility where needed.

## Access Modifiers

Weft supports standard access control modifiers that translate cleanly to all target platforms:

```weft
public var publicProperty        // accessible everywhere
private var privateProperty      // accessible only within this type
protected var protectedProperty  // accessible in type and subclasses
internal var internalProperty    // accessible within same module/package
```

## Public Access

Use `public` for APIs that should be accessible from anywhere:

```weft
public class ArticleRepository {
    public func getArticles() => [Article] {
        return database.query("SELECT * FROM articles")
    }
}

public struct User {
    public var id: string
    public var username: string
}
```

**When to use `public`:**
- Public APIs for your library or framework
- Types meant to be used across modules
- Methods that other parts of the app need to call

## Private Access

Use `private` to hide implementation details:

```weft
class UserManager {
    private var cache: [User] = []
    private var database: Database
    
    public func getUser(id: string) => User? {
        return findInCache(id) ?? fetchFromDatabase(id)
    }
    
    private func findInCache(id: string) => User? {
        for user in cache {
            if user.id == id {
                return user
            }
        }
        return null
    }
    
    private func fetchFromDatabase(id: string) => User? {
        return database.queryOne("SELECT * FROM users WHERE id = ?", id)
    }
}
```

**When to use `private`:**
- Internal helper methods
- Cache or temporary storage
- Implementation details that shouldn't be accessed externally

## Protected Access

Use `protected` for members that should be accessible to subclasses:

```weft
class BaseRepository {
    protected var database: Database
    
    protected func logQuery(query: string) {
        print("Query: \(query)")
    }
    
    public func init(database: Database) {
        self.database = database
    }
}

class ArticleRepository: BaseRepository {
    public func getAll() => [Article] {
        // Can access protected members from parent
        logQuery("SELECT * FROM articles")
        return database.query("SELECT * FROM articles")
    }
}
```

**When to use `protected`:**
- Shared functionality for subclasses
- Properties that subclasses need to access
- Extension points in base classes

## Internal Access

Use `internal` for module-wide visibility (default in many cases):

```weft
internal class DatabaseHelper {
    internal func executeQuery(query: string) => [Row] {
        return database.execute(query)
    }
}

internal struct Config {
    internal var apiKey: string
    internal var baseUrl: string
}
```

**When to use `internal`:**
- Types used within a module but not exposed publicly
- Shared utilities within your app
- Implementation types that support public APIs

## Private Set

Control write access separately from read access:

```weft
class Counter {
    // Readable everywhere, writable only within Counter
    private(set) var count: int = 0
    
    public func increment() {
        count += 1
    }
    
    public func reset() {
        count = 0
    }
}

// Usage
var counter = Counter()
print(counter.count)    // OK: can read
// counter.count = 5    // Error: cannot write
counter.increment()     // OK: use public method
```

**When to use `private(set)`:**
- Properties that should be read publicly but modified privately
- Observable state that should only change through specific methods
- Counters, flags, or status indicators

## Translation Examples

Access modifiers translate to platform-specific equivalents:

**Swift:**
```swift
public class ArticleRepository {
    private var cache: [Article] = []
    private(set) public var isLoading: Bool = false
    
    public func getArticles() -> [Article] { }
}
```

**Kotlin:**
```kotlin
class ArticleRepository {
    private var cache: List<Article> = emptyList()
    var isLoading: Boolean = false
        private set
    
    fun getArticles(): List<Article> { }
}
```

**TypeScript:**
```typescript
export class ArticleRepository {
    private cache: Article[] = [];
    private _isLoading: boolean = false;
    
    get isLoading(): boolean {
        return this._isLoading;
    }
    
    public getArticles(): Article[] { }
}
```

## Best Practices

**Default to private, expose intentionally**: Start with private and make things public only when needed.

**Use private(set) for observable state**: Allow reading but restrict writing.

**Keep implementation details private**: Don't expose internal data structures.

**Use protected for extensibility**: Allow subclasses to customize behavior.

## See Also

- [Definitions](01-definitions.md) - Type definitions (class, struct, etc.)
- [Architecture Overview](../architecture/01-overview.md) - Architectural patterns
- [Repositories](../architecture/05-repositories.md) - Repository pattern with access control