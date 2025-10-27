# Observability

Observability in Weft makes state changes reactive—when data changes, all observers are automatically notified. This is the foundation of reactive UI updates and data synchronization across your application.

## The @Observable Annotation

Mark classes as observable to indicate they contain state that changes over time:

```weft
@Observable
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

When properties on an `@Observable` type change, all observers are automatically notified.

## What Should Be Observable?

Mark types as `@Observable` when:

- The type holds state that changes over time
- UI components need to react to state changes
- Multiple parts of your app need to observe the same data
- You're implementing repositories, services, or ViewModels

**Examples of observable types:**

```weft
// Repository - data changes over time
@Observable
@Repository
class UserRepository {
    private(set) var currentUser: User? = null
    private(set) var isAuthenticated: bool = false
}

// ViewModel - UI state changes
@Observable
@ViewModel
class ProfileViewModel {
    private(set) var isLoading: bool = false
    private(set) var errorMessage: string? = null
}

// Service - app-wide state
@Observable
@Service
class ThemeService {
    var isDarkMode: bool = false
    var primaryColor: Color = Color.blue
}
```

## Observing Changes

When you use an `@Observable` type, changes are automatically observed based on context:

### In ViewModels

ViewModels can depend on observable repositories:

```weft
@ViewModel
@ViewScoped
class ArticleListViewModel {
    private var repository: ArticleRepository  // Observable repository
    
    // This computed property automatically updates when repository.articles changes
    var articles: [Article] {
        return repository.articles
    }
    
    var isLoading: bool {
        return repository.isLoading
    }
}
```

### In Views

Views automatically re-render when observable properties change:

```weft
view ArticleListView {
    var viewModel: ArticleListViewModel  // Observable ViewModel
    
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

## Observable Properties

Properties on `@Observable` types are automatically tracked:

```weft
@Observable
class ShoppingCart {
    // All properties are observable by default
    private(set) var items: [Item] = []
    private(set) var total: float = 0.0
    private(set) var itemCount: int = 0
    
    func addItem(item: Item) {
        items.append(item)       // Change tracked
        total += item.price      // Change tracked
        itemCount += 1           // Change tracked
        // All observers notified once after method completes
    }
}
```

## Private(set) for Controlled Updates

Use `private(set)` to allow public reading but private writing:

```weft
@Observable
class ArticleRepository {
    // Readable everywhere, writable only in this class
    private(set) var articles: [Article] = []
    private(set) var isLoading: bool = false
    
    public func fetchArticles() async {
        isLoading = true  // Only this class can change isLoading
        articles = await api.fetchArticles()
        isLoading = false
    }
}
```

This pattern ensures state only changes through controlled methods, not directly.

## Computed Properties

Computed properties automatically update when their dependencies change:

```weft
@Observable
class ShoppingCart {
    private(set) var items: [Item] = []
    
    // Automatically recomputes when items changes
    var total: float {
        return items.reduce(0, (sum, item) => sum + item.price)
    }
    
    var itemCount: int {
        return items.count
    }
    
    var isEmpty: bool {
        return items.isEmpty
    }
}
```

## Multiple Observers

Multiple parts of your app can observe the same state:

```weft
@Observable
@Singleton
class UserRepository {
    private(set) var currentUser: User? = null
}

// Multiple ViewModels observe the same repository
@ViewModel
class ProfileViewModel {
    private var userRepository: UserRepository
    
    var userName: string? {
        return userRepository.currentUser?.name
    }
}

@ViewModel
class SettingsViewModel {
    private var userRepository: UserRepository
    
    var userEmail: string? {
        return userRepository.currentUser?.email
    }
}

@ViewModel
class NavBarViewModel {
    private var userRepository: UserRepository
    
    var isLoggedIn: bool {
        return userRepository.currentUser != null
    }
}

// When repository.currentUser changes, all three ViewModels update automatically
```

## Platform Translation

The `@Observable` annotation translates to platform-specific reactive mechanisms:

**Swift:**
```swift
@Observable
class ArticleRepository {
    private(set) var articles: [Article] = []
    private(set) var isLoading: Bool = false
}

// SwiftUI views automatically observe @Observable types
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
```

## Best Practices

**Mark the source of truth as observable**: The class that owns and modifies the data should be `@Observable`.

```weft
// Good: Repository owns the data
@Observable
@Repository
class ArticleRepository {
    private(set) var articles: [Article] = []
    
    func fetchArticles() async {
        articles = await api.fetchArticles()
    }
}

// ViewModel observes and transforms
@ViewModel
class ArticleListViewModel {
    private var repository: ArticleRepository
    
    var articles: [Article] {
        return repository.articles
    }
}
```

**Use private(set) for encapsulation**: Let observers read but not write.

```weft
@Observable
class DataStore {
    private(set) var data: [Item] = []
    
    // Controlled mutation through methods
    func loadData() async {
        data = await fetchData()
    }
}
```

**Keep observable logic simple**: Don't put complex business logic in observable state updates.

```weft
// Good: Simple state updates
@Observable
class UserRepository {
    private(set) var users: [User] = []
    
    func setUsers(users: [User]) {
        self.users = users
    }
}

// Complex logic in separate methods
func processAndStoreUsers(rawData: [UserDTO]) async {
    var processed = rawData.map(dto => User.fromDTO(dto))
    var validated = processed.filter(user => user.isValid())
    repository.setUsers(validated)
}

// Weft alternative: Use @SumFunc to describe logic in plain English
func processAndStoreUsers(rawData: [UserDTO]) async {
    @SumFunc
    => transform each DTO into a User object
    => filter out any invalid users
    => store validated users in repository
}
```

**Don't over-observe**: Not everything needs to be observable. Simple data types and DTOs don't need `@Observable`.

```weft
// Don't need @Observable - simple data
data ArticleDTO {
    var id: string
    var title: string
}

// Do need @Observable - manages state
@Observable
class ArticleRepository {
    private(set) var articles: [Article] = []
}
```

## Common Patterns

### Repository Pattern

```weft
@Observable
@Repository
@Singleton
class ArticleRepository {
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
@Observable
@ViewModel
@ViewScoped
class ArticleListViewModel {
    private var repository: ArticleRepository
    
    @State var selectedArticle: Article? = null
    @State var searchQuery: string = ""
    
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
@Observable
@Service
@Singleton
class AuthService {
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

## See Also

- [Lifecycle & Scope](02-lifecycle-scope.md) - Controlling object lifetimes
- [State Ownership](04-state-ownership.md) - Managing local vs shared state
- [Repositories](05-repositories.md) - Repository pattern in depth
- [ViewModels](06-viewmodels.md) - ViewModel pattern in depth