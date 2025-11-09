# Dependency Injection

Dependency injection in Weft is **implicit and automatic**. You declare what dependencies a class needs through properties, and the system provides them based on architectural roles and lifecycle scopes. No boilerplate, no manual wiring.

## Core Principle

**Dependencies are inferred from context.** Simply declare properties with the types you need—Weft handles the rest.

```weft
@Role(viewmodel)
@Lifecycle(view)
@Publisher
class ArticleListViewModel {
    @Subscriber private var repository: ArticleRepository  // Automatically injected
    private var publishUseCase: PublishArticleUseCase      // Automatically injected
}
```

The translator sees:
- `ArticleListViewModel` is `@Lifecycle(view)`
- It needs an `ArticleRepository` interface (implemented by singleton adapter)
- It needs a `PublishArticleUseCase`
- Dependencies flow from longer-lived to shorter-lived scopes ✓

The platform-specific code is generated with proper dependency injection patterns.

## No Annotations Required

Unlike many DI frameworks, Weft doesn't require decorating each dependency:

```weft
// Weft - clean and implicit
@Role(viewmodel)
class ProfileViewModel {
    @Subscriber private var repository: UserRepository
    private var analytics: AnalyticsService
}

// Other frameworks often require:
// @Inject private var repository: UserRepository
// @Inject private var analytics: AnalyticsService
```

## Type-Based Resolution

Dependencies are resolved by their type and scope:

1. The property type (`ArticleRepository`)
2. The declaring class's scope (`@Lifecycle(view)`)
3. Available implementations matching that type
4. Scope hierarchy rules (longer-lived can inject into shorter-lived)

## Scope Hierarchy

Dependencies flow from longer-lived to shorter-lived scopes:

```
@Lifecycle(singleton)
    ↓ can inject into
@Lifecycle(session)
    ↓ can inject into
@Lifecycle(feature)
    ↓ can inject into
@Lifecycle(view)
```

See [Lifecycle & Scope](02-lifecycle-scope.md) for detailed rules and examples.

## Clean Architecture Dependencies

Weft also enforces the Clean Architecture dependency rule:

**Inner layers cannot depend on outer layers.**

```weft
// ✅ Valid - ViewModel (outer) depends on Repository interface (inner)
@Role(viewmodel)
class ArticleListViewModel {
    @Subscriber private var repository: ArticleRepository  // OK
}

// ❌ Invalid - UseCase (inner) depends on ViewModel (outer)
@Role(usecase)
class PublishArticleUseCase {
    private var viewModel: ArticleListViewModel  // ERROR!
}
```

See [Roles & Patterns](05-roles-and-patterns.md) for architectural patterns and dependency examples.

## What You Don't Write

Weft's implicit DI eliminates common boilerplate:

- ❌ No `@Inject` annotations on every property
- ❌ No manual factory methods
- ❌ No provider classes
- ❌ No module configuration files
- ❌ No dependency graphs to maintain

The role annotations, lifecycle scopes, and property declarations are sufficient. The translator handles the rest.

## Testing

The implicit DI system generates testable code with constructor injection:

```weft
// Production code
@Role(viewmodel)
class ArticleListViewModel {
    @Subscriber private var repository: ArticleRepository
}

// Generated code allows test injection
func testViewModel() {
    var mockRepo = MockArticleRepository()
    var viewModel = ArticleListViewModel(repository: mockRepo)

    // Test with mock
}
```

## See Also

- [Lifecycle & Scope](02-lifecycle-scope.md) - Detailed scope rules and hierarchy
- [Roles & Patterns](05-roles-and-patterns.md) - Practical dependency patterns and examples
- [Full Architecture Example](07-full-example.md) - Full example of implementing Weft's architecture
