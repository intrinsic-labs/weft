# API Integration

Weft handles network requests with async/await patterns. Use Repositories to manage API calls, caching, and error handling.

## Core Principles

**Async by default**: All network calls use `async`/`await`.

**Error as state**: Expose errors through observable properties.

**Repository pattern**: Centralize API logic in Repository classes.

## Basic API Call

```weft
@Observable
@Repository
@Singleton
class ArticleRepository {
    private var api: APIClient
    private(set) var articles: [Article] = []

    func fetchArticles() async {
        @SumFunc
        => call API endpoint for articles
        => parse response into Article objects
        => update articles array
    }
}
```

## Async Functions

```weft
func loadUser(id: string) async => User? {
    @SumFunc
    => fetch user from API by id
    => return user or null
}

// Usage
var user = await loadUser(id: "123")
```

## Error Handling

```weft
@Observable
@Repository
class UserRepository {
    private var api: APIClient
    private(set) var lastError: Error? = null

    func fetchUser(id: string) async => User? {
        try {
            var response = await api.get("/users/\(id)")
            var user = User.fromJSON(response)
            lastError = null
            return user
        } catch error: NetworkError {
            lastError = error
            return null
        }
    }
}
```

## Loading States

```weft
@Observable
@Repository
class ArticleRepository {
    private var api: APIClient

    private(set) var articles: [Article] = []
    private(set) var isLoading: bool = false
    private(set) var lastError: Error? = null

    func fetchArticles() async {
        isLoading = true
        lastError = null

        try {
            var response = await api.get("/articles")
            articles = [Article].fromJSON(response.data)
        } catch error {
            lastError = error
        }

        isLoading = false
    }
}
```

## DTOs and Domain Models

This is often unnecessary for small projects, but for projects at scale, separating DTOs that match your backend structure from domain space/client side app models can make a lot of sense.

```weft
// API DTO - matches backend
@JSON
type ArticleDTO {
    var id: string
    @JSONKey("post_title")
    var title: string
    @JSONKey("post_content")
    var content: string
}

// Domain model - app structure
type Article {
    var id: string
    var title: string
    var content: string
    var wordCount: int
}

// Repository converts between them
@Repository
class ArticleRepository {
    func fetchArticles() async => [Article] {
        @SumFunc
        => fetch ArticleDTO array from API
        => map each DTO to domain Article
        => calculate wordCount for each
        => return domain models
    }
}
```

## Pagination

```weft
@Observable
@Repository
class ArticleRepository {
    private var api: APIClient

    private(set) var articles: [Article] = []
    private(set) var isLoading: bool = false
    private(set) var hasMore: bool = true
    private var currentPage: int = 0

    func loadNextPage() async {
        if isLoading || !hasMore { return }

        isLoading = true
        currentPage += 1

        try {
            var response = await api.get("/articles?page=\(currentPage)")
            var newArticles = [Article].fromJSON(response.data)
            articles.append(contentsOf: newArticles)
            hasMore = newArticles.count > 0
        } catch error {
            currentPage -= 1
        }

        isLoading = false
    }

    func refresh() async {
        currentPage = 0
        articles = []
        hasMore = true
        await loadNextPage()
    }
}
```

## Caching Strategy

```weft
@Observable
@Repository
@Singleton
class ArticleRepository {
    private var api: APIClient
    private var database: Database
    private var cache: [string: Article] = [:]

    func getArticle(id: string) async => Article? {
        @SumFunc
        => check memory cache first
        => if cached, return immediately
        => check database second
        => if in database, cache and return
        => fetch from API as last resort
        => save to database and cache
        => return article or null
    }
}
```

## Optimistic Updates

```weft
@Repository
class TodoRepository {
    private var api: APIClient
    private var database: Database
    private(set) var todos: [Todo] = []

    func toggleComplete(todoId: string) async {
        @SumFunc
        => find todo in local array
        => toggle its completed state immediately
        => update UI via state change
        => send update to API in background
        => if API fails, revert local change
        => show error to user
    }
}
```

## Batch Operations

```weft
@Repository
class SyncRepository {
    private var api: APIClient

    func syncArticles(ids: [string]) async {
        @SumFunc
        => batch fetch articles by ids
        => use single API call for efficiency
        => parse and save all results
    }

    func uploadPendingChanges() async {
        @SumFunc
        => collect all pending changes from database
        => batch send to API
        => mark as synced on success
        => retry on failure
    }
}
```

## Request Cancellation

```weft
@Observable
@Repository
class SearchRepository {
    private var api: APIClient
    private(set) var results: [Article] = []
    private var currentTask: Task? = null

    func search(query: string) async {
        @SumFunc
        => cancel any pending search task
        => create new search task
        => debounce for 300ms
        => call search API
        => update results array
    }
}
```

## Retry Logic

```weft
@Repository
class ArticleRepository {
    private var api: APIClient

    func fetchWithRetry(url: string, maxRetries: int = 3) async => Response? {
        var attempts = 0

        while attempts < maxRetries {
            try {
                return await api.get(url)
            } catch error: NetworkError {
                attempts += 1
                if attempts >= maxRetries {
                    throw error
                }
                await Task.sleep(seconds: attempts * 2)
            }
        }

        return null
    }
}
```

## Response Validation

```weft
@JSON
type APIResponse<T> {
    var success: bool
    var data: T?
    var error: string?
}

@Repository
class UserRepository {
    func fetchUser(id: string) async => User? {
        try {
            var response = await api.get("/users/\(id)")
            var parsed = APIResponse<User>.fromJSON(response)

            if parsed.success && parsed.data != null {
                return parsed.data
            } else {
                print("API error: \(parsed.error ?? 'unknown')")
                return null
            }
        } catch error {
            return null
        }
    }
}
```

## Timeout Handling

```weft
@Repository
class ArticleRepository {
    private var api: APIClient

    func fetchArticles(timeout: int = 30) async => [Article]? {
        try {
            var response = await api.get("/articles", timeout: timeout)
            return [Article].fromJSON(response)
        } catch error: TimeoutError {
            print("Request timed out after \(timeout)s")
            return null
        } catch error {
            print("Request failed: \(error)")
            return null
        }
    }
}
```

## Best Practices

**Keep API calls in Repositories**: Don't call APIs from ViewModels or Views.

```weft
// Good
@Repository
class ArticleRepository {
    func fetchArticles() async { /* ... */ }
}

// Avoid
@ViewModel
class ArticleViewModel {
    func fetchArticles() async {
        var response = await api.get(/* ... */)  // Don't do this
    }
}
```

**Expose state, not functions**: Let views observe changes.

```weft
@Repository
class ArticleRepository {
    private(set) var articles: [Article] = []  // observable
    private(set) var isLoading: bool = false   // observable

    func fetchArticles() async {
        isLoading = true
        // fetch logic
        isLoading = false
    }
}
```

**Use DTOs at API boundary**: If using DTOs and domain models, convert to domain models immediately. DTO instances should not leak to the rest of your app.

```weft
func fetchArticles() async {
    @SumFunc
    => fetch ArticleDTO objects from API
    => convert to Article domain models
    => return domain models to app
}
```

**Handle errors gracefully**: Store errors as observable state.

```weft
private(set) var lastError: Error? = null

func fetch() async {
    try {
        // fetch logic
        lastError = null
    } catch error {
        lastError = error
    }
}
```

**Cache intelligently**: Reduce unnecessary API calls.

```weft
func getArticle(id: string) async => Article? {
    @SumFunc
    => check cache first
    => return cached if fresh
    => fetch from API if needed
    => update cache
}
```

## See Also

- [JSON](01-json.md) - Serialization patterns
- [Databases](02-databases.md) - Local persistence
- [Repositories](../architecture/06-repositories.md) - Repository pattern
