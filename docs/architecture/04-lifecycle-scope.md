# Lifecycle & Scope

Lifecycle and scope define how long objects live in your application. Weft makes lifecycle explicit through scope annotations, helping you understand when objects are created, shared, and destroyed.

## Understanding Scope

**Scope** determines the lifetime of an object—how long it exists and who can access it.

Different parts of your application have different lifetimes:

- **Application scope**: Lives for the entire app (singleton pattern)
- **Feature scope**: Lives while a feature or flow is active
- **View scope**: Lives while a view/screen is visible
- **Session scope**: Lives while a user session is active

Making scope explicit helps you reason about:
- When objects are created
- When objects are destroyed
- Whether objects are shared or unique
- Memory management and resource cleanup

## Scope Annotations

### @Singleton

Objects marked with `@Singleton` live for the entire application lifetime. Only one instance exists, shared across the entire app.

```weft
@Singleton
@Repository
class ArticleRepository {
    private var api: APIClient
    private var database: Database
    
    private(set) var articles: [Article] = []
    
    func fetchArticles() async {
        articles = await api.fetchArticles()
    }
}
```

**Use @Singleton for:**
- Repositories (data layer)
- Core services (analytics, auth, networking)
- App-wide configuration
- Shared caches
- Resource managers

**Characteristics:**
- Created once when first needed
- Lives until app terminates
- Shared across all features and views
- Maintains state across navigation

### @ViewScoped

Objects marked with `@ViewScoped` live while a specific view/screen is visible. Each view gets its own instance.

```weft
@ViewScoped
@ViewModel
class ArticleDetailViewModel {
    private var repository: ArticleRepository  // Singleton
    
    @State var article: Article? = null
    @State var isLoading: bool = false
    
    func loadArticle(id: string) async {
        isLoading = true
        article = await repository.getArticle(id)
        isLoading = false
    }
}
```

**Use @ViewScoped for:**
- ViewModels
- Screen-specific state
- View controllers
- Temporary UI coordinators

**Characteristics:**
- Created when view appears
- Destroyed when view is dismissed
- Not shared between views
- Local state is cleaned up automatically

### @FeatureScoped

Objects marked with `@FeatureScoped` live while a feature or user flow is active.

```weft
@FeatureScoped
@Service
class CheckoutService {
    private(set) var cart: ShoppingCart
    private(set) var paymentMethod: PaymentMethod? = null
    private(set) var shippingAddress: Address? = null
    
    func completeCheckout() async {
        // Process checkout
    }
}
```

**Use @FeatureScoped for:**
- Multi-step flows (checkout, onboarding)
- Feature-specific caches
- Wizard or form state
- Temporary workflows

**Characteristics:**
- Created when entering feature
- Destroyed when exiting feature
- Shared across views within feature
- State persists across feature navigation

### @SessionScoped

Objects marked with `@SessionScoped` live while a user session is active (typically while authenticated).

```weft
@SessionScoped
@Service
class UserSessionService {
    private(set) var authToken: string
    private(set) var user: User
    private(set) var preferences: UserPreferences
    
    func refreshSession() async {
        authToken = await api.refreshToken()
    }
}
```

**Use @SessionScoped for:**
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
@Singleton (Application)
    ├── @SessionScoped (User Session)
    │   ├── @FeatureScoped (Feature/Flow)
    │   │   └── @ViewScoped (View/Screen)
    │   └── @ViewScoped (View/Screen)
    └── @ViewScoped (View/Screen)
```

**Rules:**
- Longer-lived scopes can be injected into shorter-lived scopes
- Shorter-lived scopes CANNOT be injected into longer-lived scopes

```weft
// Valid: ViewScoped depends on Singleton
@ViewScoped
@ViewModel
class ProfileViewModel {
    private var repository: ArticleRepository  // @Singleton - OK
}

// Invalid: Singleton depends on ViewScoped
@Singleton
@Repository
class ArticleRepository {
    private var viewModel: ProfileViewModel  // @ViewScoped - ERROR
}
```

## Lifecycle Diagram

```
Application Start
    │
    ├─── [@Singleton] ArticleRepository
    │         │
    │         │ (lives for entire app)
    │         │
    ├─── User Logs In
    │         │
    │         ├─── [@SessionScoped] UserSessionService
    │         │         │
    │         │         │ (lives while authenticated)
    │         │         │
    │         ├─── Navigate to Articles
    │         │         │
    │         │         ├─── [@ViewScoped] ArticleListViewModel
    │         │         │         │
    │         │         │         │ (lives while view visible)
    │         │         │         │
    │         │         │    User taps article
    │         │         │         │
    │         │         └─── [@ViewScoped] ArticleDetailViewModel
    │         │                   │
    │         │                   │ (lives while detail view visible)
    │         │                   │
    │         │              User goes back
    │         │                   │
    │         │                   └─── Destroyed
    │         │
    │         └─── User Logs Out
    │                   │
    │                   └─── UserSessionService Destroyed
    │
Application Terminated
    │
    └─── All singletons destroyed
```

## Complete Example

```weft
// Application-scoped repository
@Singleton
@Repository
@Observable
class ArticleRepository {
    private var api: APIClient
    private var database: Database
    
    private(set) var articles: [Article] = []
    
    func fetchArticles() async {
        articles = await api.fetchArticles()
        await database.saveArticles(articles)
    }
}

// Application-scoped service
@Singleton
@Service
class AnalyticsService {
    func trackEvent(name: string, properties: [string: any]) {
        // Send analytics event
    }
}

// Session-scoped service
@SessionScoped
@Service
@Observable
class AuthService {
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

// View-scoped ViewModel
@ViewScoped
@ViewModel
@Observable
class ArticleListViewModel {
    // Dependencies (longer-lived scopes)
    private var repository: ArticleRepository    // @Singleton
    private var analytics: AnalyticsService      // @Singleton
    private var authService: AuthService         // @SessionScoped
    
    // Local state (lives with this ViewModel)
    @State var isRefreshing: bool = false
    @State var errorMessage: string? = null
    
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

// View uses ViewScoped ViewModel
view ArticleListView {
    var viewModel: ArticleListViewModel  // Created when view appears
    
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
// 1. ArticleRepository is @Singleton - create once, reuse
// 2. ArticleListViewModel is @ViewScoped - create per view
// 3. ViewModel needs repository - inject the singleton

@Singleton
@Repository
class ArticleRepository { }

@ViewScoped
@ViewModel
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
    let articleRepository = ArticleRepository()
}

// ViewModel gets repository from container
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
class ArticleRepository @Inject constructor() { }

@HiltViewModel
class ArticleListViewModel @Inject constructor(
    private val repository: ArticleRepository
) : ViewModel() { }
```

## Platform Translation

**Swift:**
- `@Singleton` → Single static instance or app-level container
- `@ViewScoped` → `@StateObject` in SwiftUI
- `@SessionScoped` → Environment object tied to auth state
- `@FeatureScoped` → Feature coordinator pattern

**Kotlin:**
- `@Singleton` → `@Singleton` in Hilt/Dagger
- `@ViewScoped` → `viewModel()` scoped to composable lifecycle
- `@SessionScoped` → Custom scope in Hilt
- `@FeatureScoped` → `@ActivityRetained` or custom scope

**TypeScript:**
- `@Singleton` → Module-level singleton or DI container
- `@ViewScoped` → React component state or hooks
- `@SessionScoped` → Context provider tied to auth
- `@FeatureScoped` → Context provider for feature subtree

## Best Practices

**Use the longest lifetime that makes sense**: Don't create singletons of everything, but don't create new instances unnecessarily.

```weft
// Good: Shared data layer
@Singleton
@Repository
class ArticleRepository { }

// Good: View-specific state
@ViewScoped
@ViewModel
class ArticleDetailViewModel { }

// Bad: Would be better as @Singleton
@ViewScoped
class DatabaseConnection { }
```

**Respect the scope hierarchy**: Don't inject shorter-lived scopes into longer-lived ones.

```weft
// Good: Singleton depends on Singleton
@Singleton
class ServiceA {
    private var serviceB: ServiceB  // @Singleton - OK
}

// Bad: Singleton depends on ViewScoped
@Singleton
class ServiceA {
    private var viewModel: SomeViewModel  // @ViewScoped - ERROR
}
```

**Clean up resources in appropriate scopes**: Long-lived scopes should clean up resources they manage.

```weft
@Singleton
@Service
class CacheService {
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

**Use @ViewScoped for screen state**: Each screen should have its own ViewModel instance.

```weft
@ViewScoped
@ViewModel
class ProfileViewModel {
    @State var isEditing: bool = false
    @State var formData: ProfileForm = ProfileForm()
    
    // State is automatically cleaned up when view is dismissed
}
```

## See Also

- [Observability](02-observability.md) - Reactive state management
- [State Ownership](03-state-ownership.md) - Local vs shared state
- [Repositories](05-repositories.md) - Repository pattern and scoping
- [ViewModels](06-viewmodels.md) - ViewModel pattern and scoping
- [Dependency Flow](08-dependency-flow.md) - How dependencies are injected