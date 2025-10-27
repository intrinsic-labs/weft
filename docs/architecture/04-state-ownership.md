# State Ownership

State ownership defines who creates, manages, and has the authority to modify state in your application. Weft provides explicit annotations to communicate state ownership patterns that translate cleanly to all UI frameworks.

## Core Concepts

**State ownership** answers three questions:
1. Who creates this state?
2. Who can modify this state?
3. How does this state flow through the app?

Weft's state annotations make these relationships explicit, helping you reason about data flow and preventing common bugs.

## State Annotations

### @State

Local state owned and managed by the current scope (typically a view or ViewModel).

```weft
view CounterView {
    @State var count: int = 0
    @State var isExpanded: bool = false
    
    Button(action: { count += 1 }) {
        text: "Count: \(count)"
    }
}
```

**Use @State when:**
- The view/component creates and owns the state
- State is local to this view
- No parent needs to modify it
- State resets when view is recreated

### @Binding

Two-way connection to state owned by a parent. Allows reading and writing parent's state.

```weft
view ParentView {
    @State var searchText: string = ""
    
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

### @Environment

Access to app-wide or feature-wide shared state from context.

```weft
view ArticleView {
    @Environment var theme: Theme
    @Environment var authService: AuthService
    
    Column {
        Text(article.title) {
            textColor: theme.primaryColor
        }
    }
}
```

**Use @Environment when:**
- State is shared across many views
- You don't want to pass state through every intermediate view
- Working with app-wide concerns (theme, auth, navigation, etc.)

### @Observable

Marks classes that have observable state (covered in detail in [Observability](03-observability.md)).

```weft
@Observable
class ArticleRepository {
    private(set) var articles: [Article] = []
}

view ArticleListView {
    var repository: ArticleRepository  // Automatically observed
}
```

## State Flow Patterns

### Parent → Child (One-Way)

Pass values down for read-only access:

```weft
view ParentView {
    @State var userName: string = "Alice"
    
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
    @State var isDarkMode: bool = false
    
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

### Shared Observable State

Multiple views observe the same repository/service:

```weft
@Observable
@Singleton
class UserRepository {
    private(set) var currentUser: User? = null
}

view ProfileView {
    var userRepository: UserRepository
    
    Text(userRepository.currentUser?.name ?? "Guest")
}

view NavBarView {
    var userRepository: UserRepository
    
    if userRepository.currentUser != null {
        UserAvatar(user: userRepository.currentUser)
    }
}
```

## Environment Injection

Provide environment values at the root of your view hierarchy:

```weft
@Main
class MyApp: App {
    @State var theme = Theme()
    @State var authService = AuthService()
    
    var content: View {
        MainView() {
            environment: [theme, authService]
        }
    }
}
```

Child views automatically have access via @Environment:

```weft
view SettingsView {
    @Environment var theme: Theme
    
    ColorPicker(
        selectedColor: $theme.primaryColor
    )
}
```

## Complete Example

```weft
// Repository layer (observable state)
@Observable
@Repository
@Singleton
class ArticleRepository {
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

// ViewModel layer (coordinates state)
@Observable
@ViewModel
@ViewScoped
class ArticleListViewModel {
    private var repository: ArticleRepository
    
    @State var searchQuery: string = ""
    @State var selectedFilter: Filter = Filter.ALL
    
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

// View layer (renders state)
view ArticleListView {
    var viewModel: ArticleListViewModel
    @Environment var theme: Theme
    
    @State var showFilters: bool = false
    
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
    @StateObject var viewModel: ArticleListViewModel
    
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

**Prefer local @State for UI-only state**

```weft
view ArticleCard {
    var article: Article
    @State var isExpanded: bool = false  // UI state only
    
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

**Use @Binding for reusable components**

```weft
view TextField {
    @Binding var text: string
    var placeholder: string
    
    // Reusable text input that modifies parent state
}

view Form {
    @State var email: string = ""
    @State var password: string = ""
    
    TextField(text: $email, placeholder: "Email")
    TextField(text: $password, placeholder: "Password")
}
```

**Use @Environment sparingly**

```weft
// Good: Truly app-wide concerns
@Environment var theme: Theme
@Environment var authService: AuthService
@Environment var navigation: NavigationController

// Avoid: Should be passed explicitly
@Environment var articleId: string  // Pass this as property instead
```

**Keep state close to where it's used**

```weft
// Good: State owned by the view that uses it
view TodoItem {
    var todo: Todo
    @State var isEditing: bool = false
    
    if isEditing {
        TextField(text: $todo.title)
    } else {
        Text(todo.title)
    }
}

// Avoid: State too high in hierarchy
view TodoListView {
    @State var itemEditingStates: [string: bool] = [:]  // Complex to manage
}
```

## Common Patterns

### Form State Management

```weft
view RegistrationForm {
    @State var email: string = ""
    @State var password: string = ""
    @State var agreeToTerms: bool = false
    @State var isSubmitting: bool = false
    
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
    @State var selectedArticleId: string? = null
    var articles: [Article]
    
    Row {
        // Master list
        Column {
            for article in articles {
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
    @State var shoppingCart = ShoppingCart()
    @State var selectedTab: Tab = Tab.HOME
    
    TabView(selected: $selectedTab) {
        HomeView(cart: shoppingCart)
        ShopView(cart: shoppingCart)
        CartView(cart: shoppingCart)
    }
}
```

## See Also

- [Lifecycle & Scope](02-lifecycle-scope.md) - Object lifetimes and scoping
- [Observability](03-observability.md) - @Observable pattern
- [Views](../ui/01-views.md) - View basics and composition
- [ViewModels](05-patterns-in-practice.md) - ViewModel pattern