# Navigation

Navigation in Weft is high-level and platform-agnostic. Express intent clearly—the translator handles platform specifics.

## Core Principles

**Intent over implementation**: Describe what should happen, not how.

**Flexible syntax**: Functions, handlers, or declarative patterns all work.

**Platform translation**: Same code becomes NavigationStack, NavController, or React Router.

## Stack Navigation

```weft
// Push forward
Button(action: { navigateTo(DetailView(id: itemId)) }) {
    text: "View Details"
}

Column(onTap: navigateTo(ProfileView(user: user))) {
    Text(user.name)
}

// Pop back
Button(action: popView) {
    text: "Back"
}

Button(action: popToRoot) {
    text: "Home"
}
```

### Passing Data

```weft
// Navigate with parameters
Button(action: { navigateTo(ArticleDetailView(articleId: article.id)) }) {
    text: "Read More"
}

view ArticleDetailView {
    var articleId: string

    onAppear {
        await viewModel.loadArticle(articleId)
    }
}
```

### Returning Data

```weft
view SelectionView {
    var onSelect: (Item) -> void

    Button(action: {
        onSelect(item)
        popView()
    }) {
        text: item.name
    }
}

// Caller
@LocalState var selectedItem: Item? = null

Button(action: {
    navigateTo(SelectionView(onSelect: { item in
        selectedItem = item
    }))
}) {
    text: selectedItem?.name ?? "Choose"
}
```

## Modal Presentation

```weft
// Modal with state
@LocalState var showingModal = false

Button(action: { showingModal = true }) {
    text: "Settings"
}

Modal(isPresented: $showingModal) {
    SettingsView(onDismiss: { showingModal = false })
}

// Bottom sheet
Sheet(isPresented: $showingSheet) {
    FilterView(onApply: { filters in
        applyFilters(filters)
        showingSheet = false
    })
}

// Full screen
FullScreenCover(isPresented: $showingFullScreen) {
    OnboardingFlow(onComplete: { showingFullScreen = false })
}

// Dismiss
Button(action: dismissModal) {
    text: "Close"
}
```

## Tab Navigation

```weft
view MainTabView {
    TabView {
        Tab(title: "Home", icon: Icons.home) {
            HomeView()
        }

        Tab(title: "Browse", icon: Icons.search) {
            BrowseView()
        }

        Tab(title: "Profile", icon: Icons.person) {
            ProfileView()
        }
    }
}

// With selection binding
@LocalState var selectedTab = 0

TabView(selection: $selectedTab) {
    Tab(title: "Feed", icon: Icons.home, tag: 0) {
        FeedView()
    }
    Tab(title: "Messages", icon: Icons.message, tag: 1) {
        MessagesView()
    }
}
```

## Deep Linking

```weft
view AppRoot {
    @Subscriber(source: environment) var router: Router

    onAppear {
        router.registerRoutes([
            Route(path: "/article/:id", handler: handleArticle),
            Route(path: "/user/:username", handler: handleUser)
        ])
    }

    func handleArticle(params: RouteParams) {
        if let id = params["id"] {
            navigateTo(ArticleDetailView(articleId: id))
        }
    }
}
```

## Navigation in ViewModels

```weft
@Publisher
@Role(viewmodel)
@Lifecycle(view)
class ArticleListViewModel {
    private var navigation: NavigationService

    func selectArticle(id: string) {
        @SumFunc
        => track selection in analytics
        => navigate to article detail with id
    }

    func showFilters() {
        @SumFunc
        => present filter modal
    }
}

// Usage
Button(action: { viewModel.selectArticle(id) }) {
    text: "Read More"
}
```

## Platform-Specific Behavior

```weft
@Instruction('''
On iOS, use native sheet with medium detent.
On Android, use bottom sheet with peek height.
On web, use centered modal dialog.
''')
Sheet(isPresented: $showingOptions) {
    OptionsView()
}
```

## Practical Patterns

### Multi-Step Flow

```weft
view RegistrationFlow {
    @LocalState var step = 1
    @LocalState var formData = RegistrationData()

    if step == 1 {
        EmailStep(email: $formData.email, onNext: { step = 2 })
    } else if step == 2 {
        PasswordStep(
            password: $formData.password,
            onNext: { step = 3 },
            onBack: { step = 1 }
        )
    } else {
        ProfileStep(
            profile: $formData.profile,
            onComplete: submitRegistration,
            onBack: { step = 2 }
        )
    }
}
```

### Conditional Root

```weft
view AppRoot {
    @Subscriber(source: environment) var auth: AuthService
    @LocalState var isLoading = true

    if isLoading {
        LoadingView()
    } else if auth.isAuthenticated {
        MainTabView()
    } else {
        LoginView()
    }

    onAppear {
        await auth.checkSession()
        isLoading = false
    }
}
```

## Best Practices

**Use descriptive view names**: Make intent obvious.

```weft
// Clear
navigateTo(ArticleDetailView(articleId: id))

// Vague
navigateTo(DetailView(id))
```

**Handle navigation in ViewModels**: Keep business logic together.

**Pass data explicitly**: Make dependencies clear.

```weft
view DetailView {
    var itemId: string
    var viewModel: DetailViewModel
}
```

**Track modal state**: Use `@LocalState` for presentation.

```weft
@LocalState var showingModal = false
Modal(isPresented: $showingModal) { /* ... */ }
```

**Prefer flat hierarchies**: Use tabs for parallel flows instead of deep nesting.

## See Also

- [Views](01-views.md) - View structure and lifecycle
- [Components](02-components.md) - UI components
