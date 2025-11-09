# Roles & Patterns

This section covers practical implementation patterns for building scalable Weft applications. These patterns work together to create clean separation of concerns and maintainable architectures based on **Clean Architecture** principles.

## Clean Architecture in Weft

Weft's architecture is built on **Clean Architecture** principles, which organize code into concentric layers with clear dependency rules.

### The Dependency Rule

**Inner layers cannot depend on outer layers.**

```
┌─────────────────────────────────────────────┐
│  FRAMEWORKS & DRIVERS                       │  ← Outermost
│  @Role(adapter), @Schema                    │
│  ┌────────────────────────────────────────┐ │
│  │  INTERFACE ADAPTERS                    │ │
│  │  @Role(repository|service|             │ │
│  │        viewmodel|gateway)              │ │
│  │  ┌───────────────────────────────────┐ │ │
│  │  │  USE CASES                        │ │ │
│  │  │  @Role(usecase)                   │ │ │
│  │  │  ┌─────────────────────────────┐  │ │ │
│  │  │  │  ENTITIES                   │  │ │ │  ← Innermost
│  │  │  │  @Role(entity)              │  │ │ │
│  │  │  └─────────────────────────────┘  │ │ │
│  │  └───────────────────────────────────┘ │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Why Clean Architecture?

**Benefits:**
- Clear separation of concerns
- Testability (mock outer layers)
- Framework independence (business logic doesn't depend on UI or database)
- Scalability (easy to add features)
- Enforced boundaries (LSP validates dependencies)

Learn more: [Clean Architecture](10-clean-architecture.md)

## The 8 Role Annotations

Weft provides 8 role annotations that map to Clean Architecture layers:

### Core Layer (Innermost)

**@Role(entity)** - Pure business objects with no dependencies
```weft
@Role(entity)
data Article {
    var id: string
    var title: string
    var content: string
    var publishedAt: datetime

    func isPublished() -> bool {
        return publishedAt <= datetime.now()
    }
}
```

**@Role(usecase)** - Application business rules
```weft
@Role(usecase)
class PublishArticleUseCase {
    private var repository: ArticleRepository  // Interface

    func execute(articleId: string) async throws {
        @SumFunc
        => fetch article from repository
        => validate article is ready for publishing
        => set published date to now
        => save article back to repository
    }
}
```

### Interface Adapters Layer

**@Role(repository)** - Data access interface
```weft
@Role(repository)
protocol ArticleRepository {
    var articles: [Article] { get }
    func fetchArticles() async throws
    func save(article: Article) async throws
}
```

**@Role(service)** - Business utility interface
```weft
@Role(service)
protocol AnalyticsService {
    func trackEvent(name: string, properties: [string: any])
}
```

**@Role(viewmodel)** - Presentation logic
```weft
@Role(viewmodel)
@Lifecycle(view)
@Publisher
class ArticleListViewModel {
    @Subscriber private var repository: ArticleRepository

    var articles: [Article] {
        return repository.articles
    }
}
```

**@Role(gateway)** - External service interface
```weft
@Role(gateway)
protocol PaymentGateway {
    func processPayment(amount: float, method: PaymentMethod) async throws -> Receipt
}
```

**@Role(dto)** - Data transfer objects (boundary crossing)
```weft
@Role(dto)
data ArticleDTO {
    var id: string
    var title: string
    var author_name: string  // External API format

    func toEntity() -> Article {
        @SumFunc
        => create Article from DTO fields
        => map author_name to author property
        => return entity
    }
}
```

### Frameworks & Drivers Layer (Outermost)

**@Role(adapter)** - Concrete implementations
```weft
@Role(adapter)
@Lifecycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository {
    private var api: APIClient
    private var database: Database

    private(set) var articles: [Article] = []

    func fetchArticles() async throws {
        var dtos = await api.fetchArticles()
        articles = dtos.map(dto => dto.toEntity())
        await database.saveArticles(articles)
    }
}
```

## Implementing These Core Patterns

### Repository Pattern

**Purpose:** Abstract data sources and provide a clean API for data access.

**Key responsibilities:**
- Coordinate between network, database, and cache
- Provide observable data streams
- Handle entity ↔ DTO conversion
- Manage data consistency

**Typical scope:** `@Lifecycle(singleton)` (app-wide, shared across features)

**Pattern:**
- Define interface with `@Role(repository)`
- Implement with `@Role(adapter)` + `@Lifecycle(singleton)` + `@Publisher`
- Use `@Role(dto)` for API/DB boundary objects
- Return `@Role(entity)` objects to consumers

**Learn more:** [Repository Pattern](06-repositories.md)

### ViewModel Pattern

**Purpose:** Coordinate presentation logic and UI state.

**Key responsibilities:**
- Transform repository data for UI display
- Handle user interactions
- Manage local UI state
- Coordinate multiple repositories/services

**Typical scope:** `@Lifecycle(view)` (one per view/screen)

**Pattern:**
- Use `@Role(viewmodel)` + `@Lifecycle(view)` + `@Publisher`
- Inject repositories and services via `@Subscriber`
- Expose computed properties for UI
- Keep business logic in use cases or services

**Learn more:** [ViewModel Pattern](07-viewmodels.md)

### Service Pattern

**Purpose:** Provide business logic, utilities, and cross-cutting concerns.

**Key responsibilities:**
- Implement business rules
- Provide stateless operations
- Handle integrations (analytics, logging, etc.)
- Coordinate app-wide concerns

**Typical scope:** `@Lifecycle(singleton)` (app-wide, shared)

**Pattern:**
- Define interface with `@Role(service)` or `@Role(gateway)`
- Implement with `@Role(adapter)` + `@Lifecycle(singleton)`
- No observable state for stateless services
- Use `@Publisher` if service maintains state

**Learn more:** [Service Pattern](08-services.md)

## Architecture Layers

```
┌─────────────────────────────────────┐
│          UI Layer (Views)           │
│   - Render state                    │
│   - Handle user input               │
│   - @Subscriber for ViewModels      │
│   - @LocalState for UI state        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Presentation Layer (ViewModels)  │
│   - @Role(viewmodel)                │
│   - Transform data for UI           │
│   - Coordinate user actions         │
│   - Manage local UI state           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Business Logic Layer              │
│   - @Role(usecase)                  │
│   - @Role(service) interfaces       │
│   - @Role(gateway) interfaces       │
│   - Implement business rules        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Entity Layer                   │
│   - @Role(entity)                   │
│   - Pure business objects           │
│   - No dependencies                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Data Layer (Repositories)         │
│   - @Role(repository) interfaces    │
│   - @Role(adapter) implementations  │
│   - @Role(dto) for boundaries       │
│   - Manage data sources             │
└─────────────────────────────────────┘
```

## Putting It All Together

Here's how the patterns work together in a complete feature:

```weft
// ============================================
// ENTITIES LAYER - Core business objects
// ============================================

@Role(entity)
data Task {
    var id: string
    var title: string
    var completed: bool
    var dueDate: datetime?
    var createdAt: datetime

    func isOverdue() -> bool {
        if let due = dueDate {
            return !completed && due < datetime.now()
        }
        return false
    }
}

// ============================================
// DATA LAYER - DTOs & Repository
// ============================================

@Role(dto)
data TaskDTO {
    var id: string
    var title: string
    var is_completed: bool  // API uses snake_case
    var due_date: string?
    var created_at: string

    func toEntity() -> Task {
        @SumFunc
        => create Task from DTO fields
        => convert is_completed to completed
        => parse due_date string to datetime
        => parse created_at string to datetime
        => return entity
    }
}

@Role(repository)
protocol TaskRepository {
    var tasks: [Task] { get }
    var isLoading: bool { get }
    func fetchTasks() async throws
    func addTask(title: string, dueDate: datetime?) async throws
    func toggleComplete(taskId: string) async throws
}

@Role(adapter)
@Lifecycle(singleton)
@Publisher
class TaskRepositoryImpl: TaskRepository {
    private var api: APIClient
    private var database: Database

    private(set) var tasks: [Task] = []
    private(set) var isLoading: bool = false

    func fetchTasks() async throws {
        isLoading = true

        var dtos: [TaskDTO] = await api.fetchTasks()
        tasks = dtos.map(dto => dto.toEntity())
        await database.saveTasks(tasks)

        isLoading = false
    }

    func addTask(title: string, dueDate: datetime?) async throws {
        @SumFunc
        => create new Task entity
        => save to database
        => sync to API in background
        => add to tasks array
    }

    func toggleComplete(taskId: string) async throws {
        @SumFunc
        => find task by id in tasks array
        => toggle completed state
        => update in database
        => sync to API
        => update tasks array
    }
}

// ============================================
// BUSINESS LOGIC - Services & Use Cases
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

@Role(usecase)
class CompleteTaskUseCase {
    private var repository: TaskRepository
    private var analytics: AnalyticsService

    func execute(taskId: string) async throws {
        @SumFunc
        => toggle task completion in repository
        => get completed task from repository
        => calculate time to complete
        => track completion event with analytics
    }
}

// ============================================
// PRESENTATION LAYER - ViewModel
// ============================================

@Role(viewmodel)
@Lifecycle(view)
@Publisher
class TaskListViewModel {
    @Subscriber private var repository: TaskRepository
    private var completeTaskUseCase: CompleteTaskUseCase

    var filterType: TaskFilter = TaskFilter.ALL
    var newTaskTitle: string = ""
    var showCompleted: bool = true

    var filteredTasks: [Task] {
        @SumFunc
        => get all tasks from repository
        => filter by completion status based on showCompleted
        => filter by filter type (all, today, week, overdue)
        => sort by due date
        => return filtered and sorted tasks
    }

    var isLoading: bool {
        return repository.isLoading
    }

    var overdueCount: int {
        return repository.tasks.filter(t => t.isOverdue()).count
    }

    func addTask() async {
        @SumFunc
        => return early if title is empty
        => call repository to add task
        => clear new task title input
    }

    func toggleTask(taskId: string) async {
        try {
            await completeTaskUseCase.execute(taskId)
        } catch error {
            // Handle error
        }
    }

    func refresh() async {
        try {
            await repository.fetchTasks()
        } catch error {
            // Handle error
        }
    }
}

// ============================================
// UI LAYER - View
// ============================================

view TaskListView {
    @Subscriber var viewModel: TaskListViewModel
    @Subscriber(source: environment) var theme: Theme

    @LocalState var showFilters: bool = false

    Column(
        isScrollable: true
        onRefresh: viewModel.refresh()
    ) {
        // Add task input
        Row(padding: 16) {
            TextField(text: $viewModel.newTaskTitle) {
                placeholder: "New task..."
            }

            Button(action: { viewModel.addTask() }) {
                text: "Add"
                isDisabled: viewModel.newTaskTitle.isEmpty
            }
        }

        // Filter controls
        Row(padding: 16) {
            SegmentedControl(
                selected: $viewModel.filterType,
                options: [TaskFilter.ALL, TaskFilter.TODAY, TaskFilter.WEEK]
            )

            Toggle(
                isOn: $viewModel.showCompleted,
                label: "Show Completed"
            )

            if viewModel.overdueCount > 0 {
                Badge(count: viewModel.overdueCount) {
                    text: "Overdue"
                    color: theme.errorColor
                }
            }
        }

        // Task list
        if viewModel.isLoading {
            LoadingSpinner()
        } else {
            for task in viewModel.filteredTasks {
                TaskRow(
                    task: task,
                    onToggle: { viewModel.toggleTask(task.id) }
                )
            }
        }
    }
}
```

## Data Flow

**Unidirectional flow:**
1. User interacts with **View**
2. View calls **ViewModel** method
3. ViewModel calls **Use Case** or **Repository**
4. Repository updates **Entities**
5. Repository publishes state changes
6. ViewModel recomputes properties
7. View automatically re-renders

**Key principle:** State flows down, events flow up.

```
User Action
    ↓
  View
    ↓
ViewModel  ←───┐
    ↓          │
Use Case       │
    ↓          │
Repository     │ Observable
    ↓          │ State Changes
Entity         │
    ↓          │
Database/API   │
    ↓          │
    └──────────┘
```

## Dependency Examples

### ✅ Valid Dependencies (Following Dependency Rule)

```weft
// ViewModel depends on Repository (inner layer)
@Role(viewmodel)
class ArticleListViewModel {
    @Subscriber private var repository: ArticleRepository  // OK
}

// Use Case depends on Entity (inner layer)
@Role(usecase)
class PublishArticleUseCase {
    func execute(article: Article) { }  // OK - entity is inner layer
}

// Adapter depends on anything (outermost layer)
@Role(adapter)
class ArticleRepositoryImpl: ArticleRepository {
    private var api: APIClient  // OK
    private var database: Database  // OK
}
```

### ❌ Invalid Dependencies (Violating Dependency Rule)

```weft
// Repository interface depends on ViewModel (outer layer)
@Role(repository)
protocol ArticleRepository {
    func notify(viewModel: ArticleListViewModel)  // ERROR!
}

// Entity depends on Repository (outer layer)
@Role(entity)
data Article {
    private var repository: ArticleRepository  // ERROR!
}

// Use Case depends on ViewModel (outer layer)
@Role(usecase)
class PublishArticleUseCase {
    private var viewModel: ArticleListViewModel  // ERROR!
}
```

## Best Practices

**Separate interfaces from implementations:**
```weft
// ✅ Good: Interface in inner layer, implementation in outer layer
@Role(repository)
protocol ArticleRepository { }

@Role(adapter)
class ArticleRepositoryImpl: ArticleRepository { }
```

**Use DTOs at boundaries:**
```weft
// ✅ Good: DTO for API, Entity for business logic
@Role(dto)
data ArticleDTO {
    func toEntity() -> Article { }
}

@Role(adapter)
class ArticleRepositoryImpl: ArticleRepository {
    func fetchArticles() async -> [Article] {
        var dtos = await api.fetch()
        return dtos.map(dto => dto.toEntity())  // Convert at boundary
    }
}
```

**Keep business logic in use cases:**
```weft
// ✅ Good: Complex business logic in use case
@Role(usecase)
class ProcessOrderUseCase {
    func execute(order: Order) async throws {
        @SumFunc
        => validate order items
        => calculate total with tax
        => process payment
        => create shipment
        => send confirmation email
    }
}
```

**ViewModels coordinate, don't contain business logic:**
```weft
// ✅ Good: ViewModel delegates to use case
@Role(viewmodel)
class CheckoutViewModel {
    private var processOrderUseCase: ProcessOrderUseCase

    func checkout() async {
        await processOrderUseCase.execute(currentOrder)
    }
}
```

## Validation

The Weft LSP validates Clean Architecture rules:

```json
// weft.settings.json
{
  "validation": {
    "dependencyRule": "error",      // Enforce CA dependency rule
    "layerViolations": "error",     // Enforce layer boundaries
    "lifecycleViolations": "warning"
  },
  "architecture": {
    "style": "clean"
  }
}
```

## See Also

- [Lifecycle & Scope](02-lifecycle-scope.md) - Object lifetimes
- [Observability](03-observability.md) - Reactive state with @Publisher
- [UI State Ownership](04-ui-state-ownership.md) - UI state patterns with @LocalState
- [Annotations Reference](../reference/annotations.md) - Complete annotation guide
