# Views

Views are declarative UI components defined with the `view` keyword. They translate to SwiftUI views, Jetpack Compose composables, or React components.

> **Note:** Weft UI is intentionally flexible. You can use any syntax style and invent parameters as needed. See [UI Overview](00-overview.md) for principles.

## Basic View

```weft
view ArticleCard {
    var article: Article

    Column(spacing: 8, padding: 16) {
        Text(article.title)
        Text(article.excerpt)
    }
}
```

Parameters can go in parentheses, trailing closure, or both—whatever reads best:

```weft
// Parentheses
Column(spacing: 8, padding: 16)

// Trailing closure
Column {
    spacing: 8
    padding: 16
}

// Mixed
Column(spacing: 8) {
    padding: 16
    backgroundColor: white
}
```

**Translates to:**
- **SwiftUI**: `struct ArticleCard: View`
- **Jetpack Compose**: `@Composable fun ArticleCard()`
- **React**: `function ArticleCard()`

## View Properties

Views accept properties for data and configuration:

```weft
// Swift-style
view UserProfile {
    var user: User
    var showBio: bool = true
    var onEdit: () => void

    Column {
        Text(user.name)
        if showBio { Text(user.bio) }
        Button(action: onEdit) { text: "Edit" }
    }
}

// Kotlin-style
view UserProfile {
    var user: User
    var showBio: bool = true
    var onEdit: () -> Unit

    Column(spacing = 8) {
        Text(text = user.name)
        if (showBio) Text(text = user.bio)
        Button(onClick = onEdit, text = "Edit")
    }
}

// React-style
view UserProfile {
    var user: User
    var showBio: bool = true
    var onEdit: () => void

    Column({ spacing: 8 }) {
        Text({ text: user.name })
        {showBio && Text({ text: user.bio })}
        Button({ onClick: onEdit, text: "Edit" })
    }
}
```

## State Management

### @State - Local State

Use `@State` for local mutable state owned by the view:

```weft
view ExpandableCard {
    var content: string
    @State var isExpanded = false  // Type inferred

    Column(onTap: { isExpanded = !isExpanded }) {
        Text(content) {
            maxLines: isExpanded ? null : 3
            ellipsize: end
        }
    }
}
```

### @Binding - Two-Way State

Use `@Binding` when a child needs to modify parent state. Pass bindings with the `$` prefix:

```weft
view ParentView {
    @State var searchText: string = ""

    SearchBar(text: $searchText)  // $ passes binding
}

view SearchBar {
    @Binding var text: string     // Two-way connection

    TextField(binding: $text)
}
```

### ViewModels and Repositories

Views can depend on ViewModels and Repositories. Changes to observable properties trigger automatic re-renders:

```weft
view ArticleListView {
    var viewModel: ArticleListViewModel

    Column(isScrollable: true, spacing: 12) {
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

### @Environment - Shared Context

Access app-wide state without passing through every view:

```weft
view ThemedButton {
    @Environment var theme: Theme
    var label: string
    var onTap: () => void

    Button(action: onTap) {
        text: label
        backgroundColor: theme.primaryColor
        textColor: white
        cornerRadius: 8
    }
}
```

## Computed Properties

Define computed values derived from state:

```weft
view ShoppingCart {
    var items: [Item]

    var total: float {
        return items.reduce(0, (sum, item) => sum + item.price)
    }

    var isEmpty: bool {
        return items.count == 0
    }

    Text("Total: $\(total)")
}
```

## Lifecycle Hooks

### onAppear

Runs when the view appears on screen:

```weft
view ArticleView {
    var articleId: string
    var viewModel: ArticleViewModel

    Column {
        if let article = viewModel.article {
            Text(article.title)
        }
    }

    onAppear {
        await viewModel.loadArticle(articleId)
    }
}
```

### onDisappear

Runs when the view is removed:

```weft
view VideoPlayerView {
    var player: VideoPlayer

    onDisappear {
        player.pause()
        player.cleanup()
    }
}
```

### onChange

Runs when a specific value changes:

```weft
view SearchView {
    @State var query: string = ""
    var viewModel: SearchViewModel

    TextField(binding: $query)

    onChange(query) {
        await viewModel.search(query)
    }
}
```

## Control Flow

Use standard Weft control flow in view bodies:

```weft
view ArticleListView {
    var articles: [Article]
    var isLoading: bool

    Column {
        if isLoading {
            LoadingSpinner()
        } else if articles.isEmpty {
            EmptyState(message: "No articles")
        } else {
            for article in articles {
                ArticleCard(article: article)
            }
        }
    }
}
```

## Methods

Views can define methods for actions and logic:

```weft
view TodoItem {
    var todo: Todo
    var onToggle: (string) => void
    @State var isEditing = false

    func save() async {
        @SumFunc
        => validate todo fields
        => save changes to backend
        => exit edit mode

        isEditing = false
    }

    Row(spacing: 12, padding: 8) {
        if isEditing {
            TextField(binding: $todo.title) {
                placeholder: "Task name"
            }
            Button(action: save) { text: "Save" }
        } else {
            Checkbox(isChecked: todo.completed, onToggle: { onToggle(todo.id) })
            Text(todo.title)
            Button(action: { isEditing = true }) { text: "Edit" }
        }
    }
}
```

## Reusable Components

Create reusable views with clear interfaces:

```weft
view Badge {
    var text: string
    var color: Color = Color.blue

    Text(text) {
        padding: 8
        backgroundColor: color
        textColor: white
        cornerRadius: 12
        fontSize: 12
        fontWeight: bold
    }
}

// Usage - multiple styles work
view UserCard {
    var user: User

    // Swift-style
    Row(spacing: 12) {
        Text(user.name) { font: h3 }
        Badge(text: user.role, color: theme.accent)
    }

    // Kotlin-style alternative
    Row(spacing = 12) {
        Text(text = user.name, style = TextStyle.h3)
        Badge(text = user.role, color = theme.accent)
    }
}
```

## Complete Example

```weft
view ArticleDetailView {
    var articleId: string
    var viewModel: ArticleDetailViewModel
    @Environment var theme: Theme
    @State var showShareSheet = false

    var isBookmarked: bool {
        viewModel.bookmarkedArticleIds.contains(articleId)
    }

    Column(isScrollable: true) {
        if viewModel.isLoading {
            LoadingSpinner()
        } else if let article = viewModel.article {
            // Image with styling in trailing closure
            Image(article.coverImage) {
                width: full
                height: 250
                scaleType: centerCrop
                cornerRadius: 0
            }

            Column(padding: 16) {
                Text(article.title) {
                    font: h1
                    marginBottom: 8
                }

                Text(article.publishedDate.format("MMM d, yyyy")) {
                    font: caption
                    textColor: theme.secondaryText
                }

                Divider { margin: 16 }

                Text(article.content) {
                    font: body
                    lineSpacing: 1.6
                }

                // Mixed syntax styles for variety
                Row(spacing: 16) {
                    Button(onClick: toggleBookmark) {
                        text: isBookmarked ? "Bookmarked" : "Bookmark"
                        icon: isBookmarked ? Icons.bookmarkFilled : Icons.bookmark
                        style: isBookmarked ? filled : outlined
                    }

                    Button(action: { showShareSheet = true }) {
                        text: "Share"
                        icon: Icons.share
                    }
                }
            }
        }
    }

    onAppear {
        await viewModel.loadArticle(articleId)
    }

    func toggleBookmark() async {
        if isBookmarked {
            await viewModel.removeBookmark(articleId)
        } else {
            await viewModel.addBookmark(articleId)
        }
    }
}
```

## Best Practices

**Keep views focused**: Each view should have a single responsibility.

**Use ViewModels for logic**: Views render state; ViewModels contain business logic.

**Prefer @State for UI-only state**: Local toggles, selections, animations.

**Use @Binding for reusable components**: Forms, inputs, controls that modify parent state.

**Keep computed properties simple**: Complex calculations belong in ViewModels.

**Write in your preferred style**: Swift, Kotlin, TypeScript syntax all work.

**Leverage @Instruction for clarity**: Use when intent might be ambiguous.

```weft
view ComplexAnimation {
    @Instruction('''
    Animate with a spring effect when tapped -
    card should bounce slightly and scale up 5%
    ''')

    @State var isBouncing = false

    Column(onTap: { isBouncing = true }) {
        // content
    }
}
```

## See Also

- [Components](02-components.md) - Built-in UI components
- [Layout](03-layout.md) - Layout containers and patterns
- [State Ownership](../architecture/04-state-ownership.md) - State management patterns
- [ViewModels](../architecture/07-viewmodels.md) - ViewModel pattern
