# Architecture Overview

Weft provides first-class support for modern application architecture patterns through annotations and semantic type definitions. This section covers how to design scalable, maintainable applications using Weft's architecture features.

## Core Concepts

### Separation of Concerns

Well-architected applications separate different responsibilities into distinct layers:

- **Data Layer**: Repositories manage data access and persistence
- **Business Logic Layer**: Services handle business rules and operations
- **Presentation Layer**: ViewModels coordinate UI state and user interactions
- **UI Layer**: Views render user interfaces and handle user input

Each layer has clear responsibilities and well-defined boundaries.

### State Management

State in Weft is explicit and observable. The framework provides annotations to express:

- **Who owns the state**: `@State` for local ownership
- **How state is observed**: `@Observable` for reactive state
- **How state flows**: `@Binding` for parent-child communication
- **Where state lives**: `@Environment` for app-wide context

### Lifecycle and Scope

Different parts of your application have different lifetimes:

- **Application scope**: Lives for the entire app lifetime (singletons)
- **Feature scope**: Lives while a feature is active
- **View scope**: Lives while a view/screen is visible
- **Session scope**: Lives while a user session is active

Weft makes lifecycle explicit through scope annotations.

## Architecture Annotations

### Semantic Type Annotations

Tell the translator what role a type plays:

```weft
@Repository - Data layer abstraction
@Service - Business logic and utilities
@ViewModel - Presentation layer coordinator
```

### Lifecycle Annotations

Specify how long instances live:

```weft
@Singleton - Application lifetime
@ViewScoped - View/screen lifetime
@FeatureScoped - Feature lifetime
@SessionScoped - User session lifetime
```

### Observability Annotations

Control reactive state:

```weft
@Observable - Type has observable state
@State - Local state ownership
@Binding - Two-way parent-child binding
@Environment - App-wide context injection
```

## Basic Architecture Pattern

A typical Weft application follows this pattern:

```weft
// Data Layer
@Repository
@Singleton
@Observable
class ArticleRepository {
    private var api: APIClient
    private var database: Database
    
    private(set) var articles: [Article] = []
    private(set) var isLoading: bool = false
    
    func fetchArticles() async {
        isLoading = true
        articles = await api.fetchArticles()
        await database.saveArticles(articles)
        isLoading = false
    }
}

// Presentation Layer
@ViewModel
@ViewScoped
class ArticleListViewModel {
    private var repository: ArticleRepository
    
    @State var errorMessage: string? = null
    
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

// UI Layer
view ArticleListView {
    var viewModel: ArticleListViewModel
    
    Column(isScrollable: true) {
        if viewModel.isLoading {
            LoadingSpinner()
        } else {
            for article in viewModel.articles {
                ArticleCard(article: article)
            }
        }
    }
}
```

## Data Flow

### Unidirectional Data Flow

Data flows in one direction through the architecture:

```
User Action → ViewModel → Repository → Data Source
                ↓             ↓
              View  ←  Observable State
```

1. User interacts with View
2. View calls ViewModel method
3. ViewModel coordinates with Repository
4. Repository updates its state
5. Observable state changes trigger UI updates
6. View re-renders with new data

### State Propagation

When state changes, it automatically propagates:

```weft
@Repository
@Singleton
@Observable
class UserRepository {
    private(set) var currentUser: User? = null
    
    func login(credentials: Credentials) async {
        currentUser = await api.login(credentials)
        // All observers automatically notified
    }
}

// Multiple ViewModels can observe the same repository
@ViewModel
class ProfileViewModel {
    private var userRepository: UserRepository
    
    var user: User? {
        return userRepository.currentUser
    }
}

@ViewModel
class SettingsViewModel {
    private var userRepository: UserRepository
    
    var isLoggedIn: bool {
        return userRepository.currentUser != null
    }
}
```

## Benefits of This Architecture

**Testability**: Each layer can be tested independently with mock dependencies.

**Scalability**: Clear boundaries make it easy to add features without affecting existing code.

**Maintainability**: Well-defined responsibilities make code easier to understand and modify.

**Reusability**: Repositories and services can be shared across multiple ViewModels.

**Type Safety**: Weft's strict typing catches errors early in the development process.

**Platform Agnostic**: The same architecture translates cleanly to Swift, Kotlin, TypeScript, etc.

## Architecture Layers in Detail

### Repository Layer

Repositories abstract data sources and provide a clean API for data access:

- Coordinate between network, database, and cache
- Handle data transformation and mapping
- Provide observable streams of data
- Manage data consistency

See [Repositories](05-repositories.md) for details.

### ViewModel Layer

ViewModels coordinate presentation logic and UI state:

- Transform repository data for UI display
- Handle user interactions
- Manage local UI state
- Coordinate multiple repositories/services

See [ViewModels](06-viewmodels.md) for details.

### Service Layer

Services provide business logic and utilities:

- Implement business rules
- Coordinate cross-cutting concerns
- Provide stateless operations
- Handle integrations with external systems

See [Services](07-services.md) for details.

## Example: Complete Feature

Here's how all the pieces fit together for a complete feature:

```weft
// 1. Data Layer - Repository
@Repository
@Singleton
@Observable
class ArticleRepository {
    private var api: APIClient
    private var database: Database
    
    private(set) var articles: [Article] = []
    
    func fetchArticles() async {
        var fresh = await api.fetchArticles()
        await database.saveArticles(fresh)
        articles = fresh
    }
    
    func bookmarkArticle(id: string) async {
        var article = articles.find(a => a.id == id)
        if let article = article {
            article.isBookmarked = true
            await database.updateArticle(article)
        }
    }
}

// 2. Business Logic - Service
@Service
@Singleton
class AnalyticsService {
    func trackArticleView(articleId: string) {
        logEvent("article_viewed", ["article_id": articleId])
    }
    
    func trackBookmark(articleId: string) {
        logEvent("article_bookmarked", ["article_id": articleId])
    }
}

// 3. Presentation Layer - ViewModel
@ViewModel
@ViewScoped
class ArticleListViewModel {
    private var repository: ArticleRepository
    private var analytics: AnalyticsService
    
    @State var isRefreshing: bool = false
    @State var errorMessage: string? = null
    
    var articles: [Article] {
        return repository.articles
    }
    
    func refresh() async {
        isRefreshing = true
        errorMessage = null
        
        try {
            await repository.fetchArticles()
        } catch error {
            errorMessage = "Failed to load articles"
        } finally {
            isRefreshing = false
        }
    }
    
    func bookmarkArticle(id: string) async {
        await repository.bookmarkArticle(id)
        analytics.trackBookmark(id)
    }
}

// 4. UI Layer - View
view ArticleListView {
    var viewModel: ArticleListViewModel
    @Environment var theme: Theme
    
    Column(
        isScrollable: true
        onRefresh: viewModel.refresh()
    ) {
        if viewModel.isRefreshing {
            LoadingSpinner()
        } else if let error = viewModel.errorMessage {
            ErrorView(message: error)
        } else {
            for article in viewModel.articles {
                ArticleCard(
                    article: article,
                    onBookmark: { viewModel.bookmarkArticle(article.id) }
                )
            }
        }
    }
}
```

## Next Steps

Continue reading to learn about each architectural concept in depth:

1. [Observability](02-observability.md) - Making state reactive
2. [State Ownership](03-state-ownership.md) - Managing state lifecycle
3. [Lifecycle & Scope](04-lifecycle-scope.md) - Controlling object lifetimes
4. [Repositories](05-repositories.md) - Data layer pattern
5. [ViewModels](06-viewmodels.md) - Presentation layer pattern
6. [Services](07-services.md) - Business logic pattern
7. [Dependency Flow](08-dependency-flow.md) - How dependencies work
8. [Complete Example](09-complete-example.md) - Full application architecture

## See Also

- [State Management](../ui/01-views.md) - UI state patterns
- [Types](../language/01-types.md) - Type system
- [Definitions](../structure/01-definitions.md) - Type definitions