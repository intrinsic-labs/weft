# API Integration

Weft handles network requests with async/await patterns. Use the gateway/adapter pattern to separate interface definitions from concrete implementations. This file puts forth a collection of examples that show how one could implement common API integration scenarios using Weft.

## Gateway Pattern

Define API interfaces as gateways, implement as adapters.

```weft
// Gateway interface (domain layer)
@Role(gateway)
protocol ArticleGateway {
    func fetchArticles() async throws -> [ArticleDTO]
    func fetchArticle(id: string) async throws -> ArticleDTO
}

// Adapter implementation (framework layer)
@Role(adapter)
@Lifecycle(singleton)
class ArticleGatewayImpl: ArticleGateway {
    private var api: APIClient
    
    func fetchArticles() async throws -> [ArticleDTO] {
        @SumFunc
        => call API endpoint for articles
        => parse response into ArticleDTO array
        => return DTOs
    }
    
    func fetchArticle(id: string) async throws -> ArticleDTO {
        @SumFunc
        => call API endpoint with id
        => parse response into ArticleDTO
        => return DTO
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
@Role(adapter)
@Lifecycle(singleton)
class UserGatewayImpl: UserGateway {
    private var api: APIClient

    func fetchUser(id: string) async throws -> UserDTO {
        try {
            var response = await api.get("/users/\(id)")
            return UserDTO.fromJSON(response)
        } catch error: NetworkError {
            throw error
        }
    }
}
```

## Repository with Loading States

Repositories coordinate between gateways and the rest of your app, managing loading and error states.

```weft
@Role(repository)
protocol ArticleRepository {
    var articles: [Article] { get }
    var isLoading: bool { get }
    var lastError: Error? { get }
    func fetchArticles() async
}

@Role(adapter)
@Lifecycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository {
    @Subscriber private var gateway: ArticleGateway

    private(set) var articles: [Article] = []
    private(set) var isLoading: bool = false
    private(set) var lastError: Error? = null

    func fetchArticles() async {
        isLoading = true
        lastError = null

        try {
            var dtos = await gateway.fetchArticles()
            articles = dtos.map(dto => dto.toEntity())
        } catch error {
            lastError = error
        }

        isLoading = false
    }
}
```

## DTOs and Domain Models

Use `@Role(dto)` for API response objects, `@Role(entity)` for domain models.

```weft
// API DTO - matches backend
@Role(dto)
@JSON
data ArticleDTO {
    var id: string
    @JSONKey("post_title")
    var title: string
    @JSONKey("post_content")
    var content: string
    @JSONKey("author_id")
    var authorId: string
    
    func toEntity() -> Article {
        return Article(
            id: id,
            title: title,
            content: content,
            authorId: authorId
        )
    }
}

// Domain entity - app structure
@Role(entity)
data Article {
    var id: string
    var title: string
    var content: string
    var authorId: string
}

// Gateway returns DTOs
@Role(gateway)
protocol ArticleGateway {
    func fetchArticles() async throws -> [ArticleDTO]
}

// Repository converts to entities
@Role(adapter)
@Lifecycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository {
    @Subscriber private var gateway: ArticleGateway
    private(set) var articles: [Article] = []
    
    func fetchArticles() async {
        @SumFunc
        => fetch ArticleDTO array from gateway
        => map each DTO to domain entity
        => update articles array
    }
}
```

## Pagination

```weft
@Role(gateway)
protocol ArticleGateway {
    func fetchArticles(page: int) async throws -> [ArticleDTO]
}

@Role(adapter)
@Lifecycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository {
    @Subscriber private var gateway: ArticleGateway

    private(set) var articles: [Article] = []
    private(set) var isLoading: bool = false
    private(set) var hasMore: bool = true
    private var currentPage: int = 0

    func loadNextPage() async {
        if isLoading || !hasMore { return }

        isLoading = true
        currentPage += 1

        try {
            var dtos = await gateway.fetchArticles(page: currentPage)
            var newArticles = dtos.map(dto => dto.toEntity())
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
@Role(adapter)
@Lifecycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository {
    @Subscriber private var gateway: ArticleGateway
    private var database: Database
    private var cache: [string: Article] = [:]

    func getArticle(id: string) async -> Article? {
        @SumFunc
        => check memory cache first
        => if cached, return immediately
        => check database second
        => if in database, cache and return
        => fetch DTO from gateway
        => convert to entity
        => save to database and cache
        => return entity or null
    }
}
```

## Batch Operations

```weft
@Role(gateway)
protocol SyncGateway {
    func syncArticles(ids: [string]) async throws -> [ArticleDTO]
    func uploadChanges(dtos: [ArticleDTO]) async throws
}

@Role(adapter)
@Lifecycle(singleton)
class SyncRepositoryImpl: SyncRepository {
    @Subscriber private var gateway: SyncGateway
    private var database: Database

    func syncArticles(ids: [string]) async {
        @SumFunc
        => batch fetch DTOs from gateway by ids
        => convert DTOs to entities
        => save entities to database
    }

    func uploadPendingChanges() async {
        @SumFunc
        => collect pending entities from database
        => convert entities to DTOs
        => batch send DTOs to gateway
        => mark as synced on success
        => retry on failure
    }
}
```

## Request Cancellation

```weft
@Role(adapter)
@Lifecycle(singleton)
@Publisher
class SearchRepositoryImpl: SearchRepository {
    @Subscriber private var gateway: SearchGateway
    private(set) var results: [Article] = []
    private var currentTask: Task? = null

    func search(query: string) async {
        @SumFunc
        => cancel any pending search task
        => create new search task
        => debounce for 300ms
        => call gateway search method
        => convert DTOs to entities
        => update results array
    }
}
```

## Retry Logic

```weft
@Role(adapter)
@Lifecycle(singleton)
class ArticleGatewayImpl: ArticleGateway {
    private var api: APIClient

    func fetchArticles() async throws -> [ArticleDTO] {
        var attempts = 0
        var maxRetries = 3

        while attempts < maxRetries {
            try {
                var response = await api.get("/articles")
                return [ArticleDTO].fromJSON(response)
            } catch error: NetworkError {
                attempts += 1
                if attempts >= maxRetries {
                    throw error
                }
                await Task.sleep(seconds: attempts * 2)
            }
        }

        throw NetworkError("Max retries exceeded")
    }
}
```

## Response Validation

```weft
@Role(dto)
@JSON
data APIResponse<T> {
    var success: bool
    var data: T?
    var error: string?
}

@Role(adapter)
@Lifecycle(singleton)
class UserGatewayImpl: UserGateway {
    private var api: APIClient
    
    func fetchUser(id: string) async throws -> UserDTO {
        var response = await api.get("/users/\(id)")
        var parsed = APIResponse<UserDTO>.fromJSON(response)

        if parsed.success && parsed.data != null {
            return parsed.data!
        } else {
            throw APIError(parsed.error ?? "unknown error")
        }
    }
}
```

## Timeout Handling

```weft
@Role(adapter)
@Lifecycle(singleton)
class ArticleGatewayImpl: ArticleGateway {
    private var api: APIClient

    func fetchArticles(timeout: int = 30) async throws -> [ArticleDTO] {
        try {
            var response = await api.get("/articles", timeout: timeout)
            return [ArticleDTO].fromJSON(response)
        } catch error: TimeoutError {
            print("Request timed out after \(timeout)s")
            throw error
        } catch error {
            print("Request failed: \(error)")
            throw error
        }
    }
}
```

## See Also

- [Roles & Patterns](../architecture/04-roles-and-patterns.md) - Gateway, repository, and adapter patterns
- [JSON](01-json.md) - DTOs and serialization
- [Databases](02-databases.md) - Local persistence
