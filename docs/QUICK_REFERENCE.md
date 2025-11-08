# Weft Quick Reference

A quick reference guide for Weft's Clean Architecture-aligned annotations and patterns.

---

## Annotation Categories

Weft's annotations are organized into semantic categories:

1. **Lifecycle** - How long objects live (`@LifeCycle`)
2. **Role** - Architectural layer and responsibility (`@Role`)
3. **State & Reactivity** - Data flow and observability (`@Publisher`, `@Subscriber`, `@Binding`, `@LocalState`)
4. **Persistence** - Data storage and serialization (`@Schema`, `@JSON`, field annotations)
5. **Documentation** - Guidance for humans and translators (`@Instruction`, `@SumFunc`, `@Main`)

---

## Lifecycle Annotations

Control how long objects live:

```weft
@LifeCycle(singleton)   // Lives for entire app lifetime
@LifeCycle(session)     // Lives from login to logout
@LifeCycle(feature)     // Lives during a feature/flow
@LifeCycle(view)        // Lives while view/screen is visible
```

**Example:**
```weft
@Role(repository)
@LifeCycle(singleton)
class ArticleRepository { }

@Role(viewmodel)
@LifeCycle(view)
class ArticleListViewModel { }
```

**Dependency Rule**: Longer-lived → shorter-lived only
- `singleton` can inject into `session`, `feature`, `view`
- `session` can inject into `feature`, `view`
- `feature` can inject into `view`
- `view` cannot inject into longer-lived scopes

---

## Role Annotations

Define architectural layer and responsibility:

```weft
@Role(entity)       // Core business objects (innermost layer)
@Role(usecase)      // Application business rules
@Role(repository)   // Data access interface
@Role(service)      // Business logic utility interface
@Role(viewmodel)    // Presentation logic
@Role(gateway)      // External service interface (payment, email, etc.)
@Role(dto)          // Data transfer object (API/DB boundary)
@Role(adapter)      // Concrete implementation (outermost layer)
```

### Clean Architecture Mapping

```
┌─────────────────────────────────────┐
│ Frameworks (@Role(adapter), @Schema)│
│ ┌─────────────────────────────────┐ │
│ │ Interface Adapters              │ │
│ │ @Role(repository|service|       │ │
│ │       viewmodel|gateway)        │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Use Cases                   │ │ │
│ │ │ @Role(usecase)              │ │ │
│ │ │ ┌─────────────────────────┐ │ │ │
│ │ │ │ Entities                │ │ │ │
│ │ │ │ @Role(entity)           │ │ │ │
│ │ │ └─────────────────────────┘ │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Examples:**

```weft
// Core business entity
@Role(entity)
data Article {
    var id: string
    var title: string
    var content: string
}

// Use case
@Role(usecase)
@LifeCycle(singleton)
class FetchArticlesUseCase {
    private var repository: ArticleRepository  // Depends on interface
}

// Repository interface
@Role(repository)
protocol ArticleRepository {
    func fetchAll() async -> [Article]
}

// Repository implementation
@Role(adapter)
@LifeCycle(singleton)
class ArticleRepositoryImpl: ArticleRepository {
    // Concrete implementation
}

// ViewModel
@Role(viewmodel)
@LifeCycle(view)
@Publisher
class ArticleListViewModel {
    private var fetchUseCase: FetchArticlesUseCase
}
```

---

## State & Reactivity Annotations

Control how data flows and triggers updates:

### `@Publisher` (on classes)

Marks a class as having observable state:

```weft
@Role(viewmodel)
@Publisher
class ArticleListViewModel {
    var articles: [Article] = []  // Observable (public)
    var isLoading: bool = false   // Observable (public)
    private var cache: [String: Article] = [:]  // NOT observable (private)
}
```

**Rules**:
- Public properties → observable
- `private(set)` properties → observable for reading
- Private properties → NOT observable

---

### `@Subscriber` (on properties)

Explicitly marks a property as subscribing to a `@Publisher`:

```weft
view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel  // Observes changes
}

@Publisher
class ParentViewModel {
    @Subscriber var repository: ArticleRepository  // Observes repository
}
```

**Parameters**:
- `writable: bool` - Can write back (default: false)
- `source: parent|environment` - Source of publisher (default: parent)

---

### `@Binding` (on properties)

Two-way binding between parent and child (syntactic sugar):

```weft
view ParentView {
    @LocalState var searchText = ""
    SearchBar(query: $searchText)  // Pass with $
}

view SearchBar {
    @Binding var query: string  // Two-way binding
}
```

**Equivalent to**: `@Subscriber(writable: true, source: parent)`

---

### `@LocalState` (on properties, UI only)

Ephemeral UI state (views only):

```weft
view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel

    @LocalState var showFilters: bool = false  // View-only state
    @LocalState var selectedTab: int = 0
}
```

**Rules**:
- Only allowed in views (LSP enforces)
- Not observable by others
- Resets when view is recreated

---

## State Management Summary

```weft
@Publisher          // "I have observable state" (on class)
@Subscriber         // "I observe this publisher" (on property)
@Binding            // "Two-way binding to parent" (on property)
@LocalState         // "Ephemeral UI state" (on property, views only)
```

---

## Documentation Annotations

### `@Main`

Application entry point:

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

---

### `@Instruction`

**Clarifies translation ambiguity** - not a regular comment!

Use only when you need to specify how to translate Weft to target language in a non-obvious way.

```weft
@Instruction('''
The API returns both featured_image and featured_image_full fields.
During translation, map the plain featured_image value (not featured_image_full).
''')
func fetchArticle(id: string) async -> Article

@Role(adapter)
@Instruction("Use Realm for iOS, Room for Android")
class LocalDatabaseAdapter: Database

// ✅ Use regular comments for code documentation
// Fetches all articles from the repository
func fetchAll() -> [Article]
```

**Use sparingly**: Platform-specific choices, API ambiguities, edge cases
**Don't use**: Regular documentation (use comments instead)

---

### `@SumFunc`

**Replaces function implementation** - write logic in English instead of code!

The translator converts English directly to target language. Don't write code underneath.

```weft
func processPayment(cart: ShoppingCart) async throws -> Receipt {
    @SumFunc
    => Validate cart items are still available
    => Calculate total with tax and shipping
    => Process payment through gateway
    => Create order record in database
    => Send confirmation email
    => Return receipt with transaction details
}
// ✅ No code implementation - @SumFunc IS the implementation

func calculateTotal(items: [CartItem]) -> decimal {
    @SumFunc
    => Sum all item prices
    => Apply tax rate based on location
    => Return final total
}
```

**Use when**: Complex logic described clearly in English, rapid prototyping

---

### `@Deprecated`

Mark deprecated code:

```weft
@Deprecated(
    message: "Use @Publisher instead",
    since: "0.3.0",
    replacement: "@Publisher"
)
@Observable  // Old annotation
class MyClass { }
```

---

## Persistence Annotations

### Database

```weft
@Schema             // Database table definition
@Id(generated)      // Primary key
@ForeignKey("table") // Foreign key reference
@Index              // Database index
@Unique             // Unique constraint
@Required           // Non-null field
@Nullable           // Nullable field
@Transient          // Exclude from database
```

**Example:**
```weft
@Schema
struct ArticleSchema {
    @Id(generated) var id: string
    @Index var title: string
    @ForeignKey("authors") var authorId: string
    @Nullable var subtitle: string?
    @Transient var isSelected: bool = false
}
```

**Note**: `@Schema` is for database mapping. Use `@Role(entity)` for core business objects.

---

### JSON

```weft
@JSON                   // JSON serializable
@JSONKey("field_name")  // Custom field mapping
@JSONIgnore             // Exclude from JSON
@JSONFormat("format")   // Date/time format
```

**Example:**
```weft
@Role(dto)
@JSON
struct ArticleDTO {
    @JSONKey("article_id") var id: string
    @JSONKey("published_date") var publishedAt: string
    @JSONIgnore var cachedData: string?
}
```

---

## Common Patterns

### Entity Pattern (Core Business Object)

```weft
@Role(entity)
data Article {
    var id: string
    var title: string
    var content: string
    var publishedAt: DateTime

    func isPublished() -> bool {
        return publishedAt <= DateTime.now()
    }
}
```

**Key points**:
- No framework dependencies
- Pure business logic only
- Innermost layer

---

### Use Case Pattern

```weft
@Role(usecase)
@LifeCycle(singleton)
class FetchArticlesUseCase {
    private var repository: ArticleRepository  // Interface!
    private var cache: CacheService

    func execute(filter: ArticleFilter?) async -> [Article] {
        @SumFunc
        => Check cache for articles first
        => If not cached, fetch from repository
        => Apply business filter if provided
        => Cache the filtered results
        => Return filtered articles
    }
}
```

**Key points**:
- Orchestrates business logic
- Depends on interfaces, not implementations
- Platform-independent

---

### Repository Pattern

**Interface** (inner layer):
```weft
@Role(repository)
protocol ArticleRepository {
    func fetchAll() async -> [Article]
    func save(article: Article) async
}
```

**Implementation** (outer layer):
```weft
@Role(adapter)
@LifeCycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository {
    private var database: Database

    var cachedArticles: [Article] = []  // Observable

    func fetchAll() async -> [Article] {
        cachedArticles = await database.query(ArticleSchema.self)
            .map { $0.toEntity() }
        return cachedArticles
    }
}
```

**Key points**:
- Interface defines contract (no implementation)
- Adapter has concrete, framework-specific code
- Returns entities, not DTOs

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
        articles = await fetchUseCase.execute(filter: nil)
        isLoading = false
    }
}
```

**Key points**:
- Presentation logic only
- Marked as `@Publisher` for reactive UI
- Usually `@LifeCycle(view)` or `@LifeCycle(feature)`

---

### View Pattern

```weft
view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel
    @LocalState var showFilters: bool = false

    Column(isScrollable: true) {
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

**Key points**:
- Explicit `@Subscriber` for observing ViewModels
- `@LocalState` for ephemeral UI state
- Declarative UI structure

---

## Definition Keywords

```weft
type        // General-purpose type definition
class       // Complex functionality with inheritance
struct      // Data-centric with helper methods
data        // Pure data (auto-generates boilerplate)
object      // Singleton instance
protocol    // Interface/contract definition
view        // UI component
```

---

## Variable Keywords

```weft
// Mutable
var
mut
mutable

// Immutable
const
let
val
final
```

---

## Access Modifiers

```weft
public              // Accessible everywhere
private             // Accessible only within type
protected           // Accessible in type and subclasses
internal            // Accessible within same module
private(set)        // Readable everywhere, writable privately
```

**Note**: In `@Publisher` classes, access modifiers control observability.

---

## Quick Decision Trees

### What role should this type be?

- **Pure business object?** → `@Role(entity)`
- **Orchestrates business rules?** → `@Role(usecase)`
- **Data access contract?** → `@Role(repository)` (interface)
- **Business utility contract?** → `@Role(service)` (interface)
- **Presentation logic?** → `@Role(viewmodel)`
- **External service contract?** → `@Role(gateway)` (interface)
- **API/DB boundary object?** → `@Role(dto)`
- **Concrete implementation?** → `@Role(adapter)`

---

### What lifecycle should it have?

- **Entire app?** → `@LifeCycle(singleton)`
- **User session?** → `@LifeCycle(session)`
- **Feature flow?** → `@LifeCycle(feature)`
- **Single screen?** → `@LifeCycle(view)`

---

### How should state be managed?

- **Class has observable state?** → Mark class with `@Publisher`
- **Property observes changes?** → Mark property with `@Subscriber`
- **Two-way parent-child binding?** → Use `@Binding` on property
- **Ephemeral UI state?** → Use `@LocalState` on property (views only)

---

## Validation & Configuration

### Dependency Rules (Enforced by LSP)

✅ **Valid dependencies**:
- Inner layers → Outer layers: ❌ NOT allowed
- `@Role(entity)` → Cannot depend on anything
- `@Role(usecase)` → Can depend on entities and interfaces
- `@Role(repository|service|gateway)` → Can depend on entities and use cases
- `@Role(adapter)` → Can depend on anything (outermost layer)

✅ **Valid lifecycle dependencies**:
- Longer-lived → Shorter-lived only
- `singleton` → `session`, `feature`, `view` ✅
- `view` → `singleton` ❌

✅ **Valid state annotations**:
- `@Subscriber` requires target to be `@Publisher`
- `@LocalState` only in views

---

### weft.settings.json

```json
{
  "validation": {
    "dependencyRule": "error",      // "error" | "warning" | "off"
    "layerViolations": "error",
    "lifecycleViolations": "warning",
    "stateAnnotations": "warning"
  },
  "architecture": {
    "style": "clean"
  }
}
```

---

## Migration from v0.2.0

| Old (v0.2.0) | New (v0.3.0) | Notes |
|--------------|--------------|-------|
| `@Observable` | `@Publisher` | Clearer terminology |
| `@Singleton` | `@LifeCycle(singleton)` | Parameterized |
| `@ViewScoped` | `@LifeCycle(view)` | Parameterized |
| `@FeatureScoped` | `@LifeCycle(feature)` | Parameterized |
| `@SessionScoped` | `@LifeCycle(session)` | Parameterized |
| `@Repository` | `@Role(repository)` | Parameterized |
| `@ViewModel` | `@Role(viewmodel)` | Parameterized |
| `@Service` | `@Role(service)` | Parameterized |
| `@State` | `@LocalState` | More explicit |
| `@Entity` (DB) | `@Schema` | Use `@Role(entity)` for business objects |
| No annotation | `@Subscriber` | Now required for observing properties |

---

## Complete Example

```weft
// ===== ENTITIES (Core) =====
@Role(entity)
data Article {
    var id: string
    var title: string
    var content: string
}

// ===== USE CASES =====
@Role(usecase)
@LifeCycle(singleton)
class FetchArticlesUseCase {
    private var repository: ArticleRepository

    func execute() async -> [Article] {
        return await repository.fetchAll()
    }
}

// ===== REPOSITORIES (Interface) =====
@Role(repository)
protocol ArticleRepository {
    func fetchAll() async -> [Article]
}

// ===== ADAPTERS (Implementation) =====
@Role(adapter)
@LifeCycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository {
    private var database: Database

    var cachedArticles: [Article] = []

    func fetchAll() async -> [Article] {
        cachedArticles = await database.query(ArticleSchema.self)
            .map { $0.toEntity() }
        return cachedArticles
    }
}

// ===== DATABASE SCHEMA =====
@Schema
struct ArticleSchema {
    @Id(generated) var id: string
    var title: string
    var content: string

    func toEntity() -> Article {
        return Article(id: id, title: title, content: content)
    }
}

// ===== VIEWMODELS =====
@Role(viewmodel)
@LifeCycle(view)
@Publisher
class ArticleListViewModel {
    private var fetchUseCase: FetchArticlesUseCase

    var articles: [Article] = []
    var isLoading: bool = false

    func loadArticles() async {
        isLoading = true
        articles = await fetchUseCase.execute()
        isLoading = false
    }
}

// ===== VIEWS =====
view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel
    @LocalState var showFilters: bool = false

    Column {
        for article in viewModel.articles {
            Text(article.title)
        }
    }
    .onAppear {
        await viewModel.loadArticles()
    }
}
```

---

## See Also

- [Annotation Reference](reference/annotations.md) - Complete annotation documentation
- [Architecture Overview](architecture/01-overview.md) - Architecture patterns
- [Getting Started](getting-started/01-introduction.md) - Introduction to Weft

---

**Version:** 0.3.0
**Last Updated:** January 2025
