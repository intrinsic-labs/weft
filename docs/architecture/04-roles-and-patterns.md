# Roles & Patterns

This section covers practical implementation patterns for building scalable Weft applications. These patterns work together to create clean separation of concerns and maintainable architectures based on **Clean Architecture** principles.

## Clean Architecture in Weft

Weft's architecture is built on **Clean Architecture** principles, which organize code into concentric layers with clear dependency rules.

### The Dependency Rule

**Inner layers cannot depend on outer layers.**

```
┌─────────────────────────────────────────────┐
│  FRAMEWORKS & DRIVERS                       │  ← Outermost
│  @Role(adapter), @Schema                    │
│  ┌────────────────────────────────────────┐ │
│  │  INTERFACE ADAPTERS                    │ │
│  │  @Role(repository|service|             │ │
│  │        viewmodel|gateway)              │ │
│  │  ┌───────────────────────────────────┐ │ │
│  │  │  USE CASES                        │ │ │
│  │  │  @Role(usecase)                   │ │ │
│  │  │  ┌─────────────────────────────┐  │ │ │
│  │  │  │  ENTITIES                   │  │ │ │  ← Innermost
│  │  │  │  @Role(entity)              │  │ │ │
│  │  │  └─────────────────────────────┘  │ │ │
│  │  └───────────────────────────────────┘ │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Why Clean Architecture?

**Benefits:**
- Clear separation of concerns
- Testability (mock outer layers)
- Framework independence (business logic doesn't depend on UI or database)
- Scalability (easy to add features)
- Enforced boundaries (LSP validates dependencies)


## The 8 Role Annotations

Weft provides 8 role annotations that map to Clean Architecture layers:

### Core Layer (Innermost)

**@Role(entity)** - Pure business objects with no dependencies
```weft
@Role(entity)
data Article {
    var id: string
    var title: string
    var content: string
    var publishedAt: datetime

    func isPublished() -> bool {
        return publishedAt <= datetime.now()
    }
}
```

**@Role(usecase)** - Application business rules
```weft
@Role(usecase)
class PublishArticleUseCase {
    private var repository: ArticleRepository  // Interface

    func execute(articleId: string) async throws {
        @SumFunc
        => fetch article from repository
        => validate article is ready for publishing
        => set published date to now
        => save article back to repository
    }
}
```

### Interface Adapters Layer

**@Role(repository)** - Data access interface
```weft
@Role(repository)
protocol ArticleRepository {
    var articles: [Article] { get }
    func fetchArticles() async throws
    func save(article: Article) async throws
}
```

**@Role(service)** - Business utility interface
```weft
@Role(service)
protocol AnalyticsService {
    func trackEvent(name: string, properties: [string: any])
}
```

**@Role(viewmodel)** - Presentation logic
```weft
@Role(viewmodel)
@Lifecycle(view)
@Publisher
class ArticleListViewModel {
    @Subscriber private var repository: ArticleRepository

    var articles: [Article] {
        return repository.articles
    }
}
```

**@Role(gateway)** - External service interface
```weft
@Role(gateway)
protocol PaymentGateway {
    func processPayment(amount: float, method: PaymentMethod) async throws -> Receipt
}
```

**@Role(dto)** - Data transfer objects (boundary crossing)
```weft
@Role(dto)
data ArticleDTO {
    var id: string
    var title: string
    var author_name: string  // External API format

    func toEntity() -> Article {
        @SumFunc
        => create Article from DTO fields
        => map author_name to author property
        => return entity
    }
}
```

### Frameworks & Drivers Layer (Outermost)

**@Role(adapter)** - Concrete implementations
```weft
@Role(adapter)
@Lifecycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository {
    private var api: APIClient
    private var database: Database

    private(set) var articles: [Article] = []

    func fetchArticles() async throws {
        var dtos = await api.fetchArticles()
        articles = dtos.map(dto => dto.toEntity())
        await database.saveArticles(articles)
    }
}
```

## Implementing These Core Patterns

### Entity Pattern

**Purpose:** Represent core business objects with domain logic.

**Key responsibilities:**
- Define business data structures
- Contain domain business rules
- No dependencies on outer layers
- Pure, testable logic

**Typical scope:** No lifecycle annotation (plain data/logic)

**Pattern:**
- Use `@Role(entity)` only
- Keep dependencies minimal (other entities only)
- Add domain methods (validation, computed properties)
- No framework or infrastructure concerns

**Example:**
```weft
@Role(entity)
data Article {
    var id: string
    var title: string
    var content: string
    var authorId: string
    var publishedAt: datetime?
    var createdAt: datetime

    func isPublished() -> bool {
        return publishedAt != nil && publishedAt! <= datetime.now()
    }

    func canBeEditedBy(userId: string) -> bool {
        return authorId == userId && !isPublished()
    }
}
```


### UseCase Pattern

**Purpose:** Implement application-specific business rules and orchestrate workflows.

**Key responsibilities:**
- Coordinate between repositories and services
- Execute multi-step business operations
- Enforce business rules
- Keep ViewModels thin

**Typical scope:** No lifecycle annotation (instantiated by ViewModels or other use cases)

**Pattern:**
- Use `@Role(usecase)` only
- Inject interfaces (repositories, services, gateways)
- Return entities or simple types

**Example:**
```weft
@Role(usecase)
class PublishArticleUseCase {
    private var articleRepository: ArticleRepository
    private var notificationService: NotificationService

    func execute(articleId: string) async throws {
        @SumFunc
        => fetch article from repository
        => validate article has title and content
        => validate article is not already published
        => set published date to now
        => save article to repository
        => send notification to subscribers
    }
}
```


### Repository Pattern

**Purpose:** Abstract data sources and provide a clean API for data access.

**Key responsibilities:**
- Coordinate between network, database, and cache
- Provide observable data streams
- Handle entity ↔ DTO conversion
- Manage data consistency

**Typical scope:** `@Lifecycle(singleton)` (app-wide, shared across features)

**Pattern:**
- Define interface with `@Role(repository)`
- Implement with `@Role(adapter)` + `@Lifecycle(singleton)` + `@Publisher`
- Use `@Role(dto)` for API/DB boundary objects
- Return `@Role(entity)` objects to consumers

**Example:**
```weft
@Role(repository)
protocol ArticleRepository {
    var articles: [Article] { get }
    func fetchArticles() async throws
    func getArticle(id: string) -> Article?
    func save(article: Article) async throws
}

@Role(adapter)
@Lifecycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository {
    private var api: APIClient
    private var database: Database

    private(set) var articles: [Article] = []

    func fetchArticles() async throws {
        var dtos: [ArticleDTO] = await api.fetchArticles()
        articles = dtos.map(dto => dto.toEntity())
        await database.saveArticles(articles)
    }
}
```


### Service Pattern

**Purpose:** Provide business logic, utilities, and cross-cutting concerns.

**Key responsibilities:**
- Implement business rules
- Provide stateless operations
- Handle integrations (analytics, logging, etc.)
- Coordinate app-wide concerns

**Typical scope:** `@Lifecycle(singleton)` (app-wide, shared)

**Pattern:**
- Define interface with `@Role(service)`
- Implement with `@Role(adapter)` + `@Lifecycle(singleton)`
- No observable state for stateless services
- Use `@Publisher` if service maintains state

**Example:**
```weft
@Role(service)
protocol AnalyticsService {
    func trackEvent(name: string, properties: [string: any])
    func trackScreen(name: string)
}

@Role(adapter)
@Lifecycle(singleton)
class AnalyticsServiceImpl: AnalyticsService {
    private var backend: AnalyticsBackend

    func trackEvent(name: string, properties: [string: any]) {
        @SumFunc
        => format event with timestamp and properties
        => send to analytics backend
        => log locally for debugging
    }
}
```


### ViewModel Pattern

**Purpose:** Coordinate presentation logic and UI state.

**Key responsibilities:**
- Transform repository data for UI display
- Handle user interactions
- Manage local UI state
- Coordinate multiple repositories/services

**Typical scope:** `@Lifecycle(view)` (one per view/screen)

**Pattern:**
- Use `@Role(viewmodel)` + `@Lifecycle(view)` + `@Publisher`
- Inject repositories and services via `@Subscriber`
- Expose computed properties for UI
- Keep business logic in use cases or services

**Example:**
```weft
@Role(viewmodel)
@Lifecycle(view)
@Publisher
class ArticleListViewModel {
    @Subscriber private var repository: ArticleRepository
    private var publishUseCase: PublishArticleUseCase

    var searchQuery: string = ""
    var selectedCategory: string? = nil

    var filteredArticles: [Article] {
        return repository.articles
            .filter(a => a.title.contains(searchQuery))
            .filter(a => selectedCategory == nil || a.category == selectedCategory)
    }

    func publishArticle(id: string) async {
        try {
            await publishUseCase.execute(id)
        } catch error {
            // Handle error
        }
    }
}
```


### Gateway Pattern

**Purpose:** Define interfaces for external services (payment, email, SMS, etc.).

**Key responsibilities:**
- Abstract third-party service APIs
- Provide domain-friendly interfaces
- Allow swapping implementations
- Isolate external dependencies

**Typical scope:** `@Lifecycle(singleton)` (app-wide, shared)

**Pattern:**
- Define interface with `@Role(gateway)`
- Implement with `@Role(adapter)` + `@Lifecycle(singleton)`
- Use domain types, not external types
- Handle external API quirks in adapter

**Example:**
```weft
@Role(gateway)
protocol PaymentGateway {
    func processPayment(amount: float, currency: string, method: PaymentMethod) async throws -> Receipt
    func refundPayment(receiptId: string) async throws
}

@Role(adapter)
@Lifecycle(singleton)
class StripePaymentGateway: PaymentGateway {
    private var stripeClient: StripeAPI

    func processPayment(amount: float, currency: string, method: PaymentMethod) async throws -> Receipt {
        @SumFunc
        => convert amount to cents (Stripe uses integer cents)
        => map PaymentMethod to Stripe payment method
        => create Stripe payment intent
        => process payment with Stripe API
        => convert Stripe response to Receipt entity
        => return receipt
    }
}
```


### DTO Pattern

**Purpose:** Transfer data across architectural boundaries (API ↔ domain, database ↔ domain).

**Key responsibilities:**
- Match external data formats exactly
- Convert to/from entities
- Handle format differences (snake_case, dates, etc.)
- Validate external data

**Typical scope:** No lifecycle annotation (plain data structures)

**Pattern:**
- Use `@Role(dto)` only
- Mirror external API/database structure
- Provide `toEntity()` and `fromEntity()` methods
- Keep conversion logic simple

**Example:**
```weft
@Role(dto)
data ArticleDTO {
    var id: string
    var title: string
    var content: string
    var author_id: string           // API uses snake_case
    var published_at: string?       // API returns ISO8601 string
    var created_at: string

    func toEntity() -> Article {
        return Article(
            id: id,
            title: title,
            content: content,
            authorId: author_id,
            publishedAt: published_at?.toDatetime(),
            createdAt: created_at.toDatetime()
        )
    }

    static func fromEntity(article: Article) -> ArticleDTO {
        return ArticleDTO(
            id: article.id,
            title: article.title,
            content: article.content,
            author_id: article.authorId,
            published_at: article.publishedAt?.toISO8601(),
            created_at: article.createdAt.toISO8601()
        )
    }
}
```


### Adapter Pattern

**Purpose:** Implement interfaces defined by inner layers using framework/infrastructure code.

**Key responsibilities:**
- Provide concrete implementations
- Handle framework-specific details
- Coordinate external dependencies
- Bridge inner layers to outer infrastructure

**Typical scope:** Usually `@Lifecycle(singleton)`, sometimes `@Lifecycle(session)`

**Pattern:**
- Use `@Role(adapter)` + `@Lifecycle(...)`
- Implement interfaces from inner layers
- Inject framework dependencies
- Use `@Publisher` if maintaining observable state

**Example:**
```weft
@Role(adapter)
@Lifecycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository {
    private var api: APIClient
    private var database: RealmDatabase
    private var cache: CacheManager

    private(set) var articles: [Article] = []
    private(set) var isLoading: bool = false

    func fetchArticles() async throws {
        isLoading = true

        // Try cache first
        if let cached = cache.get("articles") as? [Article] {
            articles = cached
            isLoading = false
            return
        }

        // Fetch from API
        var dtos: [ArticleDTO] = await api.fetchArticles()
        articles = dtos.map(dto => dto.toEntity())

        // Save to database and cache
        await database.saveArticles(articles)
        cache.set("articles", articles, ttl: 300)

        isLoading = false
    }
}
```

## Architecture Layers

```
┌─────────────────────────────────────┐
│          UI Layer (Views)           │
│   - Render state                    │
│   - Handle user input               │
│   - @Subscriber for ViewModels      │
│   - @LocalState for UI state        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Presentation Layer (ViewModels)  │
│   - @Role(viewmodel)                │
│   - Transform data for UI           │
│   - Coordinate user actions         │
│   - Manage local UI state           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Business Logic Layer              │
│   - @Role(usecase)                  │
│   - @Role(service) interfaces       │
│   - @Role(gateway) interfaces       │
│   - Implement business rules        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Entity Layer                   │
│   - @Role(entity)                   │
│   - Pure business objects           │
│   - No dependencies                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Data Layer (Repositories)         │
│   - @Role(repository) interfaces    │
│   - @Role(adapter) implementations  │
│   - @Role(dto) for boundaries       │
│   - Manage data sources             │
└─────────────────────────────────────┘
```

## Data Flow

**Unidirectional flow:**
1. User interacts with **View**
2. View calls **ViewModel** method
3. ViewModel calls **Use Case** or **Repository**
4. Repository updates **Entities**
5. Repository publishes state changes
6. ViewModel recomputes properties
7. View automatically re-renders

**Key principle:** State flows down, events flow up.

```
User Action
    ↓
  View
    ↓
ViewModel  ←───┐
    ↓          │
Use Case       │
    ↓          │
Repository     │ Observable
    ↓          │ State Changes
Entity         │
    ↓          │
Database/API   │
    ↓          │
    └──────────┘
```

## Best Practices

**Separate interfaces from implementations:**
```weft
// ✅ Good: Interface in inner layer, implementation in outer layer
@Role(repository)
protocol ArticleRepository { }

@Role(adapter)
class ArticleRepositoryImpl: ArticleRepository { }
```

**Use DTOs at boundaries:**
```weft
// ✅ Good: DTO for API, Entity for business logic
@Role(dto)
data ArticleDTO {
    func toEntity() -> Article { }
}

@Role(adapter)
class ArticleRepositoryImpl: ArticleRepository {
    func fetchArticles() async -> [Article] {
        var dtos = await api.fetch()
        return dtos.map(dto => dto.toEntity())  // Convert at boundary
    }
}
```

**Keep business logic in use cases:**
```weft
// ✅ Good: Complex business logic in use case
@Role(usecase)
class ProcessOrderUseCase {
    func execute(order: Order) async throws {
        @SumFunc
        => validate order items
        => calculate total with tax
        => process payment
        => create shipment
        => send confirmation email
    }
}
```

**ViewModels coordinate, don't contain business logic:**
```weft
// ✅ Good: ViewModel delegates to use case
@Role(viewmodel)
class CheckoutViewModel {
    private var processOrderUseCase: ProcessOrderUseCase

    func checkout() async {
        await processOrderUseCase.execute(currentOrder)
    }
}
```

## Validation

The Weft LSP validates Clean Architecture rules:

```json
// weft.settings.json
{
  "validation": {
    "dependencyRule": "error",      // Enforce CA dependency rule
    "layerViolations": "error",     // Enforce layer boundaries
    "lifecycleViolations": "warning"
  },
  "architecture": {
    "style": "clean"
  }
}
```

## See Also

- [Lifecycle & Scope](02-lifecycle-scope.md) - Object lifetimes
- [Observability](03-observability.md) - Reactive state with @Publisher
- [UI State Ownership](../ui/04-ui-state-ownership.md) - UI state patterns with @LocalState
- [Annotations Reference](../reference/annotations.md) - Complete annotation guide
- [Full Architecture Example](06-full-example.md) - Full example of implementing Weft's architecture
