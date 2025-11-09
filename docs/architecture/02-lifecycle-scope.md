# Lifecycle & Scope

Lifecycle and scope define how long objects live in your application. Weft makes lifecycle explicit through the `@LifeCycle` annotation, helping you understand when objects are created, shared, and destroyed.

## Understanding Scope

**Scope** determines the lifetime of an object—how long it exists and who can access it.

Different parts of your application have different lifetimes:

- **Application scope**: Lives for the entire app (singleton pattern)
- **Session scope**: Lives while a user session is active
- **Feature scope**: Lives while a feature or flow is active
- **View scope**: Lives while a view/screen is visible

Making scope explicit helps you reason about:
- When objects are created
- When objects are destroyed
- Whether objects are shared or unique
- Memory management and resource cleanup

## The @LifeCycle Annotation

Use `@LifeCycle` with a parameter to specify how long an instance should live:

```weft
@LifeCycle(singleton|session|feature|view)
```

**Note:** Protocols (interfaces) do not have lifecycle annotations. Only concrete implementations have lifecycles.

## Lifecycle Scopes

### @LifeCycle(singleton)

Objects live for the entire application lifetime. Only one instance exists, shared across the entire app.

```weft
@Role(repository)
protocol ArticleRepository {
    var articles: [Article] { get }
    func fetchArticles() async
}

@Role(adapter)
@LifeCycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository {
    private var api: APIClient
    private var database: Database

    private(set) var articles: [Article] = []

    func fetchArticles() async {
        articles = await api.fetchArticles()
        await database.saveArticles(articles)
    }
}
```

**Use @LifeCycle(singleton) for:**
- Repository implementations (data layer)
- Core services (analytics, auth, networking)
- App-wide configuration
- Shared caches
- Resource managers

**Characteristics:**
- Created once when first needed
- Lives until app terminates
- Shared across all features and views
- Maintains state across navigation

### @LifeCycle(view)

Objects live while a specific view/screen is visible. Each view gets its own instance.

```weft
@Role(viewmodel)
@LifeCycle(view)
@Publisher
class ArticleDetailViewModel {
    private var repository: ArticleRepository  // Singleton

    var article: Article? = null
    var isLoading: bool = false

    func loadArticle(id: string) async {
        isLoading = true
        article = await repository.getArticle(id)
        isLoading = false
    }
}
```

**Use @LifeCycle(view) for:**
- ViewModels
- Screen-specific state
- View controllers
- Temporary UI coordinators

**Characteristics:**
- Created when view appears
- Destroyed when view is dismissed
- Not shared between views
- Local state is cleaned up automatically

### @LifeCycle(feature)

Objects live while a feature or user flow is active.

```weft
@Role(service)
protocol CheckoutService {
    var cart: ShoppingCart { get }
    func completeCheckout() async
}

@Role(adapter)
@LifeCycle(feature)
@Publisher
class CheckoutServiceImpl: CheckoutService {
    private(set) var cart: ShoppingCart
    private(set) var paymentMethod: PaymentMethod? = null
    private(set) var shippingAddress: Address? = null

    func completeCheckout() async {
        @SumFunc
        => validate cart has items
        => validate payment method is set
        => validate shipping address is set
        => process payment through gateway
        => create order record
        => clear cart
    }
}
```

**Use @LifeCycle(feature) for:**
- Multi-step flows (checkout, onboarding)
- Feature-specific caches
- Wizard or form state
- Temporary workflows

**Characteristics:**
- Created when entering feature
- Destroyed when exiting feature
- Shared across views within feature
- State persists across feature navigation

### @LifeCycle(session)

Objects live while a user session is active (typically while authenticated).

```weft
@Role(service)
protocol AuthService {
    var currentUser: User? { get }
    func login(credentials: Credentials) async
    func logout()
}

@Role(adapter)
@LifeCycle(session)
@Publisher
class AuthServiceImpl: AuthService {
    private(set) var authToken: string? = null
    private(set) var currentUser: User? = null
    private(set) var preferences: UserPreferences? = null

    func login(credentials: Credentials) async {
        var response = await api.login(credentials)
        currentUser = response.user
        authToken = response.token
        preferences = await api.fetchPreferences()
    }

    func logout() {
        currentUser = null
        authToken = null
        preferences = null
    }
}
```

**Use @LifeCycle(session) for:**
- Authentication state
- User-specific services
- Session-specific caches
- Temporary user data

**Characteristics:**
- Created at login
- Destroyed at logout
- Persists across app navigation
- Tied to authentication lifecycle

## Scope Hierarchy

Scopes form a hierarchy—shorter-lived scopes can depend on longer-lived scopes:

```
@LifeCycle(singleton)     ← Longest lived
    ├── @LifeCycle(session)
    │   ├── @LifeCycle(feature)
    │   │   └── @LifeCycle(view)
    │   └── @LifeCycle(view)
    └── @LifeCycle(view)   ← Shortest lived
```

**Dependency Rule:**
- Longer-lived scopes CAN be injected into shorter-lived scopes
- Shorter-lived scopes CANNOT be injected into longer-lived scopes

```weft
// ✅ Valid: View-scoped depends on singleton
@Role(viewmodel)
@LifeCycle(view)
@Publisher
class ProfileViewModel {
    private var repository: ArticleRepository  // @LifeCycle(singleton) - OK
}

// ❌ Invalid: Singleton depends on view-scoped
@Role(adapter)
@LifeCycle(singleton)
class ArticleRepositoryImpl: ArticleRepository {
    private var viewModel: ProfileViewModel  // @LifeCycle(view) - ERROR
}
```

The LSP will enforce this rule and show an error if you violate the dependency hierarchy.

## Lifecycle Diagram

```
Application Start
    │
    ├─── [@LifeCycle(singleton)] ArticleRepositoryImpl
    │         │
    │         │ (lives for entire app)
    │         │
    ├─── User Logs In
    │         │
    │         ├─── [@LifeCycle(session)] AuthServiceImpl
    │         │         │
    │         │         │ (lives while authenticated)
    │         │         │
    │         ├─── Navigate to Articles
    │         │         │
    │         │         ├─── [@LifeCycle(view)] ArticleListViewModel
    │         │         │         │
    │         │         │         │ (lives while view visible)
    │         │         │         │
    │         │         │    User taps article
    │         │         │         │
    │         │         └─── [@LifeCycle(view)] ArticleDetailViewModel
    │         │                   │
    │         │                   │ (lives while detail view visible)
    │         │                   │
    │         │              User goes back
    │         │                   │
    │         │                   └─── Destroyed
    │         │
    │         └─── User Logs Out
    │                   │
    │                   └─── AuthServiceImpl Destroyed
    │
Application Terminated
    │
    └─── All singletons destroyed
```

## Complete Example

```weft
// ============================================
// DATA LAYER - Repository (Singleton)
// ============================================

@Role(repository)
protocol ArticleRepository {
    var articles: [Article] { get }
    func fetchArticles() async
}

@Role(adapter)
@LifeCycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository {
    private var api: APIClient
    private var database: Database

    private(set) var articles: [Article] = []

    func fetchArticles() async {
        articles = await api.fetchArticles()
        await database.saveArticles(articles)
    }
}

// ============================================
// SERVICE LAYER - Analytics (Singleton)
// ============================================

@Role(service)
protocol AnalyticsService {
    func trackEvent(name: string, properties: [string: any])
}

@Role(adapter)
@LifeCycle(singleton)
class AnalyticsServiceImpl: AnalyticsService {
    func trackEvent(name: string, properties: [string: any]) {
        @SumFunc
        => format event with properties
        => send to analytics backend
        => log event locally for debugging
    }
}

// ============================================
// SERVICE LAYER - Auth (Session)
// ============================================

@Role(service)
protocol AuthService {
    var currentUser: User? { get }
    func login(credentials: Credentials) async
    func logout()
}

@Role(adapter)
@LifeCycle(session)
@Publisher
class AuthServiceImpl: AuthService {
    private(set) var currentUser: User? = null
    private(set) var authToken: string? = null

    func login(credentials: Credentials) async {
        var response = await api.login(credentials)
        currentUser = response.user
        authToken = response.token
    }

    func logout() {
        currentUser = null
        authToken = null
    }
}

// ============================================
// PRESENTATION LAYER - ViewModel (View)
// ============================================

@Role(viewmodel)
@LifeCycle(view)
@Publisher
class ArticleListViewModel {
    // Dependencies (longer-lived scopes)
    private var repository: ArticleRepository    // @LifeCycle(singleton)
    private var analytics: AnalyticsService      // @LifeCycle(singleton)
    private var authService: AuthService         // @LifeCycle(session)

    // Local state (lives with this ViewModel)
    var isRefreshing: bool = false
    var errorMessage: string? = null

    // Computed properties (based on repository)
    var articles: [Article] {
        return repository.articles
    }

    var canCreateArticle: bool {
        return authService.currentUser?.role == "admin"
    }

    func refresh() async {
        isRefreshing = true
        analytics.trackEvent("articles_refreshed", [:])

        try {
            await repository.fetchArticles()
        } catch error {
            errorMessage = error.message
        } finally {
            isRefreshing = false
        }
    }
}

// ============================================
// UI LAYER - View
// ============================================

view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel  // Created when view appears

    Column(isScrollable: true) {
        for article in viewModel.articles {
            ArticleCard(article: article)
        }
    }

    onDisappear {
        // viewModel is automatically destroyed when view disappears
    }
}
```

## Dependency Injection and Scope

Dependencies are automatically provided based on scope:

```weft
// The system knows:
// 1. ArticleRepositoryImpl is @LifeCycle(singleton) - create once, reuse
// 2. ArticleListViewModel is @LifeCycle(view) - create per view
// 3. ViewModel needs repository - inject the singleton

@Role(adapter)
@LifeCycle(singleton)
class ArticleRepositoryImpl: ArticleRepository { }

@Role(viewmodel)
@LifeCycle(view)
@Publisher
class ArticleListViewModel {
    private var repository: ArticleRepository  // Injected automatically
}
```

The translator generates platform-specific dependency injection:

**Swift:**
```swift
// Singleton stored in app-level container
class AppContainer {
    static let shared = AppContainer()
    let articleRepository: ArticleRepository = ArticleRepositoryImpl()
}

// ViewModel gets repository from container
@Observable
class ArticleListViewModel {
    private let repository: ArticleRepository

    init(repository: ArticleRepository = AppContainer.shared.articleRepository) {
        self.repository = repository
    }
}
```

**Kotlin:**
```kotlin
// Hilt handles scoping automatically
@Singleton
class ArticleRepositoryImpl @Inject constructor() : ArticleRepository { }

@HiltViewModel
class ArticleListViewModel @Inject constructor(
    private val repository: ArticleRepository
) : ViewModel() { }
```

## Platform Translation

**Swift:**
- `@LifeCycle(singleton)` → Single static instance or app-level container
- `@LifeCycle(view)` → `@State` (or older `@StateObject`) in SwiftUI
- `@LifeCycle(session)` → Environment object tied to auth state
- `@LifeCycle(feature)` → Feature coordinator pattern

**Kotlin:**
- `@LifeCycle(singleton)` → `@Singleton` in Hilt/Dagger
- `@LifeCycle(view)` → `viewModel()` scoped to composable lifecycle
- `@LifeCycle(session)` → Custom scope in Hilt
- `@LifeCycle(feature)` → `@ActivityRetained` or custom scope

**TypeScript:**
- `@LifeCycle(singleton)` → Module-level singleton or DI container
- `@LifeCycle(view)` → React component state or hooks
- `@LifeCycle(session)` → Context provider tied to auth
- `@LifeCycle(feature)` → Context provider for feature subtree

## Best Practices

**Use the longest lifetime that makes sense**: Don't create singletons of everything, but don't create new instances unnecessarily.

```weft
// ✅ Good: Shared data layer
@Role(adapter)
@LifeCycle(singleton)
class ArticleRepositoryImpl: ArticleRepository { }

// ✅ Good: View-specific state
@Role(viewmodel)
@LifeCycle(view)
class ArticleDetailViewModel { }

// ❌ Bad: Would be better as @LifeCycle(singleton)
@Role(adapter)
@LifeCycle(view)
class DatabaseConnection { }
```

**Respect the scope hierarchy**: Don't inject shorter-lived scopes into longer-lived ones.

```weft
// ✅ Good: Singleton depends on singleton
@Role(adapter)
@LifeCycle(singleton)
class ServiceA {
    private var serviceB: ServiceB  // @LifeCycle(singleton) - OK
}

// ❌ Bad: Singleton depends on view-scoped
@Role(adapter)
@LifeCycle(singleton)
class ServiceA {
    private var viewModel: SomeViewModel  // @LifeCycle(view) - ERROR
}
```

**Clean up resources in appropriate scopes**: Long-lived scopes should clean up resources they manage.

```weft
@Role(service)
protocol CacheService {
    func clearCache()
    func cleanup()
}

@Role(adapter)
@LifeCycle(singleton)
class CacheServiceImpl: CacheService {
    private var cache: [string: any] = [:]

    func clearCache() {
        cache.removeAll()
    }

    func cleanup() {
        clearCache()
        // Close connections, release resources
    }
}
```

**Use @LifeCycle(view) for screen state**: Each screen should have its own ViewModel instance.

```weft
@Role(viewmodel)
@LifeCycle(view)
@Publisher
class ProfileViewModel {
    var isEditing: bool = false
    var formData: ProfileForm = ProfileForm()

    // State is automatically cleaned up when view is dismissed
}
```

**Protocols don't need lifecycle annotations**: Only concrete implementations have lifecycles.

```weft
// ✅ Correct: Protocol has no lifecycle
@Role(repository)
protocol ArticleRepository {
    func fetchArticles() async
}

// ✅ Correct: Implementation has lifecycle
@Role(adapter)
@LifeCycle(singleton)
class ArticleRepositoryImpl: ArticleRepository { }
```

## Validation Configuration

The Weft LSP can validate lifecycle violations:

```json
// weft.settings.json
{
  "validation": {
    "lifecycleViolations": "error",  // or "warning" or "off"
    "dependencyRule": "error"
  }
}
```

## See Also

- [Observability](03-observability.md) - Reactive state management with @Publisher
- [State Ownership](04-state-ownership.md) - Local vs shared state
- [Repositories](06-repositories.md) - Repository pattern and scoping
- [ViewModels](07-viewmodels.md) - ViewModel pattern and scoping
- [Clean Architecture](10-clean-architecture.md) - Understanding layer dependencies
