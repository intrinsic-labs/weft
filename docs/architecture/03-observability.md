# Observability

Observability in Weft makes state changes reactive—when data changes, all observers are automatically notified. This is the foundation of reactive UI updates and data synchronization across your application.

## The @Publisher Annotation

Mark classes as `@Publisher` to indicate they contain observable state that changes over time:

```weft
@Role(repository)
@Lifecycle(singleton)
@Publisher
class ArticleRepository {
    private(set) var articles: [Article] = []
    private(set) var isLoading: bool = false

    func fetchArticles() async {
        isLoading = true
        articles = await api.fetchArticles()
        isLoading = false
    }
}
```

When properties on a `@Publisher` type change, all observers are automatically notified.

## What Should Be @Publisher?

Mark types as `@Publisher` when:

- The type holds state that changes over time
- UI components need to react to state changes
- Multiple parts of your app need to observe the same data
- You're implementing repository adapters, service adapters, or ViewModels

**Examples of publisher types:**

```weft
// Repository adapter - data changes over time
@Role(adapter)
@Lifecycle(singleton)
@Publisher
class UserRepositoryImpl: UserRepository {
    private(set) var currentUser: User? = null
    private(set) var isAuthenticated: bool = false
}

// ViewModel - UI state changes
@Role(viewmodel)
@Lifecycle(view)
@Publisher
class ProfileViewModel {
    private(set) var isLoading: bool = false
    private(set) var errorMessage: string? = null
}

// Service adapter - app-wide state
@Role(adapter)
@Lifecycle(singleton)
@Publisher
class ThemeServiceImpl: ThemeService {
    var isDarkMode: bool = false
    var primaryColor: Color = Color.blue
}
```

## Observing Changes with @Subscriber

To observe a `@Publisher`, mark properties with `@Subscriber`:

```weft
@Role(viewmodel)
@Lifecycle(view)
@Publisher
class ArticleListViewModel {
    @Subscriber private var repository: ArticleRepository  // Observable repository

    // This computed property automatically updates when repository.articles changes
    var articles: [Article] {
        return repository.articles
    }

    var isLoading: bool {
        return repository.isLoading
    }
}
```

**Important:** @Subscriber` is **required** when observing publishers. The LSP will warn you if you forget it.

### @Subscriber Parameters

The `@Subscriber` annotation accepts optional parameters:

- **`writable: bool`** - Whether subscriber can write back (default: false)
- **`source: parent|environment`** - Where the publisher comes from (default: parent)

```weft
view ChildView {
    @Subscriber(writable: true) var count: int
    // Can read AND write - like @Binding

    @Subscriber(source: environment) var theme: Theme
    // Observes from environment instead of parent
}
```

### @Binding - Syntactic Sugar for User Interfaces

`@Binding` is syntactic sugar for `@Subscriber(writable: true, source: parent)` when building user interfaces:

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

**Equivalent to**:
```weft
view SearchBar {
    @Subscriber(writable: true, source: parent) var query: string
}
```

`@Binding` cannot be used outside of views. You must use an explicit `@Subscriber` in ViewModels and other non-UI types.


## Implicit Observability via Access Modifiers

In `@Publisher` classes, **access modifiers control what's observable**:

```weft
@Role(adapter)
@Lifecycle(singleton)
@Publisher
class ShoppingCart {
    // ✅ Observable - public property
    var items: [Item] = []

    // ✅ Observable (read-only) - public getter, private setter
    private(set) var total: float = 0.0

    // ❌ NOT observable - private property
    private var internalCache: [string: any] = [:]

    func addItem(item: Item) {
        items.append(item)       // Observers notified
        total += item.price      // Observers notified
        internalCache[item.id] = item  // NOT observable
    }
}
```

**Rules:**
- `var propertyName` (public) → **Observable**
- `private(set) var propertyName` (read-only) → **Observable**
- `private var propertyName` → **NOT observable**

This gives you fine-grained control over what state changes trigger UI updates.

## @Subscriber in Views

Views must use `@Subscriber` to observe ViewModels and other publishers:

```weft
view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel  // Observes ViewModel
    @Subscriber(source: environment) var theme: Theme  // Observes from environment

    Column {
        if viewModel.isLoading {
            LoadingSpinner()  // Shows when isLoading becomes true
        } else {
            for article in viewModel.articles {
                ArticleCard(article: article)  // Updates when articles change
            }
        }
    }
}
```

## Multiple Observers

Multiple parts of your app can observe the same state:

```weft
@Role(adapter)
@Lifecycle(singleton)
@Publisher
class UserRepository {
    private(set) var currentUser: User? = null
}

// Multiple ViewModels observe the same repository
@Role(viewmodel)
@Lifecycle(view)
@Publisher
class ProfileViewModel {
    @Subscriber private var userRepository: UserRepository

    var userName: string? {
        return userRepository.currentUser?.name
    }
}

@Role(viewmodel)
@Lifecycle(view)
@Publisher
class SettingsViewModel {
    @Subscriber private var userRepository: UserRepository

    var userEmail: string? {
        return userRepository.currentUser?.email
    }
}

@Role(viewmodel)
@Lifecycle(view)
@Publisher
class NavBarViewModel {
    @Subscriber private var userRepository: UserRepository

    var isLoggedIn: bool {
        return userRepository.currentUser != null
    }
}

// When repository.currentUser changes, all three ViewModels update automatically
```

## Platform Translation

The `@Publisher` annotation translates to platform-specific reactive mechanisms:

**Swift:**
```swift
@Observable
class ArticleRepository {
    private(set) var articles: [Article] = []
    private(set) var isLoading: Bool = false
}

// SwiftUI views automatically observe @Observable types
struct ArticleListView: View {
    @State private var viewModel: ArticleListViewModel

    var body: some View {
        // Automatically re-renders when viewModel publishes changes
    }
}
```

**Kotlin:**
```kotlin
class ArticleRepository {
    var articles by mutableStateOf(emptyList<Article>())
        private set
    var isLoading by mutableStateOf(false)
        private set
}

// Compose automatically recomposes when state changes
@Composable
fun ArticleListView(viewModel: ArticleListViewModel) {
    // Automatically recomposes when viewModel state changes
}
```

**TypeScript/React:**
```typescript
class ArticleRepository {
    private _articles: Article[] = [];
    private _isLoading: boolean = false;
    private listeners: Set<() => void> = new Set();

    get articles() { return this._articles; }
    get isLoading() { return this._isLoading; }

    // Notifies listeners on changes
}

// React components use context/hooks to observe
function ArticleListView() {
    const viewModel = useViewModel(ArticleListViewModel);
    const theme = useContext(ThemeContext);
    // Re-renders when viewModel or theme changes
}
```

## Best Practices

**Mark the source of truth as @Publisher**: The class that owns and modifies the data should be `@Publisher`.

**Use private(set) for encapsulation**: Let observers read but not write.

**Keep observable logic simple**: Don't put complex business logic in observable state updates.

**Use access modifiers to control observability**: Not every property needs to be observable.

## Common Patterns

### Repository Pattern

```weft
@Role(repository)
protocol ArticleRepository {
    var articles: [Article] { get }
    var isLoading: bool { get }
    func fetchArticles() async
}

@Role(adapter)
@Lifecycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository {
    private var api: APIClient
    private var database: Database

    private(set) var articles: [Article] = []
    private(set) var isLoading: bool = false
    private(set) var lastError: Error? = null

    func fetchArticles() async {
        isLoading = true
        lastError = null

        try {
            var fresh = await api.fetchArticles()
            await database.saveArticles(fresh)
            articles = fresh
        } catch error {
            lastError = error
        } finally {
            isLoading = false
        }
    }
}
```

### ViewModel Pattern

```weft
@Role(viewmodel)
@Lifecycle(view)
@Publisher
class ArticleListViewModel {
    @Subscriber private var repository: ArticleRepository

    var selectedArticle: Article? = null
    var searchQuery: string = ""

    var articles: [Article] {
        var all = repository.articles
        if searchQuery.isEmpty {
            return all
        }
        return all.filter(a => a.title.contains(searchQuery))
    }

    var isLoading: bool {
        return repository.isLoading
    }
}
```

### Service Pattern

```weft
@Role(service)
protocol AuthService {
    var currentUser: User? { get }
    var isAuthenticated: bool { get }
    func login(credentials: Credentials) async
}

@Role(adapter)
@Lifecycle(singleton)
@Publisher
class AuthServiceImpl: AuthService {
    private(set) var currentUser: User? = null
    private(set) var isAuthenticated: bool = false

    func login(credentials: Credentials) async {
        var user = await api.login(credentials)
        currentUser = user
        isAuthenticated = true
    }

    func logout() {
        currentUser = null
        isAuthenticated = false
    }
}
```

## Validation Configuration

The Weft LSP can validate state annotation usage:

```json
// weft.settings.json
{
  "validation": {
    "stateAnnotations": "warning",  // Warn on missing @Subscriber
    "publisherAccess": "warning"    // Warn on access modifier issues
  }
}
```

## See Also

- [Lifecycle & Scope](02-lifecycle-scope.md) - Controlling object lifetimes
- [UI State Ownership](../ui/04-ui-state-ownership.md) - State management & ownership in UI
- [Annotations Reference](../reference/annotations.md) - Complete annotation guide
