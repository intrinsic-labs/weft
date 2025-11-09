
## Putting It All Together

Here's how the architectural patterns work together in a complete feature:

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
