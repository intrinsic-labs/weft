# Lifecycle & Scope

Lifecycle and scope define how long objects live in your application. Weft makes lifecycle explicit through the `@Lifecycle` annotation, helping you understand when objects are created, shared, and destroyed.

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

## The @Lifecycle Annotation

Use `@Lifecycle` with a parameter to specify how long an instance should live:

```weft
@Lifecycle(singleton|session|feature|view)
```

**Note:** Protocols (interfaces) do not have lifecycle annotations. Only concrete implementations have lifecycles.

## Lifecycle Scopes

### @Lifecycle(singleton)

Objects live for the entire application lifetime. Only one instance exists, shared across the entire app.

```weft
@Role(repository)
protocol ArticleRepository {
    var articles: [Article] { get }
    func fetchArticles() async
}

@Role(adapter)
@Lifecycle(singleton)
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

**Use @Lifecycle(singleton) for:**
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

### @Lifecycle(view)

Objects live while a specific view/screen is visible. Each view gets its own instance.

```weft
@Role(viewmodel)
@Lifecycle(view)
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

**Use @Lifecycle(view) for:**
- ViewModels
- Screen-specific state
- View controllers
- Temporary UI coordinators

**Characteristics:**
- Created when view appears
- Destroyed when view is dismissed
- Not shared between views
- Local state is cleaned up automatically

### @Lifecycle(feature)

Objects live while a feature or user flow is active.

```weft
@Role(service)
protocol CheckoutService {
    var cart: ShoppingCart { get }
    func completeCheckout() async
}

@Role(adapter)
@Lifecycle(feature)
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

**Use @Lifecycle(feature) for:**
- Multi-step flows (checkout, onboarding)
- Feature-specific caches
- Wizard or form state
- Temporary workflows

**Characteristics:**
- Created when entering feature
- Destroyed when exiting feature
- Shared across views within feature
- State persists across feature navigation

### @Lifecycle(session)

Objects live while a user session is active (typically while authenticated).

```weft
@Role(service)
protocol AuthService {
    var currentUser: User? { get }
    func login(credentials: Credentials) async
    func logout()
}

@Role(adapter)
@Lifecycle(session)
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

**Use @Lifecycle(session) for:**
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
@Lifecycle(singleton)     ← Longest lived
    ├── @Lifecycle(session)
    │   ├── @Lifecycle(feature)
    │   │   └── @Lifecycle(view)
    │   └── @Lifecycle(view)
    └── @Lifecycle(view)   ← Shortest lived
```

**Dependency Rule:**
- Longer-lived scopes CAN be injected into shorter-lived scopes
- Shorter-lived scopes CANNOT be injected into longer-lived scopes

```weft
// ✅ Valid: View-scoped depends on singleton
@Role(viewmodel)
@Lifecycle(view)
@Publisher
class ProfileViewModel {
    private var repository: ArticleRepository  // @Lifecycle(singleton) - OK
}

// ❌ Invalid: Singleton depends on view-scoped
@Role(adapter)
@Lifecycle(singleton)
class ArticleRepositoryImpl: ArticleRepository {
    private var viewModel: ProfileViewModel  // @Lifecycle(view) - ERROR
}
```

The LSP will enforce this rule and show an error if you violate the dependency hierarchy.

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
@Lifecycle(singleton)
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
@Lifecycle(singleton)
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
@Lifecycle(session)
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
@Lifecycle(view)
@Publisher
class ArticleListViewModel {
    // Dependencies (longer-lived scopes)
    private var repository: ArticleRepository    // @Lifecycle(singleton)
    private var analytics: AnalyticsService      // @Lifecycle(singleton)
    private var authService: AuthService         // @Lifecycle(session)

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

## Platform Translation

**Swift:**
- `@Lifecycle(singleton)` → Single static instance or app-level container
- `@Lifecycle(view)` → `@State` (or older `@StateObject`) in SwiftUI
- `@Lifecycle(session)` → Environment object tied to auth state
- `@Lifecycle(feature)` → Feature coordinator pattern

**Kotlin:**
- `@Lifecycle(singleton)` → `@Singleton` in Hilt/Dagger
- `@Lifecycle(view)` → `viewModel()` scoped to composable lifecycle
- `@Lifecycle(session)` → Custom scope in Hilt
- `@Lifecycle(feature)` → `@ActivityRetained` or custom scope

**TypeScript:**
- `@Lifecycle(singleton)` → Module-level singleton or DI container
- `@Lifecycle(view)` → React component state or hooks
- `@Lifecycle(session)` → Context provider tied to auth
- `@Lifecycle(feature)` → Context provider for feature subtree

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
- [UI State Ownership](../ui/04-ui-state-ownership.md) - State and ownership in UI
