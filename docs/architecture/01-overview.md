# Architecture Overview

Weft provides first-class support for **Clean Architecture** through annotations and semantic type definitions. This enables you to build scalable, maintainable applications with clear separation of concerns and enforced dependency rules.

## What is Clean Architecture?

Clean Architecture is a software design philosophy that organizes code into concentric layers, with the most important business rules at the center and implementation details at the edges.

### The Core Principle: The Dependency Rule

**Source code dependencies must point only inward, toward higher-level policies.**

This means:
- **Inner layers** contain business logic and are independent of frameworks
- **Outer layers** contain implementation details (UI, databases, APIs)
- **Inner layers cannot depend on outer layers**
- **Outer layers can depend on inner layers**

```
┌─────────────────────────────────────────────┐
│  FRAMEWORKS & DRIVERS                       │  ← Outermost
│  @Role(adapter), @Schema                    │     (Implementation details)
│  ┌────────────────────────────────────────┐ │
│  │  INTERFACE ADAPTERS                    │ │
│  │  @Role(repository|service|             │ │
│  │        viewmodel|gateway)              │ │
│  │  ┌───────────────────────────────────┐ │ │
│  │  │  USE CASES                        │ │ │
│  │  │  @Role(usecase)                   │ │ │
│  │  │  ┌─────────────────────────────┐  │ │ │
│  │  │  │  ENTITIES                   │  │ │ │  ← Innermost
│  │  │  │  @Role(entity)              │  │ │ │     (Business rules)
│  │  │  └─────────────────────────────┘  │ │ │
│  │  └───────────────────────────────────┘ │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Why Clean Architecture?

**Benefits:**
1. **Independent of frameworks** - Business logic doesn't depend on UI or database frameworks
2. **Testable** - Business rules can be tested without UI, database, or external services
3. **Independent of UI** - Can swap SwiftUI for UIKit without changing business logic
4. **Independent of database** - Can swap Core Data for Realm without changing business logic
5. **Independent of external services** - Business rules don't know about the outside world
6. **Scalable** - Clear boundaries make it easy to add features and grow the codebase

## Weft's Architecture Layers

Weft maps Clean Architecture layers to specific role annotations:

### 1. Entities Layer (Innermost)

**@Role(entity)** - Core business objects with no dependencies

```weft
@Role(entity)
data Article {
    var id: string
    var title: string
    var content: string
    var publishedAt: datetime?
    
    func isPublished() -> bool {
        if let published = publishedAt {
            return published <= datetime.now()
        }
        return false
    }
}
```

**Characteristics:**
- Pure business objects
- No framework dependencies
- Can contain business logic
- Cannot depend on any other layer

### 2. Use Cases Layer

**@Role(usecase)** - Application-specific business rules

```weft
@Role(usecase)
class PublishArticleUseCase {
    private var repository: ArticleRepository  // Interface, not implementation
    private var emailService: EmailService     // Interface, not implementation
    
    func execute(articleId: string) async throws {
        @SumFunc
        => fetch article from repository
        => validate article is ready for publishing
        => set published date to now
        => save article back to repository
        => send notification email to subscribers
    }
}
```

**Characteristics:**
- Contains application business rules
- Orchestrates entities
- Depends only on entities and interfaces (not implementations)
- Independent of UI and frameworks

### 3. Interface Adapters Layer

This layer contains interfaces that define contracts between layers.

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
protocol EmailService {
    func sendEmail(to: string, subject: string, body: string) async throws
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
        => create Article entity from DTO
        => map external field names to entity properties
        => return entity
    }
}
```

**Characteristics:**
- Define contracts between layers
- ViewModels coordinate presentation logic
- DTOs handle boundary crossing (API/DB ↔ entities)
- Depend on entities and use cases

### 4. Frameworks & Drivers Layer (Outermost)

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
        var dtos: [ArticleDTO] = await api.fetchArticles()
        articles = dtos.map(dto => dto.toEntity())
        await database.saveArticles(articles)
    }
}
```

**@Schema** - Database mapping (framework concern)
```weft
@Schema
data ArticleRowSchema {
    @Index var id: string
    var title: string
    var content: string
    var published_at: datetime?
}
```

**Characteristics:**
- Concrete implementations of interfaces
- Framework-specific code (API clients, databases)
- Can depend on anything (outermost layer)
- Business logic doesn't depend on these

## State Management

State in Weft is explicit and observable:

### @Publisher - Observable State

Classes marked as `@Publisher` have observable state that changes over time:

```weft
@Role(adapter)
@Lifecycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository {
    private(set) var articles: [Article] = []  // Observable
    private(set) var isLoading: bool = false   // Observable
}
```

### @Subscriber - Observe Publishers

Properties marked as `@Subscriber` observe publishers and receive updates:

```weft
@Role(viewmodel)
@Publisher
class ArticleListViewModel {
    @Subscriber private var repository: ArticleRepository  // Observes changes
    
    var articles: [Article] {
        return repository.articles  // Auto-updates when repository changes
    }
}
```

### @LocalState - Ephemeral UI State

Views use `@LocalState` for ephemeral UI state that doesn't need to persist:

```weft
view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel
    @LocalState var showFilters: bool = false  // UI-only state
    
    Column {
        if showFilters {
            FilterPanel()
        }
    }
}
```

## Lifecycle and Scope

Different parts of your application have different lifetimes:

```weft
@Lifecycle(singleton)  // Lives for entire app
@Lifecycle(session)    // Lives while user is logged in
@Lifecycle(feature)    // Lives while feature is active
@Lifecycle(view)       // Lives while view is visible
```

**Dependency hierarchy:** Longer-lived → shorter-lived only

```weft
// ✅ Valid: View-scoped depends on singleton
@Role(viewmodel)
@Lifecycle(view)
class MyViewModel {
    private var repository: ArticleRepository  // @Lifecycle(singleton)
}

// ❌ Invalid: Singleton depends on view-scoped
@Role(adapter)
@Lifecycle(singleton)
class MyRepository {
    private var viewModel: MyViewModel  // @Lifecycle(view) - ERROR!
}
```

## Basic Architecture Pattern

Here's a typical Weft application structure:

```weft
// ============================================
// ENTITIES LAYER - Core business objects
// ============================================

@Role(entity)
data Article {
    var id: string
    var title: string
    var content: string
    var publishedAt: datetime?
}

// ============================================
// DATA LAYER - Repository interface + DTO
// ============================================

@Role(dto)
data ArticleDTO {
    var id: string
    var title: string
    
    func toEntity() -> Article {
        return Article(id: id, title: title, content: "", publishedAt: null)
    }
}

@Role(repository)
protocol ArticleRepository {
    var articles: [Article] { get }
    var isLoading: bool { get }
    func fetchArticles() async throws
}

@Role(adapter)
@Lifecycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository {
    private var api: APIClient
    private var database: Database
    
    private(set) var articles: [Article] = []
    private(set) var isLoading: bool = false
    
    func fetchArticles() async throws {
        isLoading = true
        
        var dtos: [ArticleDTO] = await api.fetchArticles()
        articles = dtos.map(dto => dto.toEntity())
        await database.saveArticles(articles)
        
        isLoading = false
    }
}

// ============================================
// PRESENTATION LAYER - ViewModel
// ============================================

@Role(viewmodel)
@Lifecycle(view)
@Publisher
class ArticleListViewModel {
    @Subscriber private var repository: ArticleRepository
    
    var errorMessage: string? = null
    
    var articles: [Article] {
        return repository.articles
    }
    
    var isLoading: bool {
        return repository.isLoading
    }
    
    func refresh() async {
        try {
            await repository.fetchArticles()
        } catch error {
            errorMessage = error.message
        }
    }
}

// ============================================
// UI LAYER - View
// ============================================

view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel
    
    Column(isScrollable: true) {
        if viewModel.isLoading {
            LoadingSpinner()
        } else {
            for article in viewModel.articles {
                ArticleCard(article: article)
            }
        }
        
        if let error = viewModel.errorMessage {
            ErrorBanner(message: error)
        }
    }
}
```

## Data Flow

### Unidirectional Data Flow

Data flows in one direction through the architecture:

```
User Action
    ↓
  View
    ↓
ViewModel
    ↓
Use Case (optional)
    ↓
Repository
    ↓
Entity
    ↓
API/Database
    ↓
Observable State Updates
    ↓
ViewModel Recomputes
    ↓
View Re-renders
```

1. User interacts with **View**
2. View calls **ViewModel** method
3. ViewModel calls **Use Case** or **Repository**
4. Repository updates **Entities**
5. Repository publishes state changes
6. ViewModel automatically recomputes properties
7. View automatically re-renders

**Key principle:** State flows down, events flow up.

### State Propagation

When state changes, it automatically propagates through observers:

```weft
// Repository updates state
@Role(adapter)
@Lifecycle(singleton)
@Publisher
class UserRepository {
    private(set) var currentUser: User? = null
    
    func login(credentials: Credentials) async {
        currentUser = await api.login(credentials)
        // All @Subscriber properties automatically notified
    }
}

// Multiple ViewModels observe the same repository
@Role(viewmodel)
@Publisher
class ProfileViewModel {
    @Subscriber private var userRepository: UserRepository
    
    var userName: string? {
        return userRepository.currentUser?.name  // Auto-updates
    }
}

@Role(viewmodel)
@Publisher
class NavBarViewModel {
    @Subscriber private var userRepository: UserRepository
    
    var isLoggedIn: bool {
        return userRepository.currentUser != null  // Auto-updates
    }
}
```

## Dependency Injection

Dependencies are automatically provided based on lifecycle:

```weft
// The system knows:
// 1. ArticleRepositoryImpl is @Lifecycle(singleton) - create once, reuse
// 2. ArticleListViewModel is @Lifecycle(view) - create per view
// 3. ViewModel needs repository - inject the singleton

@Role(adapter)
@Lifecycle(singleton)
class ArticleRepositoryImpl: ArticleRepository { }

@Role(viewmodel)
@Lifecycle(view)
@Publisher
class ArticleListViewModel {
    private var repository: ArticleRepository  // Injected automatically
}
```

The translator generates platform-specific dependency injection code.

## Validation and Enforcement

The Weft LSP validates Clean Architecture rules in real-time:

**Dependency Rule Validation:**
```weft
// ❌ LSP Error: Entity cannot depend on Repository
@Role(entity)
data Article {
    private var repository: ArticleRepository  // ERROR!
}

// ✅ OK: Use Case depends on Repository interface
@Role(usecase)
class PublishArticleUseCase {
    private var repository: ArticleRepository  // OK
}
```

**Lifecycle Validation:**
```weft
// ❌ LSP Error: Singleton cannot depend on view-scoped
@Role(adapter)
@Lifecycle(singleton)
class MyRepository {
    private var viewModel: MyViewModel  // @Lifecycle(view) - ERROR!
}
```

**State Annotation Validation:**
```weft
// ❌ LSP Warning: Missing @Subscriber
@Role(viewmodel)
class MyViewModel {
    private var repository: ArticleRepository  // Warning!
}

// ✅ OK: Explicit @Subscriber
@Role(viewmodel)
class MyViewModel {
    @Subscriber private var repository: ArticleRepository
}
```

### Configuration

```json
// weft.settings.json
{
  "validation": {
    "dependencyRule": "error",         // Enforce CA dependency rule
    "layerViolations": "error",        // Enforce layer boundaries
    "lifecycleViolations": "warning",  // Warn on lifecycle issues
    "stateAnnotations": "warning"      // Warn on missing @Subscriber
  },
  "architecture": {
    "style": "clean"
  }
}
```

## Benefits of This Architecture

**Testability:** Each layer can be tested independently with mock dependencies.

```weft
// Test use case with mock repository
func testPublishArticle() {
    var mockRepo = MockArticleRepository()
    var useCase = PublishArticleUseCase(repository: mockRepo)
    
    await useCase.execute("article-123")
    
    assert(mockRepo.savedArticle?.publishedAt != null)
}
```

**Scalability:** Clear boundaries make it easy to add features without affecting existing code.

**Maintainability:** Well-defined responsibilities make code easier to understand and modify.

**Reusability:** Repositories and services can be shared across multiple ViewModels and use cases.

**Type Safety:** Weft's strict typing catches errors early in the development process.

**Platform Agnostic:** The same architecture translates cleanly to Swift, Kotlin, TypeScript, etc.

## Next Steps

Continue reading to learn about each architectural concept in depth:

1. [Lifecycle & Scope](02-lifecycle-scope.md) - Controlling object lifetimes
2. [Observability](03-observability.md) - Making state reactive with @Publisher
3. [Patterns Overview](04-roles-and-patterns.md) - Repositories, ViewModels, and Services

## See Also

- [Annotations Reference](../reference/annotations.md) - Complete annotation guide
- [Types](../language/01-types.md) - Type system
- [Views](../ui/01-views.md) - UI patterns