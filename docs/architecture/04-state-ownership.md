# State Ownership

State ownership defines who creates, manages, and has the authority to modify state in your application. Weft provides explicit annotations to communicate state ownership patterns that translate cleanly to all UI frameworks.

## Core Concepts

**State ownership** answers three questions:
1. Who creates this state?
2. Who can modify this state?
3. How does this state flow through the app?

Weft's state annotations make these relationships explicit, helping you reason about data flow and preventing common bugs.

## State Annotations

### @LocalState

Local state owned and managed by a view. This is ephemeral UI state that doesn't need to persist beyond the view's lifetime.

```weft
view CounterView {
    @LocalState var count: int = 0
    @LocalState var isExpanded: bool = false

    Button(action: { count += 1 }) {
        text: "Count: \(count)"
    }
}
```

**Use @LocalState when:**
- The view creates and owns the state
- State is purely for UI purposes (expanded panels, selected tabs, etc.)
- No parent needs to modify it
- State should reset when view is recreated

**Important:** `@LocalState` is **only valid in views**. The LSP will show an error if you try to use it elsewhere.

```weft
// ❌ Invalid: @LocalState only allowed in views
@Role(viewmodel)
class MyViewModel {
    @LocalState var count: int = 0  // ERROR!
}

// ✅ Valid: @LocalState in a view
view MyView {
    @LocalState var count: int = 0  // OK
}
```

### @Subscriber

Observes a `@Publisher` and receives updates when its state changes. Required when observing ViewModels, repositories, or services.

```weft
view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel  // Observes ViewModel
    @LocalState var showFilters: bool = false  // Local UI state

    Column {
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

**Use @Subscriber when:**
- Observing a `@Publisher` class (ViewModel, repository, service)
- You need reactive updates when the publisher's state changes
- Required in v0.3.0 (LSP will warn if missing)

### @Binding

Two-way connection to state owned by a parent view. Allows reading and writing parent's state.

```weft
view ParentView {
    @LocalState var searchText: string = ""

    SearchBar(searchText: $searchText)  // Pass binding with $
}

view SearchBar {
    @Binding var searchText: string  // Two-way connection

    TextField(binding: $searchText) {
        placeholder: "Search..."
    }
}
```

**Use @Binding when:**
- A child view needs to read AND write parent's state
- Creating reusable components that modify external state
- Building form inputs or interactive controls

**The $ prefix** signals passing a binding (two-way connection) rather than a value (one-way).

**Note:** `@Binding` is sugar for `@Subscriber(writable: true, source: parent)`.

### Environment Values

Access to app-wide or feature-wide shared state from context using `@Subscriber(source: environment)`.

```weft
view ArticleView {
    @Subscriber(source: environment) var theme: Theme
    @Subscriber(source: environment) var authService: AuthService

    Column {
        Text(article.title) {
            textColor: theme.primaryColor
        }
    }
}
```

**Use environment subscription when:**
- State is shared across many views
- You don't want to pass state through every intermediate view
- Working with app-wide concerns (theme, auth, navigation, etc.)

**Note:** In v0.3.0, the old `@Environment` annotation has been replaced by `@Subscriber(source: environment)`.

## State Flow Patterns

### Parent → Child (One-Way)

Pass values down for read-only access:

```weft
view ParentView {
    @LocalState var userName: string = "Alice"

    ChildView(userName: userName)  // Pass value
}

view ChildView {
    var userName: string  // Read-only property

    Text("Hello, \(userName)")
}
```

### Parent ↔ Child (Two-Way)

Use @Binding for bidirectional communication:

```weft
view SettingsView {
    @LocalState var isDarkMode: bool = false

    ToggleControl(
        label: "Dark Mode",
        isOn: $isDarkMode  // Pass binding
    )
}

view ToggleControl {
    var label: string
    @Binding var isOn: bool  // Can read and write

    Button(action: { isOn = !isOn }) {
        text: "\(label): \(isOn ? 'On' : 'Off')"
    }
}
```

### Observing ViewModels

Views observe ViewModels using `@Subscriber`:

```weft
@Role(viewmodel)
@LifeCycle(view)
@Publisher
class ArticleListViewModel {
    private(set) var articles: [Article] = []
    private(set) var isLoading: bool = false
}

view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel  // Required!

    Column {
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

### Shared Observable State

Multiple views can observe the same repository/service through their ViewModels:

```weft
@Role(adapter)
@LifeCycle(singleton)
@Publisher
class UserRepository {
    private(set) var currentUser: User? = null
}

@Role(viewmodel)
@LifeCycle(view)
@Publisher
class ProfileViewModel {
    @Subscriber private var userRepository: UserRepository
    
    var userName: string? {
        return userRepository.currentUser?.name
    }
}

@Role(viewmodel)
@LifeCycle(view)
@Publisher
class NavBarViewModel {
    @Subscriber private var userRepository: UserRepository
    
    var isLoggedIn: bool {
        return userRepository.currentUser != null
    }
}

// Both ViewModels automatically update when repository changes
view ProfileView {
    @Subscriber var viewModel: ProfileViewModel
    Text(viewModel.userName ?? "Guest")
}

view NavBarView {
    @Subscriber var viewModel: NavBarViewModel
    if viewModel.isLoggedIn {
        UserAvatar()
    }
}
```

## Environment Injection

Provide environment values at the root of your view hierarchy:

```weft
@Main
class MyApp: App {
    @LocalState var theme = Theme()
    @LocalState var authService = AuthService()

    var content: View {
        MainView() {
            environment: [theme, authService]
        }
    }
}
```

Child views automatically have access via `@Subscriber(source: environment)`:

```weft
view SettingsView {
    @Subscriber(source: environment) var theme: Theme

    ColorPicker(
        selectedColor: $theme.primaryColor
    )
}
```

## Complete Example

```weft
// ============================================
// DATA LAYER - Repository
// ============================================

@Role(repository)
protocol ArticleRepository {
    var articles: [Article] { get }
    var isLoading: bool { get }
    func fetchArticles() async
}

@Role(adapter)
@LifeCycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository {
    private(set) var articles: [Article] = []
    private(set) var isLoading: bool = false

    func fetchArticles() async {
        @SumFunc
        => set loading state to true
        => fetch articles from API
        => update articles array
        => set loading state to false
    }
}

// ============================================
// PRESENTATION LAYER - ViewModel
// ============================================

@Role(viewmodel)
@LifeCycle(view)
@Publisher
class ArticleListViewModel {
    @Subscriber private var repository: ArticleRepository

    var searchQuery: string = ""
    var selectedFilter: Filter = Filter.ALL

    var articles: [Article] {
        @SumFunc
        => get articles from repository
        => filter by search query if not empty
        => filter by selected filter
        => return filtered results
    }

    var isLoading: bool {
        return repository.isLoading
    }

    func refresh() async {
        await repository.fetchArticles()
    }
}

// ============================================
// UI LAYER - View
// ============================================

view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel
    @Subscriber(source: environment) var theme: Theme

    @LocalState var showFilters: bool = false

    Column {
        SearchBar(searchQuery: $viewModel.searchQuery)

        Button(action: { showFilters = !showFilters }) {
            text: "Filters"
        }

        if showFilters {
            FilterSheet(
                selectedFilter: $viewModel.selectedFilter,
                onDismiss: { showFilters = false }
            )
        }

        if viewModel.isLoading {
            LoadingSpinner()
        } else {
            for article in viewModel.articles {
                ArticleCard(article: article)
            }
        }
    }
}

view SearchBar {
    @Binding var searchQuery: string

    TextField(binding: $searchQuery) {
        placeholder: "Search articles..."
    }
}

view FilterSheet {
    @Binding var selectedFilter: Filter
    var onDismiss: () => void

    Column {
        for filter in Filter.allCases {
            Button(action: {
                selectedFilter = filter
                onDismiss()
            }) {
                text: filter.displayName
            }
        }
    }
}
```

## Platform Translation

**Swift/SwiftUI:**
```swift
struct CounterView: View {
    @State private var count: Int = 0
    @Binding var parentValue: String
    @Environment(\.theme) var theme
    @State private var viewModel: ArticleListViewModel

    var body: some View {
        // ...
    }
}
```

**Kotlin/Compose:**
```kotlin
@Composable
fun CounterView(
    parentValue: MutableState<String>,
    theme: Theme = LocalTheme.current,
    viewModel: ArticleListViewModel = viewModel()
) {
    var count by remember { mutableStateOf(0) }

    // ...
}
```

**TypeScript/React:**
```typescript
function CounterView({ parentValue, setParentValue }) {
    const [count, setCount] = useState(0);
    const theme = useContext(ThemeContext);
    const viewModel = useViewModel(ArticleListViewModel);

    // ...
}
```

## Best Practices

**Prefer @LocalState for ephemeral UI state**

```weft
view ArticleCard {
    var article: Article
    @LocalState var isExpanded: bool = false  // UI state only

    Column {
        Text(article.title)

        if isExpanded {
            Text(article.content)
        }

        Button(action: { isExpanded = !isExpanded }) {
            text: isExpanded ? "Show Less" : "Show More"
        }
    }
}
```

**Always use @Subscriber when observing publishers**

```weft
// ❌ Bad: Missing @Subscriber
view ArticleListView {
    var viewModel: ArticleListViewModel  // LSP warning!
}

// ✅ Good: Explicit subscription
view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel
}
```

**Use @Binding for reusable UI components**

```weft
view TextField {
    @Binding var text: string
    var placeholder: string

    // Reusable text input that modifies parent state
}

view Form {
    @LocalState var email: string = ""
    @LocalState var password: string = ""

    TextField(text: $email, placeholder: "Email")
    TextField(text: $password, placeholder: "Password")
}
```

**Use environment subscription sparingly**

```weft
// ✅ Good: Truly app-wide concerns
@Subscriber(source: environment) var theme: Theme
@Subscriber(source: environment) var authService: AuthService
@Subscriber(source: environment) var navigation: NavigationController

// ❌ Avoid: Should be passed explicitly
@Subscriber(source: environment) var articleId: string  // Pass this as property instead
```

**Keep state close to where it's used**

```weft
// ✅ Good: State owned by the view that uses it
view TodoItem {
    var todo: Todo
    @LocalState var isEditing: bool = false

    if isEditing {
        TextField(text: $todo.title)
    } else {
        Text(todo.title)
    }
}

// ❌ Avoid: State too high in hierarchy
view TodoListView {
    @LocalState var itemEditingStates: [string: bool] = [:]  // Complex to manage
}
```

**Don't use @LocalState outside of views**

```weft
// ❌ Invalid
@Role(viewmodel)
class MyViewModel {
    @LocalState var count: int = 0  // ERROR: @LocalState only allowed in views
}

// ✅ Valid: Use regular properties in ViewModels
@Role(viewmodel)
@Publisher
class MyViewModel {
    var count: int = 0  // Observable if public in @Publisher class
}
```

## Common Patterns

### Form State Management

```weft
view RegistrationForm {
    @LocalState var email: string = ""
    @LocalState var password: string = ""
    @LocalState var agreeToTerms: bool = false
    @LocalState var isSubmitting: bool = false

    Column {
        TextField(text: $email, placeholder: "Email")
        TextField(text: $password, placeholder: "Password")
        Checkbox(isChecked: $agreeToTerms, label: "I agree to terms")

        Button(action: submitForm) {
            text: isSubmitting ? "Submitting..." : "Register"
            isDisabled: isSubmitting
        }
    }

    func submitForm() async {
        @SumFunc
        => validate form fields
        => set submitting state to true
        => submit to API
        => handle response or errors
        => set submitting state to false
    }
}
```

### Master-Detail Navigation

```weft
view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel
    @LocalState var selectedArticleId: string? = null

    Row {
        // Master list
        Column {
            for article in viewModel.articles {
                ArticleRow(
                    article: article,
                    isSelected: article.id == selectedArticleId,
                    onTap: { selectedArticleId = article.id }
                )
            }
        }

        // Detail view
        if let articleId = selectedArticleId {
            ArticleDetailView(articleId: articleId)
        }
    }
}
```

### Shared State Across Tabs

```weft
view AppTabView {
    @LocalState var shoppingCart = ShoppingCart()
    @LocalState var selectedTab: Tab = Tab.HOME

    TabView(selected: $selectedTab) {
        HomeView(cart: shoppingCart)
        ShopView(cart: shoppingCart)
        CartView(cart: shoppingCart)
    }
}
```

### Conditional UI State

```weft
view FilterableListView {
    @Subscriber var viewModel: ListViewModel
    @Subscriber(source: environment) var theme: Theme
    @LocalState var showFilters: bool = false
    @LocalState var showSortOptions: bool = false

    Column {
        Row {
            Button(action: { showFilters.toggle() }) {
                text: "Filters"
                style: theme.buttonStyle
            }
            Button(action: { showSortOptions.toggle() }) {
                text: "Sort"
                style: theme.buttonStyle
            }
        }

        if showFilters {
            FilterPanel(filters: $viewModel.activeFilters)
        }

        if showSortOptions {
            SortPanel(sortBy: $viewModel.sortOrder)
        }

        ContentList(items: viewModel.filteredItems)
    }
}
```

## Validation Configuration

The Weft LSP can validate state annotation usage:

```json
// weft.settings.json
{
  "validation": {
    "stateAnnotations": "warning",     // Warn on missing @Subscriber
    "localStateScope": "error",        // Error on @LocalState outside views
    "bindingUsage": "warning"          // Warn on binding issues
  }
}
```

## See Also

- [Lifecycle & Scope](02-lifecycle-scope.md) - Object lifetimes and scoping
- [Observability](03-observability.md) - @Publisher and reactive state
- [Views](../ui/01-views.md) - View basics and composition
- [ViewModels](07-viewmodels.md) - ViewModel pattern
- [Annotations Reference](../reference/annotations.md) - Complete annotation guide