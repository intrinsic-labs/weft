# Patterns in Practice

This section covers practical implementation patterns for building scalable Weft applications. These patterns work together to create clean separation of concerns and maintainable architectures.

## The Three Core Patterns

### Repository Pattern

**Purpose:** Abstract data sources and provide a clean API for data access.

**Key responsibilities:**
- Coordinate between network, database, and cache
- Provide observable data streams
- Handle data transformation
- Manage data consistency

**Typical scope:** `@Singleton` (app-wide, shared across features)

**Learn more:** [Repository Pattern](06-repositories.md)

### ViewModel Pattern

**Purpose:** Coordinate presentation logic and UI state.

**Key responsibilities:**
- Transform repository data for UI display
- Handle user interactions
- Manage local UI state
- Coordinate multiple repositories/services

**Typical scope:** `@ViewScoped` (one per view/screen)

**Learn more:** [ViewModel Pattern](07-viewmodels.md)

### Service Pattern

**Purpose:** Provide business logic, utilities, and cross-cutting concerns.

**Key responsibilities:**
- Implement business rules
- Provide stateless operations
- Handle integrations (analytics, logging, etc.)
- Coordinate app-wide concerns

**Typical scope:** `@Singleton` (app-wide, shared)

**Learn more:** [Service Pattern](08-services.md)

## Architecture Layers

```
┌─────────────────────────────────────┐
│          UI Layer (Views)           │
│   - Render state                    │
│   - Handle user input               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Presentation Layer (ViewModels)  │
│   - Transform data for UI           │
│   - Coordinate user actions         │
│   - Manage local UI state           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Business Logic Layer (Services)   │
│   - Implement business rules        │
│   - Cross-cutting concerns          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Data Layer (Repositories)      │
│   - Manage data sources             │
│   - Coordinate API/DB/Cache         │
│   - Provide observable data         │
└─────────────────────────────────────┘
```

## Putting It All Together

Here's how the patterns work together in a complete feature:

```weft
// ============================================
// DATA LAYER - Repository
// ============================================

@Observable
@Repository
@Singleton
class TaskRepository {
    private var api: APIClient
    private var database: Database
    
    private(set) var tasks: [Task] = []
    private(set) var isLoading: bool = false
    
    func fetchTasks() async {
        @SumFunc
        => set loading to true
        => fetch tasks from API
        => save to database
        => update tasks array
        => set loading to false
    }
    
    func addTask(title: string, dueDate: datetime?) async {
        @SumFunc
        => create new task object
        => save to database
        => sync to API in background
        => add to tasks array
    }
    
    func toggleComplete(taskId: string) async {
        @SumFunc
        => find task by id
        => toggle completed state
        => update in database
        => sync to API
    }
}

// ============================================
// BUSINESS LOGIC - Service
// ============================================

@Service
@Singleton
class TaskAnalyticsService {
    private var analytics: AnalyticsService
    
    func trackTaskCreated(taskId: string) {
        analytics.trackEvent("task_created", ["task_id": taskId])
    }
    
    func trackTaskCompleted(taskId: string, duration: int) {
        analytics.trackEvent("task_completed", [
            "task_id": taskId,
            "duration_seconds": duration
        ])
    }
}

// ============================================
// PRESENTATION LAYER - ViewModel
// ============================================

@Observable
@ViewModel
@ViewScoped
class TaskListViewModel {
    private var repository: TaskRepository
    private var taskAnalytics: TaskAnalyticsService
    
    @State var filterType: TaskFilter = TaskFilter.ALL
    @State var newTaskTitle: string = ""
    @State var showCompleted: bool = true
    
    var filteredTasks: [Task] {
        @SumFunc
        => get all tasks from repository
        => filter by completion status
        => filter by filter type
        => sort by due date
        => return filtered and sorted tasks
    }
    
    var isLoading: bool {
        return repository.isLoading
    }
    
    func addTask() async {
        @SumFunc
        => return early if title is empty
        => call repository to add task
        => track task created event
        => clear new task title input
    }
    
    func toggleTask(taskId: string) async {
        @SumFunc
        => call repository to toggle completion
        => find task to check if now completed
        => if completed, track completion event
    }
    
    func refresh() async {
        await repository.fetchTasks()
    }
}

// ============================================
// UI LAYER - View
// ============================================

view TaskListView {
    var viewModel: TaskListViewModel
    @Environment var theme: Theme
    
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
        }
        
        // Task list
        if viewModel.isLoading {
            LoadingSpinner()
        } else {
            for task in viewModel.filteredTasks {
                TaskRow(
                    task: task,
                    onToggle: { viewModel.toggleTask(task.id) },
                    onDelete: { viewModel.deleteTask(task.id) }
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
3. ViewModel coordinates with **Repository** and **Service**
4. Repository updates observable state
5. View automatically re-renders

**Key principle:** State flows down, events flow up.

## Learn More

- [Repository Pattern](06-repositories.md) - Data layer implementation patterns
- [ViewModel Pattern](07-viewmodels.md) - Presentation layer patterns
- [Service Pattern](08-services.md) - Business logic and utilities

## See Also

- [Lifecycle & Scope](02-lifecycle-scope.md) - Object lifetimes
- [Observability](03-observability.md) - Reactive state
- [State Ownership](04-state-ownership.md) - UI state patterns