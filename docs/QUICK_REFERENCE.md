# Weft Quick Reference

A quick reference guide for Weft's key annotations and patterns.

## Architecture Annotations

### Lifecycle/Scope Annotations

Control how long objects live:

```weft
@Singleton          // Lives for entire app lifetime
@ViewScoped         // Lives while view/screen is visible
@FeatureScoped      // Lives while feature/flow is active
@SessionScoped      // Lives while user session is active
```

**Example:**
```weft
@Singleton
@Repository
class ArticleRepository { }

@ViewScoped
@ViewModel
class ArticleListViewModel { }
```

### Semantic Type Annotations

Communicate the role a type plays:

```weft
@Repository         // Data layer abstraction
@ViewModel          // Presentation layer coordinator
@Service            // Business logic and utilities
```

**Example:**
```weft
@Repository
@Singleton
class UserRepository { }

@Service
@Singleton
class AnalyticsService { }

@ViewModel
@ViewScoped
class ProfileViewModel { }
```

### Observability Annotations

Control reactive state:

```weft
@Observable         // Type has observable state (mark the class)
@State              // Local state ownership
@Binding            // Two-way parent-child binding
@Environment        // App-wide context injection
```

**Example:**
```weft
// Mark class as observable
@Observable
@Repository
class ArticleRepository {
    private(set) var articles: [Article] = []
}

// Use in ViewModel
@ViewModel
class ArticleListViewModel {
    private var repository: ArticleRepository  // Observable
    @State var errorMessage: string? = nil     // Local state
}

// Use in View
view ArticleListView {
    var viewModel: ArticleListViewModel        // Observable
    @Environment var theme: Theme              // From context
    @State var isExpanded: bool = false        // Local state
}
```

## Core Annotations

### @Instruction

Provide specific guidance to translators:

```weft
@Instruction('''
API return clarification -
The API call will return both a featured_image and
a featured_image_full value; please map the plain
featured_image during target implementation.
''')
```

### @SumFunc

Summarize function logic:

```weft
func fetchPosts() => [Post] {
    @SumFunc
    => use the self.filter property to call the posts api endpoint
    => organize results into a function scoped variable
    => return the variable as an array of type Post
}
```

### @Main

Mark application entry point:

```weft
@Main
class MyApp: App {
    @State var theme = Theme()
    
    var content: View {
        MainView() {
            environment: [theme]
        }
    }
}
```

## Database Annotations

```weft
@Schema             // Marks a database schema
@Id(generated)      // Primary key (auto-generated)
@Field              // Database field (usually implicit)
@Transient          // Ignore in database
@ForeignKey("table") // Foreign key reference
@Index              // Index this field
@Nullable           // Allows null values
@Required           // Required field
@Unique             // Must be unique
```

**Example:**
```weft
@Schema
struct User {
    @Id(generated)
    var id: string
    
    @Index
    var email: string
    
    @Nullable
    var nickname: string?
    
    @Transient
    var isSelected: bool = false
}
```

## Definition Keywords

```weft
type        // General-purpose type definition
class       // Complex functionality with inheritance
struct      // Data-centric with helper methods
data        // Pure data (auto-generates boilerplate)
object      // Singleton instance
view        // UI component
```

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

## Access Modifiers

```weft
public              // Accessible everywhere
private             // Accessible only within type
protected           // Accessible in type and subclasses
internal            // Accessible within same module
private(set)        // Readable everywhere, writable privately
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
    
    func fetchArticles() async {
        isLoading = true
        articles = await api.fetchArticles()
        await database.saveArticles(articles)
        isLoading = false
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
    
    @State var errorMessage: string? = nil
    
    var articles: [Article] {
        return repository.articles
    }
    
    func refresh() async {
        try {
            await repository.fetchArticles()
        } catch error {
            errorMessage = error.message
        }
    }
}
```

### View Pattern

```weft
view ArticleListView {
    var viewModel: ArticleListViewModel
    @Environment var theme: Theme
    
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

## Scope Hierarchy

Valid dependency flow (longer → shorter lifetimes):

```
@Singleton
    ├── Can be injected into @SessionScoped
    ├── Can be injected into @FeatureScoped
    └── Can be injected into @ViewScoped

@SessionScoped
    ├── Can be injected into @FeatureScoped
    └── Can be injected into @ViewScoped

@FeatureScoped
    └── Can be injected into @ViewScoped

@ViewScoped
    └── Cannot be injected into longer-lived scopes
```

## State Management Summary

```weft
@Observable         // "I have state that changes over time"
@State              // "I own and create this local state"
@Binding            // "I have two-way access to parent's state"
@Environment        // "Give me this from app-wide context"
```

## Quick Decision Tree

**Defining a type?**
- Data only, no methods → `data`
- Data with helper methods → `struct`
- Complex state/behavior → `class`
- Singleton/constants → `object`
- UI component → `view`

**How long does it live?**
- Entire app → `@Singleton`
- User session → `@SessionScoped`
- Feature/flow → `@FeatureScoped`
- Single screen → `@ViewScoped`

**What's its role?**
- Data layer → `@Repository`
- Business logic → `@Service`
- Presentation → `@ViewModel`

**Does state change?**
- Yes, and others observe → `@Observable`
- Yes, local only → `@State`
- Yes, from parent → `@Binding`
- App-wide shared → `@Environment`

---

**Version:** 0.2.0  
**Last Updated:** October 2025