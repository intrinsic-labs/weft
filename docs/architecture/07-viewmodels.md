# ViewModel Pattern

ViewModels coordinate presentation logic and UI state for screens or features. They sit between views and repositories, transforming data for display and handling user interactions.

## Purpose

A ViewModel manages everything needed to present a screen:
- Transform repository data for UI display
- Handle user interactions and events
- Manage local UI state (search, filters, selections)
- Coordinate multiple repositories and services
- Handle navigation decisions

## Basic ViewModel

**Note:** The `@ViewModel` annotation explicitly marks this class as a ViewModel, communicating the presentation layer pattern to developers and translators.

```weft
@Observable
@ViewModel
@ViewScoped
class ArticleListViewModel {
    private var repository: ArticleRepository
    
    @State var searchQuery: string = ""
    @State var errorMessage: string? = null
    
    var articles: [Article] {
        @SumFunc
        => get articles from repository
        => filter by search query if not empty
        => return filtered results
    }
    
    var isLoading: bool {
        return repository.isLoading
    }
    
    func refresh() async {
        @SumFunc
        => clear error message
        => fetch articles from repository
        => handle any errors
    }
}
```

## Key Characteristics

**Explicit Annotation**: Always use `@ViewModel` to mark ViewModel classes. This communicates the pattern and helps with code organization.

**Observable State**: Use `@Observable` so views react to ViewModel changes.

**ViewScoped**: Typically `@ViewScoped` - one instance per view/screen.

**Local State**: Use `@State` for UI-specific state the ViewModel owns.

**Computed Properties**: Transform repository data without duplicating state.

## Common Patterns

### Form Validation

```weft
@Observable
@ViewModel
@ViewScoped
class RegistrationViewModel {
    private var authService: AuthService
    
    @State var email: string = ""
    @State var password: string = ""
    @State var confirmPassword: string = ""
    @State var isSubmitting: bool = false
    
    var emailError: string? {
        @SumFunc
        => return null if email is empty
        => return error if email invalid format
        => return null if valid
    }
    
    var passwordError: string? {
        @SumFunc
        => return null if password is empty
        => return error if password too short
        => return null if valid
    }
    
    var isFormValid: bool {
        return emailError == null && 
               passwordError == null &&
               password == confirmPassword &&
               !email.isEmpty
    }
    
    func submit() async {
        @SumFunc
        => return early if form not valid
        => set submitting to true
        => call auth service to register
        => navigate on success
        => set submitting to false
    }
}
```

### Coordinating Multiple Sources

```weft
@Observable
@ViewModel
@ViewScoped
class ProfileViewModel {
    private var userRepository: UserRepository
    private var articleRepository: ArticleRepository
    private var analytics: AnalyticsService
    
    @State var isLoading: bool = false
    
    private(set) var user: User? = null
    private(set) var userArticles: [Article] = []
    
    func loadProfile(userId: string) async {
        @SumFunc
        => set loading to true
        => fetch user and articles in parallel
        => update user and userArticles properties
        => track profile view in analytics
        => set loading to false
    }
}
```

### Search and Filtering

```weft
@Observable
@ViewModel
@ViewScoped
class ArticleListViewModel {
    private var repository: ArticleRepository
    
    @State var searchQuery: string = ""
    @State var selectedCategory: Category = Category.ALL
    @State var showBookmarkedOnly: bool = false
    
    var filteredArticles: [Article] {
        @SumFunc
        => start with all articles from repository
        => filter by search query if not empty
        => filter by selected category if not ALL
        => filter by bookmarked if showBookmarkedOnly
        => return filtered results
    }
    
    func clearFilters() {
        searchQuery = ""
        selectedCategory = Category.ALL
        showBookmarkedOnly = false
    }
}
```

### Navigation Handling

```weft
@Observable
@ViewModel
@ViewScoped
class ArticleListViewModel {
    private var repository: ArticleRepository
    private var analytics: AnalyticsService
    
    func selectArticle(id: string) {
        @SumFunc
        => track article view event in analytics
        => navigate to article detail screen with id
    }
    
    func shareArticle(id: string) {
        @SumFunc
        => get article from repository
        => create share content
        => present share sheet
        => track share event
    }
}
```

## Best Practices

**Don't Reference Views**: ViewModels should never hold view references.

```weft
// Good: View-agnostic ViewModel
@ViewModel
class ProfileViewModel {
    func saveProfile() async {
        // Update state, view reacts automatically
    }
}

// Avoid: Holding view reference
@ViewModel
class ProfileViewModel {
    var view: ProfileView?  // Don't do this
}
```

**Use Computed Properties**: Don't duplicate repository state.

```weft
// Good: Computed property
@ViewModel
class CartViewModel {
    private var cartRepository: CartRepository
    
    var items: [CartItem] {
        return cartRepository.items
    }
    
    var total: float {
        return items.reduce(0, (sum, item) => sum + item.price)
    }
}

// Avoid: Duplicated state
@ViewModel
class CartViewModel {
    @State var items: [CartItem]  // Duplicate of repository
    @State var total: float       // Can get out of sync
}
```

**Keep ViewModels Focused**: One ViewModel per screen or major component.

```weft
// Good: Focused ViewModels
@ViewModel class ArticleListViewModel { }
@ViewModel class ArticleDetailViewModel { }

// Avoid: Monolithic ViewModel
@ViewModel class ArticleViewModel { }  // Too broad
```

**Handle Loading and Error States**: Make state visible to views.

```weft
@Observable
@ViewModel
class ArticleListViewModel {
    @State var isLoading: bool = false
    @State var errorMessage: string? = null
    
    func refresh() async {
        isLoading = true
        errorMessage = null
        
        try {
            await repository.fetchArticles()
        } catch error {
            errorMessage = "Failed to load articles"
        } finally {
            isLoading = false
        }
    }
}
```

## Complete Example

```weft
@Observable
@ViewModel
@ViewScoped
class TaskListViewModel {
    private var repository: TaskRepository
    private var analytics: AnalyticsService
    
    @State var searchQuery: string = ""
    @State var filterType: TaskFilter = TaskFilter.ALL
    @State var isRefreshing: bool = false
    @State var errorMessage: string? = null
    
    var filteredTasks: [Task] {
        @SumFunc
        => get tasks from repository
        => filter by search query
        => filter by filter type (all, today, week)
        => sort by due date
        => return filtered tasks
    }
    
    var isLoading: bool {
        return repository.isLoading
    }
    
    func addTask(title: string) async {
        @SumFunc
        => return early if title is empty
        => call repository to add task
        => track task created event
    }
    
    func toggleTask(taskId: string) async {
        @SumFunc
        => call repository to toggle completion
        => track completion event if task now completed
    }
    
    func refresh() async {
        isRefreshing = true
        errorMessage = null
        
        try {
            await repository.fetchTasks()
        } catch error {
            errorMessage = "Failed to refresh"
        } finally {
            isRefreshing = false
        }
    }
    
    func clearFilters() {
        searchQuery = ""
        filterType = TaskFilter.ALL
    }
}
```

## See Also

- [Patterns Overview](05-patterns-overview.md) - How patterns work together
- [Repository Pattern](06-repositories.md) - Data layer ViewModels depend on
- [State Ownership](04-state-ownership.md) - Managing ViewModel state
- [Observability](03-observability.md) - Making ViewModels observable