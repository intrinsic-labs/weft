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

## Access Control Patterns

### Encapsulation

Hide internal state and expose controlled APIs:

```weft
class BankAccount {
    private var balance: float = 0.0
    private var transactions: [Transaction] = []
    
    // Read-only access to balance
    public var currentBalance: float {
        return balance
    }
    
    // Controlled deposit method
    public func deposit(amount: float) throws {
        if amount <= 0 {
            throw ValidationError("Amount must be positive")
        }
        balance += amount
        transactions.append(Transaction("deposit", amount))
    }
    
    // Controlled withdrawal method
    public func withdraw(amount: float) throws {
        if amount <= 0 {
            throw ValidationError("Amount must be positive")
        }
        if amount > balance {
            throw ValidationError("Insufficient funds")
        }
        balance -= amount
        transactions.append(Transaction("withdraw", amount))
    }
}
```

### Builder Pattern

Use private initialization with public builder methods:

```weft
class QueryBuilder {
    private var table: string
    private var conditions: [string] = []
    private var orderBy: string? = null
    private var limit: int? = null
    
    private func init(table: string) {
        self.table = table
    }
    
    public static func from(table: string) => QueryBuilder {
        return QueryBuilder(table)
    }
    
    public func where(condition: string) => QueryBuilder {
        conditions.append(condition)
        return self
    }
    
    public func order(field: string) => QueryBuilder {
        self.orderBy = field
        return self
    }
    
    public func limit(count: int) => QueryBuilder {
        self.limit = count
        return self
    }
    
    public func build() => string {
        var query = "SELECT * FROM \(table)"
        
        if !conditions.isEmpty {
            query += " WHERE " + conditions.join(" AND ")
        }
        
        if let orderBy = orderBy {
            query += " ORDER BY \(orderBy)"
        }
        
        if let limit = limit {
            query += " LIMIT \(limit)"
        }
        
        return query
    }
}

// Usage
var query = QueryBuilder.from("articles")
    .where("published = true")
    .order("created_at")
    .limit(10)
    .build()
```

### Repository Pattern

Separate public interface from private implementation:

```weft
@Role(repository)
@Lifecycle(singleton)
public class ArticleRepository {
    private var api: APIClient
    private var database: Database
    private var cache: [string: Article] = [:]
    
    public func init(api: APIClient, database: Database) {
        self.api = api
        self.database = database
    }
    
    // Public API
    public func getArticle(id: string) async => Article? {
        if let cached = getCached(id) {
            return cached
        }
        
        if let fromDb = await getFromDatabase(id) {
            cacheArticle(fromDb)
            return fromDb
        }
        
        return await fetchFromNetwork(id)
    }
    
    public func refreshArticle(id: string) async => Article? {
        clearCache(id)
        return await getArticle(id)
    }
    
    // Private implementation
    private func getCached(id: string) => Article? {
        return cache[id]
    }
    
    private func cacheArticle(article: Article) {
        cache[article.id] = article
    }
    
    private func clearCache(id: string) {
        cache.remove(id)
    }
    
    private func getFromDatabase(id: string) async => Article? {
        return await database.queryOne("SELECT * FROM articles WHERE id = ?", id)
    }
    
    private func fetchFromNetwork(id: string) async => Article? {
        try {
            var article = await api.fetchArticle(id)
            await database.insert(article)
            cacheArticle(article)
            return article
        } catch error {
            logError("Failed to fetch article: \(error)")
            return null
        }
    }
}
```

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

```weft
class ArticleService {
    // Private by default
    private var repository: ArticleRepository
    private var cache: [Article] = []
    
    // Explicitly public API
    public func getArticles() => [Article] {
        return cache
    }
}
```

**Use private(set) for observable state**: Allow reading but control writing.

```weft
class ViewModel {
    private(set) var isLoading: bool = false
    private(set) var articles: [Article] = []
    
    public func refresh() async {
        isLoading = true
        articles = await repository.fetchArticles()
        isLoading = false
    }
}
```

**Keep implementation details private**: Don't expose internal data structures.

```weft
// Good: Clean public API
class Cache {
    private var storage: [string: any] = [:]
    
    public func get(key: string) => any? {
        return storage[key]
    }
    
    public func set(key: string, value: any) {
        storage[key] = value
    }
}

// Avoid: Exposing internals
class Cache {
    public var storage: [string: any] = [:]
}
```

**Use protected for extensibility**: Allow subclasses to customize behavior.

```weft
class BaseViewModel {
    protected func logEvent(name: string) {
        analytics.log(name)
    }
    
    protected func handleError(error: Error) {
        logEvent("error_occurred")
        showError(error.message)
    }
}

class ArticleViewModel: BaseViewModel {
    public func loadArticles() async {
        try {
            articles = await repository.getArticles()
            logEvent("articles_loaded")  // Use protected method
        } catch error {
            handleError(error)  // Use protected method
        }
    }
}
```

## See Also

- [Definitions](01-definitions.md) - Type definitions (class, struct, etc.)
- [Architecture Overview](../architecture/01-overview.md) - Architectural patterns
- [Repositories](../architecture/05-repositories.md) - Repository pattern with access control