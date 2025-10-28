# Dependency Injection

Dependency injection in Weft is **implicit and automatic**. You declare what dependencies a class needs, and the system provides them based on scope annotations. No boilerplate, no manual wiring.

## Core Principle

**Dependencies are inferred from context.** Simply declare properties with the types you need—Weft handles the rest.

```weft
@ViewScoped
@ViewModel
class ArticleListViewModel {
    private var repository: ArticleRepository  // Automatically injected
    private var analytics: AnalyticsService    // Automatically injected
}
```

The translator sees:
- `ArticleListViewModel` is `@ViewScoped`
- It needs an `ArticleRepository` (which is `@Singleton`)
- It needs an `AnalyticsService` (which is `@Singleton`)
- Longer-lived scopes can inject into shorter-lived scopes ✓

The platform-specific code is generated with proper dependency injection.

## How It Works

### No @Inject Annotation Needed

Unlike many DI frameworks, Weft doesn't require decorating each dependency:

```weft
// Weft - clean and implicit
@ViewModel
class ProfileViewModel {
    private var userRepository: UserRepository
    private var authService: AuthService
}

// Other frameworks often require:
// @Inject private var userRepository: UserRepository
// @Inject private var authService: AuthService
```

### Scope Determines Availability

The scope annotations (`@Singleton`, `@ViewScoped`, etc.) tell the system when instances are created and how they're shared:

```weft
@Singleton
@Repository
class ArticleRepository {
    // Created once, reused everywhere
}

@ViewScoped
@ViewModel
class ArticleListViewModel {
    private var repository: ArticleRepository  // Gets the singleton
}
```

### Type-Based Resolution

Dependencies are resolved by their type. The system looks at:

1. The property type (`ArticleRepository`)
2. The property's scope (`@ViewScoped`)
3. Available instances matching that type
4. Scope hierarchy rules

If an `ArticleRepository` exists and its scope allows injection into `@ViewScoped`, it's automatically provided.

## Scope Hierarchy

Dependencies flow from longer-lived to shorter-lived scopes:

```
@Singleton
    ↓ can inject into
@SessionScoped
    ↓ can inject into
@FeatureScoped
    ↓ can inject into
@ViewScoped
```

**Valid:**
```weft
@ViewScoped
class MyViewModel {
    private var repo: MyRepository        // @Singleton - OK
    private var auth: AuthService         // @SessionScoped - OK
    private var coordinator: Coordinator  // @FeatureScoped - OK
}
```

**Invalid:**
```weft
@Singleton
class MyRepository {
    private var viewModel: MyViewModel  // @ViewScoped - ERROR
    // Singletons can't depend on view-scoped objects
}
```

## Platform Translation

The same Weft code generates idiomatic DI for each platform:

**Swift:**
```swift
class AppContainer {
    static let shared = AppContainer()
    
    // Singletons
    lazy var articleRepository = ArticleRepository(
        api: apiClient,
        database: database
    )
    
    lazy var analyticsService = AnalyticsService()
}

class ArticleListViewModel: ObservableObject {
    private let repository: ArticleRepository
    private let analytics: AnalyticsService
    
    init(
        repository: ArticleRepository = AppContainer.shared.articleRepository,
        analytics: AnalyticsService = AppContainer.shared.analyticsService
    ) {
        self.repository = repository
        self.analytics = analytics
    }
}
```

**Kotlin:**
```kotlin
@Singleton
class ArticleRepository @Inject constructor(
    private val api: ApiClient,
    private val database: Database
)

@HiltViewModel
class ArticleListViewModel @Inject constructor(
    private val repository: ArticleRepository,
    private val analytics: AnalyticsService
) : ViewModel()
```

**TypeScript:**
```typescript
// Service locator or DI container pattern
class ArticleListViewModel {
    private repository: ArticleRepository;
    private analytics: AnalyticsService;
    
    constructor() {
        this.repository = container.resolve(ArticleRepository);
        this.analytics = container.resolve(AnalyticsService);
    }
}
```

## Constructor Injection vs Property Injection

Weft uses property-based dependency declarations that translate to constructor injection on most platforms:

```weft
@ViewModel
@ViewScoped
class ArticleListViewModel {
    private var repository: ArticleRepository
    private var analytics: AnalyticsService
    
    // No explicit constructor needed
}
```

This generates platform-appropriate constructor injection. The translator handles the boilerplate.

## Testing with Dependency Injection

The implicit DI system makes testing straightforward—pass mock dependencies:

```weft
// Production code
@ViewModel
class ArticleListViewModel {
    private var repository: ArticleRepository
}

// Test code (conceptual)
func testViewModel() {
    var mockRepo = MockArticleRepository()
    var viewModel = ArticleListViewModel(repository: mockRepo)
    
    // Test viewModel with mock
}
```

Platform translators generate testable code with dependency injection built in.

## Multiple Instances of Same Type

If you need multiple instances of the same type with different configurations, use distinct wrapper types or qualify them semantically:

```weft
@Singleton
class PrimaryDatabase {
    var db: Database
}

@Singleton
class CacheDatabase {
    var db: Database
}

@Repository
class ArticleRepository {
    private var primary: PrimaryDatabase
    private var cache: CacheDatabase
}
```

The type system keeps them distinct.

## Optional Dependencies

Use optional types for dependencies that might not always be available:

```weft
@ViewModel
class ProfileViewModel {
    private var repository: UserRepository
    private var analytics: AnalyticsService?  // Optional dependency
    
    func trackEvent(name: string) {
        analytics?.trackEvent(name)  // Safe optional chaining
    }
}
```

## Best Practices

**Keep dependencies explicit through properties**: Don't hide dependencies in method calls or lazy initialization.

```weft
// Good - dependencies visible at class level
@ViewModel
class MyViewModel {
    private var repository: MyRepository
    private var service: MyService
}

// Avoid - hidden dependencies
@ViewModel
class MyViewModel {
    func doSomething() {
        var repo = ServiceLocator.get(MyRepository)  // Hidden!
    }
}
```

**Respect scope hierarchy**: Don't try to inject shorter-lived scopes into longer-lived ones.

**Use the longest appropriate lifetime**: Prefer `@Singleton` for truly shared, stateless services. Use shorter scopes for stateful or context-specific objects.

**Minimize dependencies**: A class with many dependencies might be doing too much. Consider splitting responsibilities.

## What You Don't Write

Weft's implicit DI eliminates common boilerplate:

- ❌ No `@Inject` annotations on every property
- ❌ No manual factory methods
- ❌ No provider classes
- ❌ No module configuration files
- ❌ No dependency graphs to maintain

The scope annotations and property declarations are sufficient. The translator handles the rest.

## See Also

- [Lifecycle & Scope](02-lifecycle-scope.md) - Scope annotations in detail
- [Observability](03-observability.md) - Observable dependencies
- [Repositories](06-repositories.md) - Repository pattern with DI
- [ViewModels](07-viewmodels.md) - ViewModel pattern with DI
- [Services](08-services.md) - Service pattern with DI