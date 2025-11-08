# Annotation Reference

Complete reference for all Weft annotations organized by semantic category.

---

## Overview

Weft's annotation system is designed to support **Clean Architecture** principles and encourage well-structured, maintainable applications. Annotations are organized into semantic categories that map to architectural concerns:

1. **Lifecycle** - How long objects live and when they're created/destroyed
2. **Role** - What architectural layer and responsibility a type has
3. **State & Reactivity** - How data flows and what triggers updates
4. **Persistence** - How data is stored and serialized
5. **Documentation** - Human and translator guidance

---

## Clean Architecture Alignment

Weft's role annotations map directly to Clean Architecture layers:

```
┌─────────────────────────────────────────────┐
│  Frameworks & Drivers (Outermost)          │
│  @Role(adapter), @Schema, views            │
│  ┌───────────────────────────────────────┐ │
│  │  Interface Adapters                   │ │
│  │  @Role(repository), @Role(service),   │ │
│  │  @Role(viewmodel), @Role(gateway)     │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │  Application Business Rules     │ │ │
│  │  │  @Role(usecase)                 │ │ │
│  │  │  ┌───────────────────────────┐ │ │ │
│  │  │  │  Enterprise Business Rules│ │ │ │
│  │  │  │  @Role(entity)           │ │ │ │
│  │  │  └───────────────────────────┘ │ │ │
│  │  └─────────────────────────────────┘ │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Dependency Rule**: Inner layers cannot depend on outer layers. The LSP can validate this.

---

## 1. Lifecycle Annotations

Control how long objects live and their scope boundaries.

### `@LifeCycle(singleton)`

**Lives for entire application lifetime.** Single shared instance across the app.

```weft
@Role(repository)
@LifeCycle(singleton)
class ArticleRepository {
    // Created once, lives until app terminates
}
```

**Use for**: Repositories, services, managers that need to persist across the entire app.

---

### `@LifeCycle(session)`

**Lives for user session lifetime.** Created at login, destroyed at logout.

```weft
@Role(service)
@LifeCycle(session)
class AuthenticationService {
    var currentUser: User?
    var authToken: string?
    // Lives from login to logout
}
```

**Use for**: Authentication state, user-specific caches, session managers.

---

### `@LifeCycle(feature)`

**Lives during a feature or flow.** Created when entering a feature, destroyed when leaving.

```weft
@Role(viewmodel)
@LifeCycle(feature)
class CheckoutFlowCoordinator {
    // Lives during entire checkout flow (multiple screens)
}
```

**Use for**: Multi-screen flows, feature coordinators, feature-specific state.

---

### `@LifeCycle(view)`

**Lives while a single view/screen is visible.** Created when view appears, destroyed when dismissed.

```weft
@Role(viewmodel)
@LifeCycle(view)
class ArticleDetailViewModel {
    // Created when screen appears, destroyed when dismissed
}
```

**Use for**: ViewModels, screen-specific controllers, temporary screen state.

---

### Lifecycle Rules

**Valid dependency flow** (longer → shorter lifetimes only):

```
@LifeCycle(singleton)
    ├── Can inject into @LifeCycle(session)
    ├── Can inject into @LifeCycle(feature)
    └── Can inject into @LifeCycle(view)

@LifeCycle(session)
    ├── Can inject into @LifeCycle(feature)
    └── Can inject into @LifeCycle(view)

@LifeCycle(feature)
    └── Can inject into @LifeCycle(view)

@LifeCycle(view)
    └── Cannot inject into longer-lived scopes
```

**Note**: Protocols/interfaces do not have lifecycle annotations - only concrete implementations do.

---

## 2. Role Annotations

Define the architectural layer and responsibility of a type.

### `@Role(entity)`

**Layer**: Enterprise Business Rules (innermost)  
**Purpose**: Pure business objects with core domain logic  
**Dependencies**: None - cannot depend on any other layer

```weft
@Role(entity)
data Article {
    var id: string
    var title: string
    var content: string
    var publishedAt: DateTime
    var author: Author
    
    func isPublished() -> bool {
        return publishedAt <= DateTime.now()
    }
}

@Role(entity)
data Author {
    var id: string
    var name: string
    var email: string
}
```

**Key characteristics**:
- No framework dependencies (no database, no UI, no API)
- Pure business logic only
- Can contain methods that operate on their own data
- Can reference other entities
- Should be serializable for persistence

---

### `@Role(usecase)`

**Layer**: Application Business Rules  
**Purpose**: Orchestrate business logic and coordinate between entities and interfaces  
**Dependencies**: Can depend on entities and repository/service/gateway **interfaces**

```weft
@Role(usecase)
@LifeCycle(singleton)
class FetchArticlesUseCase {
    private var repository: ArticleRepository  // Interface!
    private var cache: CacheService  // Interface!
    
    @Instruction("Fetches articles with business-specific filtering and caching")
    func execute(filter: ArticleFilter?) async throws -> [Article] {
        // Check cache first
        if let cached = cache.get("articles") {
            return cached
        }
        
        // Fetch from repository
        let articles = await repository.fetchAll()
        
        // Apply business rules
        let filtered = filter ? articles.filter(filter.matches) : articles
        
        // Cache results
        cache.set("articles", filtered)
        
        return filtered
    }
}

@Role(usecase)
class PublishArticleUseCase {
    private var repository: ArticleRepository
    private var notificationService: NotificationService
    
    func execute(articleId: string) async throws {
        let article = await repository.findById(articleId)
        
        // Business rule: can't publish without title
        if article.title.isEmpty {
            throw ValidationError("Article must have a title")
        }
        
        article.markAsPublished()
        await repository.save(article)
        await notificationService.notifySubscribers(article)
    }
}
```

**Key characteristics**:
- Contains application-specific business rules
- Orchestrates workflows
- Depends on interfaces, not implementations
- Platform-independent

---

### `@Role(repository)`

**Layer**: Interface Adapters  
**Purpose**: Abstract interface for data access  
**Dependencies**: Can depend on entities and use cases  
**Note**: This is the **interface/protocol**, not the implementation

```weft
@Role(repository)
protocol ArticleRepository {
    func fetchAll() async throws -> [Article]
    func findById(id: string) async throws -> Article?
    func save(article: Article) async throws
    func delete(id: string) async throws
}

@Role(repository)
protocol UserRepository {
    func getCurrentUser() async -> User?
    func updateUser(user: User) async throws
}
```

**Key characteristics**:
- Defines contract for data access
- Returns domain entities, not DTOs
- No implementation details
- Platform-independent

**Implementation**: See `@Role(adapter)` for concrete implementations.

---

### `@Role(service)`

**Layer**: Interface Adapters  
**Purpose**: Abstract interface for business logic utilities  
**Dependencies**: Can depend on entities and use cases

```weft
@Role(service)
protocol AnalyticsService {
    func trackEvent(name: string, properties: [string: any]?)
    func trackScreen(name: string)
}

@Role(service)
protocol CacheService {
    func get<T>(key: string) -> T?
    func set<T>(key: string, value: T, ttl: Duration?)
    func clear()
}

@Role(service)
protocol ValidationService {
    func validateEmail(email: string) -> bool
    func validatePassword(password: string) -> ValidationResult
}
```

**Key characteristics**:
- Utilities and cross-cutting concerns
- Can be stateless or stateful
- Platform-independent interface

---

### `@Role(viewmodel)`

**Layer**: Interface Adapters  
**Purpose**: Presentation logic and view state management  
**Dependencies**: Can depend on entities, use cases, repositories, services

```weft
@Role(viewmodel)
@LifeCycle(view)
@Publisher
class ArticleListViewModel {
    private var fetchUseCase: FetchArticlesUseCase
    private var repository: ArticleRepository
    
    var articles: [Article] = []
    var isLoading: bool = false
    private(set) var errorMessage: string? = nil
    
    func loadArticles() async {
        isLoading = true
        errorMessage = nil
        
        try {
            articles = await fetchUseCase.execute(filter: nil)
        } catch error {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func refresh() async {
        await loadArticles()
    }
}
```

**Key characteristics**:
- Manages presentation state
- Transforms entities for UI display
- Handles user interactions
- Typically `@Publisher` for reactive UI updates
- Usually `@LifeCycle(view)` or `@LifeCycle(feature)`

---

### `@Role(gateway)`

**Layer**: Interface Adapters  
**Purpose**: Abstract interface for external services (non-data)  
**Dependencies**: Can depend on entities

```weft
@Role(gateway)
protocol PaymentGateway {
    func processPayment(amount: decimal, token: string) async throws -> PaymentResult
    func refund(transactionId: string) async throws
}

@Role(gateway)
protocol EmailGateway {
    func sendEmail(to: string, subject: string, body: string) async throws
}

@Role(gateway)
protocol PushNotificationGateway {
    func sendPushNotification(userId: string, message: string) async throws
}
```

**Key characteristics**:
- Abstracts external services (payment, email, push, etc.)
- Similar to repository but for non-data concerns
- Platform-independent interface

---

### `@Role(dto)`

**Layer**: Interface Adapters / Frameworks  
**Purpose**: Data Transfer Objects that cross boundaries (API, database)  
**Dependencies**: Minimal - often just primitives

```weft
@Role(dto)
@JSON
struct ArticleDTO {
    @JSONKey("article_id") var id: string
    @JSONKey("article_title") var title: string
    var content: string
    @JSONKey("published_date") var publishedAt: string
    
    @Instruction("Converts API response to domain entity")
    func toEntity() -> Article {
        return Article(
            id: id,
            title: title,
            content: content,
            publishedAt: DateTime.parse(publishedAt)
        )
    }
}

@Role(dto)
struct CreateArticleRequest {
    var title: string
    var content: string
    var authorId: string
    
    static func fromEntity(article: Article) -> CreateArticleRequest {
        return CreateArticleRequest(
            title: article.title,
            content: article.content,
            authorId: article.author.id
        )
    }
}
```

**Key characteristics**:
- Maps external data formats to domain entities
- Often annotated with `@JSON` or `@Schema`
- Contains conversion logic to/from entities
- Not used in core business logic

---

### `@Role(adapter)`

**Layer**: Frameworks & Drivers (outermost)  
**Purpose**: Concrete implementations of interfaces (repositories, services, gateways)  
**Dependencies**: Can depend on anything - this is the outermost layer

```weft
@Role(adapter)
@LifeCycle(singleton)
class ArticleRepositoryImpl: ArticleRepository {
    private var database: Database
    private var apiClient: APIClient
    
    func fetchAll() async throws -> [Article] {
        // Try local database first
        let schemas = await database.query(ArticleSchema.self)
        if !schemas.isEmpty {
            return schemas.map { $0.toEntity() }
        }
        
        // Fallback to API
        let dtos = await apiClient.get("/articles")
        let entities = dtos.map { $0.toEntity() }
        
        // Save to database
        await database.save(entities.map { ArticleSchema.from($0) })
        
        return entities
    }
    
    func save(article: Article) async throws {
        let schema = ArticleSchema.from(article)
        await database.save(schema)
    }
}

@Role(adapter)
@LifeCycle(singleton)
class StripePaymentAdapter: PaymentGateway {
    private var apiKey: string
    
    func processPayment(amount: decimal, token: string) async throws -> PaymentResult {
        // Stripe-specific implementation
        let response = await Stripe.charge(amount: amount, token: token, apiKey: apiKey)
        return PaymentResult(success: response.success, transactionId: response.id)
    }
}

@Role(adapter)
@LifeCycle(singleton)
class FirebaseAnalyticsAdapter: AnalyticsService {
    func trackEvent(name: string, properties: [string: any]?) {
        // Firebase-specific implementation
        FirebaseAnalytics.logEvent(name, parameters: properties)
    }
}
```

**Key characteristics**:
- Concrete implementations of interfaces
- Contains framework-specific code
- Handles external dependencies (databases, APIs, SDKs)
- Converts between DTOs/schemas and entities
- Usually `@LifeCycle(singleton)` or `@LifeCycle(session)`

---

## 3. State & Reactivity Annotations

Control how data flows through your application and what triggers UI updates.

### `@Publisher`

**Applied to**: Classes  
**Purpose**: Marks a class as having observable state that others can subscribe to

```weft
@Role(viewmodel)
@LifeCycle(view)
@Publisher
class ArticleListViewModel {
    // Public properties are observable
    var articles: [Article] = []
    var isLoading: bool = false
    
    // Readable externally but only writable internally (still observable)
    private(set) var errorMessage: string? = nil
    
    // Private properties are NOT observable
    private var cache: [string: Article] = [:]
}
```

**Rules for `@Publisher` classes**:
- **Public properties** → observable by subscribers
- **`private(set)` properties** → observable for reading, not writing
- **Private properties** → NOT observable
- Access modifiers control observability

**Typical use**: ViewModels, Repositories, Services that have changing state

---

### `@Subscriber`

**Applied to**: Properties  
**Purpose**: Explicitly marks a property as subscribing to a `@Publisher`

```weft
view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel  // Observes changes
    
    Column {
        for article in viewModel.articles {
            ArticleCard(article: article)
        }
    }
}

@Role(viewmodel)
@Publisher
class ParentViewModel {
    @Subscriber var repository: ArticleRepository  // Observes repository changes
    var articles: [Article] = []
}
```

**Parameters**:
- `writable: bool` - Whether subscriber can write back (default: false)
- `source: parent|environment` - Where the publisher comes from (default: parent)

```weft
view ChildView {
    @Subscriber(writable: true, source: parent) var count: int
    // Can read AND write - like @Binding
}
```

**Key characteristics**:
- Makes reactive relationships explicit
- Helps translator infer that the type must be a `@Publisher`
- Required on all properties that observe changes

---

### `@Binding`

**Applied to**: Properties  
**Purpose**: Syntactic sugar for two-way binding between parent and child

```weft
view ParentView {
    @LocalState var searchText = ""
    
    SearchBar(query: $searchText)  // Pass binding with $
}

view SearchBar {
    @Binding var query: string  // Two-way binding
    
    TextField(binding: $query)
}
```

**Equivalent to**: `@Subscriber(writable: true, source: parent)`

**Key characteristics**:
- Child can read AND write
- Changes propagate back to parent
- Use `$` prefix when passing to child
- Common for form inputs and controls

---

### `@LocalState`

**Applied to**: Properties  
**Purpose**: Marks ephemeral UI state that's local to a view  
**Restriction**: UI layer only (views)

```weft
view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel
    
    // Ephemeral UI state - not part of app state
    @LocalState var showFilters: bool = false
    @LocalState var selectedTab: int = 0
    @LocalState var searchText: string = ""
    
    Column {
        if showFilters {
            FilterPanel()
        }
    }
}
```

**Key characteristics**:
- View-only annotation (LSP should enforce)
- Not observable by others
- Resets when view is recreated
- For temporary UI state like expanded/collapsed, selected items, etc.

**Not used in**: ViewModels, Repositories, Services (use `@Publisher` + regular properties instead)

---

### State Management Summary

| Annotation | Where | Purpose |
|------------|-------|---------|
| `@Publisher` | Class | "This class has observable state" |
| `@Subscriber` | Property | "I observe this publisher" |
| `@Binding` | Property | "Two-way binding to parent" (sugar for `@Subscriber(writable: true)`) |
| `@LocalState` | Property | "Ephemeral UI state" (views only) |

---

## 4. Persistence Annotations

Control how data is stored, serialized, and mapped to external systems.

### Database Annotations

#### `@Schema`

Marks a type as a database table/schema definition.

```weft
@Schema
struct ArticleSchema {
    @Id(generated) var id: string
    @Index var title: string
    var content: string
    var publishedAt: DateTime
    @ForeignKey("authors") var authorId: string
    
    func toEntity(author: Author) -> Article {
        return Article(
            id: id,
            title: title,
            content: content,
            publishedAt: publishedAt,
            author: author
        )
    }
}
```

**Note**: `@Schema` is a framework-layer concern. Core business entities (`@Role(entity)`) should NOT be marked with `@Schema`.

---

#### `@Id(generated?)`

Marks the primary key field. Optional parameter: `generated` for auto-generated IDs.

```weft
@Schema
struct User {
    @Id(generated) var id: string  // Auto-generated
}

@Schema
struct Product {
    @Id var sku: string  // Manually assigned
}
```

---

#### `@ForeignKey("tableName")`

Marks a foreign key reference to another table.

```weft
@Schema
struct Comment {
    @Id(generated) var id: string
    @ForeignKey("articles") var articleId: string
    @ForeignKey("users") var authorId: string
    var content: string
}
```

---

#### `@Index`

Marks a field for database indexing (improves query performance).

```weft
@Schema
struct User {
    @Id(generated) var id: string
    @Index var email: string  // Fast lookups by email
    @Index var username: string
}
```

---

#### `@Unique`

Marks a field as having a unique constraint.

```weft
@Schema
struct User {
    @Id(generated) var id: string
    @Unique var email: string  // No duplicate emails
    @Unique var username: string
}
```

---

#### `@Required`

Marks a field as required/non-null.

```weft
@Schema
struct Article {
    @Id(generated) var id: string
    @Required var title: string  // Cannot be null
}
```

---

#### `@Nullable` / `@Optional`

Marks a field as allowing null values (interchangeable).

```weft
@Schema
struct User {
    @Id(generated) var id: string
    @Nullable var nickname: string?
    @Optional var bio: string?
}
```

---

#### `@Transient` / `@Ignore` / `@NotField` / `@Exclude`

Excludes a field from the database (all interchangeable).

```weft
@Schema
struct Article {
    @Id(generated) var id: string
    var title: string
    
    @Transient var isSelected: bool = false  // UI state only, not in DB
    @Ignore var cachedContent: string?  // Not persisted
}
```

---

### JSON Annotations

#### `@JSON`

Marks a type for automatic JSON serialization/deserialization.

```weft
@JSON
@Role(dto)
struct ArticleDTO {
    var id: string
    var title: string
    var content: string
}
```

---

#### `@JSONKey("fieldName")`

Customizes the JSON field name mapping.

```weft
@JSON
@Role(dto)
struct ArticleDTO {
    @JSONKey("article_id") var id: string
    @JSONKey("article_title") var title: string
    @JSONKey("published_date") var publishedAt: string
}
```

---

#### `@JSONIgnore`

Excludes a field from JSON serialization.

```weft
@JSON
@Role(dto)
struct UserDTO {
    var id: string
    var email: string
    @JSONIgnore var password: string  // Never serialize passwords
}
```

---

#### `@JSONFormat("formatString")`

Specifies date/time format for JSON serialization.

```weft
@JSON
@Role(dto)
struct EventDTO {
    var id: string
    @JSONFormat("yyyy-MM-dd'T'HH:mm:ssZ") var timestamp: DateTime
}
```

---

## 5. Documentation & Meta Annotations

Provide guidance and metadata for humans and translators.

### `@Main`

Marks the application entry point.

```weft
@Main
class MyApp: App {
    @LocalState var theme = Theme()
    
    var content: View {
        MainView() {
            environment: [theme]
        }
    }
}
```

**Only one per application.**

---

### `@Instruction(message)`

Provides specific guidance to translators about implementation details.

```weft
@Instruction('''
The API returns both featured_image and featured_image_full.
Please map the plain featured_image value during translation.
''')
func fetchArticle(id: string) async -> Article {
    // Implementation
}

@Role(adapter)
@Instruction("Use Realm for local persistence, Room for Android")
class LocalDatabaseAdapter: Database {
    // Implementation
}
```

**Use for**: Clarifying ambiguity, platform-specific notes, API quirks, edge cases.

---

### `@SumFunc`

Summarizes function logic in plain English (useful for complex functions).

```weft
func processPayment(cart: ShoppingCart) async throws -> Receipt {
    @SumFunc
    => Validate cart items are still available and prices haven't changed
    => Calculate total with tax and shipping
    => Process payment through gateway
    => Create order record in database
    => Send confirmation email
    => Return receipt
    
    // Actual implementation...
}
```

**Use for**: Complex workflows, multi-step processes, unclear logic.

---

### `@Index`

Documents directory contents and structure (placed in index files).

```weft
@Index('''
This directory contains all use cases for article management:
- FetchArticlesUseCase: Retrieves and filters articles
- PublishArticleUseCase: Publishes a draft article
- DeleteArticleUseCase: Soft-deletes an article
- ArchiveArticleUseCase: Archives an old article
''')
```

---

### `@Deprecated(message, since?, replacement?)`

Marks deprecated code with migration guidance.

```weft
@Deprecated(
    message: "Use @Publisher instead",
    since: "0.3.0",
    replacement: "@Publisher"
)
@Observable
class OldViewModel { }

@Deprecated("Use fetchArticles() instead")
func getArticles() -> [Article] {
    return fetchArticles()
}
```

**Parameters**:
- `message` (required): Why it's deprecated and what to use
- `since` (optional): Version when deprecated
- `replacement` (optional): Direct pointer to replacement

**LSP behavior**: Shows warnings when deprecated items are used.

---

## Annotation Combination Examples

### Repository Pattern

```weft
// Interface (inner layer)
@Role(repository)
protocol ArticleRepository {
    func fetchAll() async throws -> [Article]
}

// Implementation (outer layer)
@Role(adapter)
@LifeCycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository {
    private var database: Database
    
    var cachedArticles: [Article] = []  // Observable
    private var lastFetchTime: DateTime? = nil  // Not observable
    
    func fetchAll() async throws -> [Article] {
        cachedArticles = await database.query(ArticleSchema.self).map { $0.toEntity() }
        lastFetchTime = DateTime.now()
        return cachedArticles
    }
}
```

---

### Use Case Pattern

```weft
@Role(usecase)
@LifeCycle(singleton)
class PublishArticleUseCase {
    private var articleRepository: ArticleRepository
    private var notificationGateway: NotificationGateway
    private var analyticsService: AnalyticsService
    
    @Instruction("Validates article before publishing and notifies subscribers")
    func execute(articleId: string) async throws {
        @SumFunc
        => Fetch article from repository
        => Validate article has required fields
        => Mark article as published
        => Save to repository
        => Send notifications to subscribers
        => Track analytics event
        
        let article = await articleRepository.findById(articleId)
        
        guard !article.title.isEmpty else {
            throw ValidationError("Article must have a title")
        }
        
        article.markAsPublished()
        await articleRepository.save(article)
        await notificationGateway.notifySubscribers(article)
        analyticsService.trackEvent("article_published", properties: ["id": article.id])
    }
}
```

---

### ViewModel Pattern

```weft
@Role(viewmodel)
@LifeCycle(view)
@Publisher
class ArticleListViewModel {
    private var fetchUseCase: FetchArticlesUseCase
    @Subscriber private var repository: ArticleRepository
    
    var articles: [Article] = []
    var isLoading: bool = false
    private(set) var errorMessage: string? = nil
    
    func loadArticles() async {
        isLoading = true
        errorMessage = nil
        
        try {
            articles = await fetchUseCase.execute(filter: nil)
        } catch error {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
}
```

---

### View Pattern

```weft
view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel
    @LocalState var showFilters: bool = false
    @LocalState var selectedSortOption: SortOption = .newest
    
    Column(isScrollable: true) {
        Row {
            Button("Filters") {
                showFilters.toggle()
            }
            Spacer()
            SortPicker(selection: $selectedSortOption)
        }
        
        if showFilters {
            FilterPanel()
        }
        
        if viewModel.isLoading {
            LoadingSpinner()
        } else {
            for article in viewModel.articles {
                ArticleCard(article: article)
            }
        }
    }
    .onAppear {
        await viewModel.loadArticles()
    }
}
```

---

## Dependency Rules & Validation

The LSP validates the following rules:

### 1. Layer Dependencies

```weft
// ✅ VALID: Use case depends on entity
@Role(usecase)
class PublishArticle {
    func execute(article: Article) { }  // Article is @Role(entity)
}

// ✅ VALID: Use case depends on repository interface
@Role(usecase)
class FetchArticles {
    private var repository: ArticleRepository  // Interface
}

// ❌ INVALID: Entity depends on use case (wrong direction!)
@Role(entity)
data Article {
    var useCase: PublishArticleUseCase  // ERROR
}

// ❌ INVALID: Use case depends on adapter (should depend on interface)
@Role(usecase)
class FetchArticles {
    private var repository: ArticleRepositoryImpl  // ERROR: use interface instead
}
```

### 2. Lifecycle Dependencies

```weft
// ✅ VALID: ViewScoped depends on Singleton
@Role(viewmodel)
@LifeCycle(view)
class ArticleViewModel {
    private var repository: ArticleRepository  // Singleton
}

// ❌ INVALID: Singleton depends on ViewScoped
@Role(repository)
@LifeCycle(singleton)
class ArticleRepository {
    private var viewModel: ArticleViewModel  // ERROR: can't inject shorter-lived dependency
}
```

### 3. State Annotations

```weft
// ✅ VALID: @Subscriber on property that references @Publisher
@Publisher
class ViewModel { }

view MyView {
    @Subscriber var viewModel: ViewModel  // Valid
}

// ❌ INVALID: @Subscriber without @Publisher
class RegularClass { }

view MyView {
    @Subscriber var obj: RegularClass  // ERROR: RegularClass is not @Publisher
}

// ❌ INVALID: @LocalState outside of view
@Role(viewmodel)
class ViewModel {
    @LocalState var count: int = 0  // ERROR: @LocalState only allowed in views
}
```

### Configuration

Control validation strictness in `weft.settings.json`:

```json
{
  "validation": {
    "dependencyRule": "error",      // "error" | "warning" | "off"
    "layerViolations": "error",     // Enforce Clean Architecture layers
    "lifecycleViolations": "warning",
    "stateAnnotations": "warning"
  },
  "architecture": {
    "style": "clean"  // Future: support other architectural styles
  }
}
```

---

## Migration from v0.2.0

### Deprecated Annotations

| Old | New | Migration |
|-----|-----|-----------|
| `@Observable` | `@Publisher` | Replace all occurrences |
| `@Singleton` | `@LifeCycle(singleton)` | Parameterized form |
| `@ViewScoped` | `@LifeCycle(view)` | Parameterized form |
| `@FeatureScoped` | `@LifeCycle(feature)` | Parameterized form |
| `@SessionScoped` | `@LifeCycle(session)` | Parameterized form |
| `@Repository` | `@Role(repository)` | Parameterized form |
| `@ViewModel` | `@Role(viewmodel)` | Parameterized form |
| `@Service` | `@Role(service)` | Parameterized form |
| `@State` | `@LocalState` | More explicit naming |
| `@Entity` (DB) | `@Schema` | Use `@Role(entity)` for business objects |

### Example Migration

**Before (v0.2.0)**:
```weft
@Observable
@Repository
@Singleton
class ArticleRepository {
    private(set) var articles: [Article] = []
}

@Observable
@ViewModel
@ViewScoped
class ArticleListViewModel {
    @State var errorMessage: string? = nil
}

view ArticleListView {
    
    var viewModel: ArticleListViewModel
    @State var showFilters: bool = false
}
```

**After (v0.3.0)**:
```weft
@Role(repository)
@LifeCycle(singleton)
@Publisher
class ArticleRepository {
    var articles: [Article] = []  // Implicitly observable (public)
}

@Role(viewmodel)
@LifeCycle(view)
@Publisher
class ArticleListViewModel {
    @LocalState var errorMessage: string? = nil
}

view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel  // Explicit subscription
    @LocalState var showFilters: bool = false
}
```

---

## Quick Reference Table

| Annotation | Category | Purpose | Example |
|------------|----------|---------|---------|
| **Lifecycle** |
| `@LifeCycle(singleton)` | Scope | App lifetime | `@LifeCycle(singleton)` |
| `@LifeCycle(session)` | Scope | User session | `@LifeCycle(session)` |
| `@LifeCycle(feature)` | Scope | Feature flow | `@LifeCycle(feature)` |
| `@LifeCycle(view)` | Scope | Single screen | `@LifeCycle(view)` |
| **Role** |
| `@Role(entity)` | Architecture | Business object | `@Role(entity) data Article` |
| `@Role(usecase)` | Architecture | Business rules | `@Role(usecase) class FetchArticles` |
| `@Role(repository)` | Architecture | Data interface | `@Role(repository) protocol ArticleRepo` |
| `@Role(service)` | Architecture | Utility interface | `@Role(service) protocol Analytics` |
| `@Role(viewmodel)` | Architecture | Presentation logic | `@Role(viewmodel) class ArticleVM` |
| `@Role(gateway)` | Architecture | External service interface | `@Role(gateway) protocol PaymentGateway` |
| `@Role(dto)` | Architecture | Data transfer object | `@Role(dto) struct ArticleDTO` |
| `@Role(adapter)` | Architecture | Concrete implementation | `@Role(adapter) class RepoImpl` |
| **State & Reactivity** |
| `@Publisher` | State | Has observable state | `@Publisher class ViewModel` |
| `@Subscriber` | State | Observes publisher | `@Subscriber var vm: ViewModel` |
| `@Binding` | State | Two-way binding | `@Binding var text: string` |
| `@LocalState` | State | Ephemeral UI state | `@LocalState var expanded: bool` |
| **Database** |
| `@Schema` | Persistence | Database table | `@Schema struct UserSchema` |
| `@Id(generated?)` | Persistence | Primary key | `@Id(generated) var id: string` |
| `@ForeignKey("table")` | Persistence | Foreign key | `@ForeignKey("users") var userId` |
| `@Index` | Persistence | Database index | `@Index var email: string` |
| `@Unique` | Persistence | Unique constraint | `@Unique var email: string` |
| `@Required` | Persistence | Non-null field | `@Required var name: string` |
| `@Nullable` / `@Optional` | Persistence | Nullable field | `@Nullable var bio: string?` |
| `@Transient` / `@Ignore` | Persistence | Exclude from DB | `@Transient var selected: bool` |
| **JSON** |
| `@JSON` | Serialization | JSON serializable | `@JSON struct ArticleDTO` |
| `@JSONKey("name")` | Serialization | Custom field name | `@JSONKey("user_id") var userId` |
| `@JSONIgnore` | Serialization | Exclude from JSON | `@JSONIgnore var password` |
| `@JSONFormat("format")` | Serialization | Date format | `@JSONFormat("yyyy-MM-dd") var date` |
| **Documentation** |
| `@Main` | Meta | App entry point | `@Main class MyApp: App` |
| `@Instruction(msg)` | Meta | Translator guidance | `@Instruction("Use Firebase")` |
| `@SumFunc` | Meta | Function summary | `@SumFunc => step 1 => step 2` |
| `@Index` | Meta | Directory docs | `@Index('''contents''')` |
| `@Deprecated(msg)` | Meta | Deprecated code | `@Deprecated("Use X instead")` |

---

## See Also

- [Architecture: Overview](../architecture/01-overview.md) - Architecture patterns and philosophy
- [Architecture: Lifecycle & Scope](../architecture/02-lifecycle-scope.md) - Detailed lifecycle docs
- [Architecture: State Ownership](../architecture/04-state-ownership.md) - State management patterns
- [Data: JSON](../data/01-json.md) - JSON serialization
- [Data: Databases](../data/02-databases.md) - Database schemas
- [Language: Annotations](../language/07-annotations.md) - Core language annotations

---

**Version:** 0.3.0  
**Last Updated:** January 2025
