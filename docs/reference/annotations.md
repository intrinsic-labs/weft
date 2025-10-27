# Annotation Reference

Complete reference of all annotations available in Weft.

## Quick Index

| Annotation | Purpose | Reference |
|------------|---------|-----------|
| `@Main` | Marks application entry point | [Core Annotations](../language/07-annotations.md#main) |
| `@Instruction` | Provides translator guidance | [Core Annotations](../language/07-annotations.md#instruction) |
| `@SumFunc` | Summarizes function logic in plain English | [Core Annotations](../language/07-annotations.md#sumfunc) |
| `@Index` | Documents directory contents | [Core Annotations](../language/07-annotations.md#index) |
| `@Observable` | Marks class with observable state | [Observability](../architecture/03-observability.md) |
| `@State` | Local state ownership | [State Ownership](../architecture/04-state-ownership.md#state) |
| `@Binding` | Two-way binding to parent state | [State Ownership](../architecture/04-state-ownership.md#binding) |
| `@Environment` | App-wide context injection | [State Ownership](../architecture/04-state-ownership.md#environment) |
| `@Singleton` | Application lifetime scope | [Lifecycle & Scope](../architecture/02-lifecycle-scope.md#singleton) |
| `@ViewScoped` | View/screen lifetime scope | [Lifecycle & Scope](../architecture/02-lifecycle-scope.md#viewscoped) |
| `@FeatureScoped` | Feature/flow lifetime scope | [Lifecycle & Scope](../architecture/02-lifecycle-scope.md#featurescoped) |
| `@SessionScoped` | User session lifetime scope | [Lifecycle & Scope](../architecture/02-lifecycle-scope.md#sessionscoped) |
| `@Repository` | Marks repository pattern class | [Repository Pattern](../architecture/06-repositories.md) |
| `@ViewModel` | Marks ViewModel pattern class | [ViewModel Pattern](../architecture/07-viewmodels.md) |
| `@Service` | Marks service pattern class | [Service Pattern](../architecture/08-services.md) |
| `@JSON` | Marks JSON serializable type | [Data Section](../data/01-json.md) *(coming soon)* |
| `@Schema` | Marks database schema | [Database Section](../data/02-databases.md) *(coming soon)* |
| `@Id` | Marks primary key field | [Database Section](../data/02-databases.md) *(coming soon)* |
| `@Field` | Marks database field | [Database Section](../data/02-databases.md) *(coming soon)* |
| `@ForeignKey` | Marks foreign key reference | [Database Section](../data/02-databases.md) *(coming soon)* |
| `@Index` | Marks indexed database field | [Database Section](../data/02-databases.md) *(coming soon)* |
| `@Unique` | Marks unique database field | [Database Section](../data/02-databases.md) *(coming soon)* |
| `@Required` | Marks required database field | [Database Section](../data/02-databases.md) *(coming soon)* |
| `@Nullable` | Marks nullable database field | [Database Section](../data/02-databases.md) *(coming soon)* |
| `@Transient` | Excludes field from database | [Database Section](../data/02-databases.md) *(coming soon)* |

## Core Language Annotations

### @Main
**Purpose:** Marks the application entry point  
**Applied to:** Classes or functions  
**Example:**
```weft
@Main
class MyApp: App {
    var content: View {
        MainView()
    }
}
```

### @Instruction
**Purpose:** Provides specific guidance to translators  
**Applied to:** Types, functions, properties  
**Example:**
```weft
@Instruction('''
Use the lightweight image variant for thumbnails
to optimize memory usage
''')
func loadThumbnail(url: string) => Image {
    // implementation
}
```

### @SumFunc
**Purpose:** Describes function logic in plain English  
**Applied to:** Inside function bodies  
**Example:**
```weft
func processOrders() async {
    @SumFunc
    => fetch pending orders from database
    => validate each order
    => send to fulfillment service
    => update order status
}
```

### @Index
**Purpose:** Documents directory contents and structure  
**Applied to:** Special index.weft files  
**Example:**
```weft
@Index('repositories')

# Repositories Directory

Data layer implementations for all domain entities.
```

## Architecture Annotations

### @Observable
**Purpose:** Marks class with observable state that triggers UI updates  
**Applied to:** Classes (repositories, ViewModels, services)  
**Example:**
```weft
@Observable
class ArticleRepository {
    private(set) var articles: [Article] = []
}
```

### @Singleton
**Purpose:** Object lives for entire application lifetime  
**Applied to:** Classes (repositories, services)  
**Example:**
```weft
@Singleton
@Repository
class UserRepository {
    // shared across entire app
}
```

### @ViewScoped
**Purpose:** Object lives while view/screen is visible  
**Applied to:** Classes (ViewModels)  
**Example:**
```weft
@ViewScoped
@ViewModel
class ArticleDetailViewModel {
    // created when view appears, destroyed when dismissed
}
```

### @FeatureScoped
**Purpose:** Object lives while feature/flow is active  
**Applied to:** Classes (services, coordinators)  
**Example:**
```weft
@FeatureScoped
class CheckoutCoordinator {
    // lives during checkout flow
}
```

### @SessionScoped
**Purpose:** Object lives while user session is active  
**Applied to:** Classes (auth-related services)  
**Example:**
```weft
@SessionScoped
class UserSessionService {
    // lives from login to logout
}
```

## Pattern Annotations

### @Repository
**Purpose:** Marks class as data layer repository  
**Applied to:** Classes managing data access  
**Example:**
```weft
@Repository
@Singleton
@Observable
class ArticleRepository {
    // data access and management
}
```

### @ViewModel
**Purpose:** Marks class as presentation layer ViewModel  
**Applied to:** Classes coordinating UI presentation  
**Example:**
```weft
@ViewModel
@ViewScoped
@Observable
class ArticleListViewModel {
    // presentation logic
}
```

### @Service
**Purpose:** Marks class as business logic service  
**Applied to:** Classes providing utilities or business rules  
**Example:**
```weft
@Service
@Singleton
class AnalyticsService {
    // cross-cutting concerns
}
```

## State Management Annotations

### @State
**Purpose:** Local state owned and managed by current scope  
**Applied to:** Properties in views and ViewModels  
**Example:**
```weft
view CounterView {
    @State var count: int = 0
}
```

### @Binding
**Purpose:** Two-way connection to parent's state  
**Applied to:** Properties in child views  
**Example:**
```weft
view TextField {
    @Binding var text: string
}
```

### @Environment
**Purpose:** Access to app-wide or feature-wide shared state  
**Applied to:** Properties in views  
**Example:**
```weft
view ArticleView {
    @Environment var theme: Theme
}
```

## Data & Database Annotations

**Note:** Database annotations are documented in detail in the [Data Section](../data/02-databases.md). Below is a quick reference.

### @JSON
**Purpose:** Marks type for JSON serialization  
**Applied to:** Data types

### @Schema / @Entity / @DatabaseModel
**Purpose:** Marks database schema definition  
**Applied to:** Data types  
**Note:** All three are equivalent

### @Id
**Purpose:** Marks primary key field  
**Applied to:** Properties  
**Usage:** `@Id(generated)` for auto-generated keys

### @Field
**Purpose:** Explicitly marks database field (usually implicit)  
**Applied to:** Properties

### @ForeignKey / @Reference / @Relation
**Purpose:** Marks foreign key reference  
**Applied to:** Properties  
**Usage:** `@ForeignKey('table_name')`

### @Index
**Purpose:** Marks field for database indexing  
**Applied to:** Properties

### @Unique
**Purpose:** Marks field as unique across records  
**Applied to:** Properties

### @Required
**Purpose:** Marks field as required  
**Applied to:** Properties

### @Nullable / @Optional
**Purpose:** Marks field as allowing null values  
**Applied to:** Properties

### @Transient / @Exclude / @Ignore / @NotField
**Purpose:** Excludes field from database  
**Applied to:** Properties  
**Note:** All four are equivalent

## Combining Annotations

Annotations are often used together to fully describe a type:

```weft
@Observable
@Repository
@Singleton
class ArticleRepository {
    // Observable: state changes trigger updates
    // Repository: data layer pattern
    // Singleton: app-wide lifetime
}

@Observable
@ViewModel
@ViewScoped
class ArticleListViewModel {
    // Observable: state changes trigger UI updates
    // ViewModel: presentation layer pattern
    // ViewScoped: lives with the view
}
```

## See Also

- [Core Annotations](../language/07-annotations.md) - Language-level annotations
- [Architecture Overview](../architecture/01-overview.md) - Architecture patterns
- [Lifecycle & Scope](../architecture/02-lifecycle-scope.md) - Scope annotations
- [State Ownership](../architecture/04-state-ownership.md) - State annotations