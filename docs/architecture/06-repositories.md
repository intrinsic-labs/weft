# Repository Pattern

Repositories abstract data sources and provide a clean API for data access. They coordinate between network, database, and cache while exposing observable state to the rest of your application.

## Purpose

A repository serves as the single source of truth for a specific domain entity. It handles:
- Fetching data from APIs
- Caching data locally
- Managing database operations
- Providing observable data streams
- Handling data synchronization

## Basic Repository

**Note:** The `@Repository` annotation explicitly marks this class as a repository, communicating intent to developers and translators.

```weft
@Observable
@Repository
@Singleton
class ArticleRepository {
    private var api: APIClient
    private var database: Database
    
    private(set) var articles: [Article] = []
    private(set) var isLoading: bool = false
    private(set) var lastError: Error? = null
    
    func fetchArticles() async {
        @SumFunc
        => set loading state to true
        => fetch articles from API
        => save articles to database
        => update articles array
        => set loading state to false
        => handle any errors by setting lastError
    }
    
    func getArticle(id: string) => Article? {
        @SumFunc
        => find article in articles array by id
        => if not found, query database
        => return article or null
    }
}
```

## Key Characteristics

**Explicit Annotation**: Always use `@Repository` to mark repository classes. This communicates the pattern and helps with code organization.

**Observable State**: Use `@Observable` so views and ViewModels can react to changes.

**Singleton Scope**: Typically `@Singleton` to share data across the app.

**Private Setters**: Use `private(set)` to expose state for reading but control writes.

**Error Handling**: Expose errors as observable properties rather than throwing.

## Common Patterns

### Caching Strategy

```weft
@Observable
@Repository
@Singleton
class UserRepository {
    private var api: APIClient
    private var database: Database
    private var cache: [string: User] = [:]
    
    func getUser(id: string) async => User? {
        @SumFunc
        => check cache first for instant return
        => if not cached, check database
        => if in database, add to cache and return
        => if not in database, fetch from API
        => save to database and cache
        => return user
    }
    
    func refreshUser(id: string) async => User? {
        @SumFunc
        => remove from cache to force refresh
        => fetch fresh data via getUser
    }
}
```

### Pagination

```weft
@Observable
@Repository
@Singleton
class ArticleRepository {
    private var api: APIClient
    
    private(set) var articles: [Article] = []
    private(set) var isLoading: bool = false
    private(set) var hasMore: bool = true
    private var currentPage: int = 0
    
    func loadNextPage() async {
        @SumFunc
        => return early if loading or no more pages
        => set loading to true
        => fetch next page from API
        => append to articles array
        => increment page counter
        => update hasMore flag
        => set loading to false
    }
    
    func refresh() async {
        @SumFunc
        => reset to page 0
        => clear articles array
        => load first page
    }
}
```

### Optimistic Updates

```weft
@Observable
@Repository
@Singleton
class TaskRepository {
    private var api: APIClient
    private var database: Database
    
    private(set) var tasks: [Task] = []
    
    func toggleComplete(taskId: string) async {
        @SumFunc
        => find task in local array
        => toggle completed state immediately (optimistic)
        => update database locally
        => sync to API in background
        => if API call fails, revert the change
    }
}
```

### Offline-First

```weft
@Observable
@Repository
@Singleton
class ArticleRepository {
    private var api: APIClient
    private var database: Database
    
    func getArticles() async => [Article] {
        @SumFunc
        => load from database immediately
        => return cached data to caller
        => fetch fresh data from API in background
        => update database with fresh data
        => observable array updates automatically
    }
}
```

## Best Practices

**Single Responsibility**: One repository per domain entity.

```weft
// Good: Focused repositories
@Repository class UserRepository { }
@Repository class ArticleRepository { }
@Repository class CommentRepository { }

// Avoid: Kitchen sink repository
@Repository class DataRepository { }
```

**Expose Observable State**: Let consumers react to changes.

```weft
@Observable
@Repository
class ArticleRepository {
    private(set) var articles: [Article] = []  // Others can observe
    private var cache: [string: Article] = [:] // Internal only
}
```

**Handle Errors Gracefully**: Expose errors rather than throwing.

```weft
@Observable
@Repository
class ArticleRepository {
    private(set) var articles: [Article] = []
    private(set) var lastError: Error? = null
    
    func fetchArticles() async {
        lastError = null
        
        try {
            articles = await api.fetchArticles()
        } catch error {
            lastError = error
        }
    }
}
```

**Keep Business Logic Out**: Repositories manage data access, not business rules.

```weft
// Good: Just data access
@Repository
class UserRepository {
    func getUser(id: string) async => User? {
        @SumFunc
        => fetch user from data sources
    }
}

// Avoid: Business logic in repository
@Repository
class UserRepository {
    func canUserAccessPremiumFeatures(id: string) => bool {
        // This belongs in a Service, not a Repository
    }
}
```

## Complete Example

```weft
@Observable
@Repository
@Singleton
class ArticleRepository {
    private var api: APIClient
    private var database: Database
    private var cache: [string: Article] = [:]
    
    private(set) var articles: [Article] = []
    private(set) var isLoading: bool = false
    private(set) var lastError: Error? = null
    
    func init(api: APIClient, database: Database) {
        self.api = api
        self.database = database
    }
    
    func fetchArticles() async {
        isLoading = true
        lastError = null
        
        try {
            @SumFunc
            => fetch articles from API
            => save to database
            => update cache
            => update articles array
            
            isLoading = false
        } catch error {
            lastError = error
            isLoading = false
        }
    }
    
    func getArticle(id: string) async => Article? {
        @SumFunc
        => check cache first
        => check articles array second
        => query database third
        => fetch from API as last resort
        => cache and return result
    }
    
    func bookmarkArticle(id: string) async {
        @SumFunc
        => find article by id
        => toggle bookmark state
        => update in cache, array, and database
        => sync to API in background
    }
    
    func clearCache() {
        cache.removeAll()
    }
}
```

## See Also

- [Patterns Overview](05-patterns-overview.md) - How patterns work together
- [ViewModel Pattern](07-viewmodels.md) - Using repositories in ViewModels
- [Lifecycle & Scope](02-lifecycle-scope.md) - Repository scope and lifetime
- [Observability](03-observability.md) - Making repositories observable