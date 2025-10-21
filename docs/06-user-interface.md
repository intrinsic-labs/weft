# User Interface

Weft provides first-class support for building user interfaces with the `view` keyword and state management annotations. Views are declarative UI components that translate to SwiftUI, Jetpack Compose, React, or other UI frameworks.

## The `view` Keyword

Use `view` to define UI components:

```weft
view ArticleListView {
    // View properties and body go here
}
```

The `view` keyword signals to the translator that this should become:
- **SwiftUI**: `struct ArticleListView: View`
- **Jetpack Compose**: `@Composable fun ArticleListView()`
- **React**: `function ArticleListView()`

## State Management

Weft uses annotations to express state management intent across different UI frameworks. Each annotation maps to the appropriate platform-specific mechanism.

### State Annotations

```weft
@State          // local mutable state owned by this view
@Binding        // two-way binding to parent state
@Observed       // observing external state object/store
@Environment    // injected from environment/context
```

### How They Work

```weft
view CounterView {
    @State var count: int = 0                    // local state
    @Binding var parentCount: int                // bound to parent
    @Observed var viewModel: CounterViewModel    // external state
    @Environment var theme: Theme                // environment injection

    // Computed properties (no annotation needed)
    var doubled: int {
        return count * 2
    }

    var isEven: bool {
        return count % 2 == 0
    }
}
```

### Translation Examples

**SwiftUI:**
```swift
struct CounterView: View {
    @State private var count: Int = 0
    @Binding var parentCount: Int
    @StateObject var viewModel: CounterViewModel
    @Environment(\.theme) var theme

    var doubled: Int { count * 2 }
    var isEven: Bool { count % 2 == 0 }
}
```

**Jetpack Compose:**
```kotlin
@Composable
fun CounterView(
    parentCount: MutableState<Int>,
    viewModel: CounterViewModel = viewModel(),
    theme: Theme = LocalTheme.current
) {
    var count by remember { mutableStateOf(0) }
    val doubled = count * 2
    val isEven = count % 2 == 0
}
```

**React:**
```typescript
function CounterView({ parentCount, setParentCount }) {
    const [count, setCount] = useState(0);
    const viewModel = useContext(ViewModelContext);
    const theme = useContext(ThemeContext);

    const doubled = useMemo(() => count * 2, [count]);
    const isEven = useMemo(() => count % 2 === 0, [count]);
}
```

## Lifecycle Hooks

Use lifecycle hooks for side effects and reactions to view lifecycle events:

```weft
view ArticleListView {
    @State var articles: [Article] = []
    @Observed var articleService: ArticleService

    onAppear {
        @SumFunc
        => fetch articles when view first appears
        articles = await articleService.fetchArticles()
    }

    onDisappear {
        @SumFunc
        => cleanup when view is removed
        articleService.cancelRequests()
    }

    onChange(searchText) {
        @SumFunc
        => refetch when search text changes
        articles = await articleService.search(searchText)
    }
}
```

**Lifecycle hooks map to:**
- **SwiftUI**: `.onAppear`, `.onDisappear`, `.onChange`
- **Jetpack Compose**: `LaunchedEffect`, `DisposableEffect`
- **React**: `useEffect` with appropriate dependencies

## Complete Example

```weft
view ArticleDetailView {
    @Binding var article: Article
    @State var isBookmarked: bool = false
    @Environment var bookmarkService: BookmarkService

    var formattedDate: string {
        return article.publishedDate.format("MMM d, yyyy")
    }

    onAppear {
        @SumFunc
        => check if article is bookmarked when view appears
        isBookmarked = await bookmarkService.isBookmarked(article.id)
    }

    func toggleBookmark() {
        @SumFunc
        => toggle bookmark status
        if isBookmarked {
            await bookmarkService.remove(article.id)
        } else {
            await bookmarkService.add(article)
        }
        isBookmarked = !isBookmarked
    }

    // View body would be defined here using declarative syntax
}
```

## Parent-Child State Flow

```weft
view ParentView {
    @State var selectedArticle: Article?
    @State var articles: [Article] = []

    // Pass state down to child
    view ArticleList(
        articles: articles,
        selectedArticle: $selectedArticle    // $ prefix for binding
    )
}

view ArticleList {
    var articles: [Article]                  // read-only prop
    @Binding var selectedArticle: Article?   // two-way binding

    func selectArticle(article: Article) {
        selectedArticle = article            // updates parent's state
    }
}
```

The `$` prefix signals that you're passing a binding (two-way connection) rather than just a value.

## Summary

Weft's state management system abstracts platform-specific implementations into clear, semantic annotations:

- **`@State`** - Local view state
- **`@Binding`** - Two-way parent-child communication
- **`@Observed`** - External state objects
- **`@Environment`** - Context injection

Combined with lifecycle hooks (`onAppear`, `onDisappear`, `onChange`), this provides everything needed to build reactive, stateful user interfaces that translate cleanly to any target platform.


## UI Building Blocks

Weft provides a flexible set of UI components for building user interfaces that translate cleanly to native implementations. The system prioritizes **expressivity and clear intent** over rigid APIs — if a parameter name clearly expresses what you want to achieve, use it.

### Available Components

#### Layout Containers

```weft
Column        // vertical stack with optional scrolling, spacing, padding
Row           // horizontal stack with spacing and alignment options
ZStack        // layered views (z-axis stacking for overlapping elements)
ScrollView    // scrollable container (or use isScrollable: true on Column/Row)
Spacer        // flexible space filler between elements
```

#### Basic Components

```weft
Text          // labels, headings, body text
Image         // static images with scaling, effects, transformations
AsyncImage    // remote images with loading states
Button        // tappable elements with actions
TextField     // text input with bindings
Divider       // visual separator line
```

#### Interactive Elements

```weft
Link          // navigation links
GestureArea   // custom gesture handling (swipe, long press, etc.)
```

### Parameter Philosophy

**Weft's UI framework is intentionally loose** — parameters should be self-documenting and express clear intent. If it's obvious what `cornerRadius: 20` or `maxLines: 3` should do, use it. The translator will map it to the appropriate platform-specific API (SwiftUI modifier, Compose parameter, React prop, etc.).

This approach means:
- ✅ **Clear intent**: `isScrollable: true` is more intuitive than memorizing ScrollView vs List vs LazyColumn
- ✅ **Self-documenting**: Code reads like natural language
- ✅ **Flexible**: Invent parameters as needed, as long as the meaning is obvious
- ✅ **Platform-agnostic**: Same code works across SwiftUI, Compose, React

**If you're unsure whether a parameter will work, ask yourself:** *"Would another developer immediately understand what this is supposed to do?"* If yes, use it.

### Common Parameter Categories

Parameters are specified inside parentheses or a trailing closure/lambda using `key: value` syntax, similar to function arguments:

**Layout & Positioning**
```weft
width: full | 200 | auto
height: 200 | auto
padding: 16              // all sides
verticalPadding: 16      // top and bottom
horizontalPadding: 16    // left and right
topPadding: 8
bottomPadding: 8
leftPadding: 8
rightPadding: 8
margin: 16
spacing: 12              // space between child elements
alignment: left | right | center | top | bottom
```

**Styling & Appearance**
```weft
cornerRadius: 12
backgroundColor: color
borderWidth: 2
borderColor: color
opacity: 0.8
shadow: small | medium | large
shadowRadius: 8
shadowColor: color
```

**Typography** (for Text components)
```weft
font: h1 | h2 | h3 | body | caption | custom
fontSize: 16
fontWeight: bold | normal | light
textColor: color
alignment: left | right | center
lineSpacing: 1.5
maxLines: 3
ellipsize: end | middle | start
```

**Images**
```weft
scaleType: centerCrop | fit | fill
contentMode: aspectFit | aspectFill
blurRadius: 60
saturation: 150
brightness: 1.2
contrast: 1.1
```

**Interaction**
```weft
onTap: action()
onDoubleTap: action()
onTap(count: int): action()
onLongPress: action()
onSwipe: action()
onRefresh: action()
isDisabled: true | false
isHidden: true | false
```

**Scrolling** (for Column/Row/ScrollView)
```weft
isScrollable: true | false
scrollIndicator: visible | hidden
bounces: true | false
onRefresh: refreshAction()
```

### Basic Examples

#### Simple Card Layout

```weft
Column(
    cornerRadius: 12
    padding: 16
    shadow: medium
    backgroundColor: white
) {
    Text("Card Title") {
        font: h2
        alignment: left
    }

    Text("Card description goes here") {
        font: body
        alignment: left
        textColor: gray
    }
}
```

#### Horizontal Row with Spacing

```weft
Row(
    spacing: 16
    alignment: center
    horizontalPadding: 20
) {
    Image(iconImage) {
        width: 40
        height: 40
    }

    Text("Item Title") {
        font: body
    }

    Spacer()

    Text("$19.99") {
        font: h3
        fontWeight: bold
        // invent parameters as needed for clarity:
        format: currency
    }
}
```

#### Image with Effects

```weft
Image(article.coverImage) {
    width: full
    height: 200
    scaleType: centerCrop
    cornerRadius: 12
    saturation: 120
}
```

### Advanced Patterns

#### Tappable Card with Navigation

```weft
Column(
    onTap: navigateTo(ArticleDetailView(article: article))
    cornerRadius: 20
    shadow: medium
    padding: 16
) {
    Image(article.coverImage) {
        width: full
        height: 200
        scaleType: centerCrop
    }

    Text(article.title) {
        font: h2
        alignment: left
        topPadding: 12
    }

    Text(article.excerpt) {
        font: body
        alignment: left
        maxLines: 3
        ellipsize: end
        textColor: gray
        topPadding: 8
    }
}
```

#### Scrollable List with Pull-to-Refresh

```weft
Column(
    isScrollable: true
    scrollIndicator: hidden
    spacing: 12
    padding: 16
    onRefresh: refresh()
) {
    for article in articles {
        ArticleCard(article: article)
    }
}
```

#### Layered Views with ZStack

ZStack allows you to layer multiple views on top of each other (z-axis stacking). Views are rendered in order, with later views appearing on top:

```weft
ZStack {
    // Background layer - blurred backdrop
    Image(video.thumbnail) {
        width: full
        height: 300
        blurRadius: 60
        saturation: 150
    }

    // Foreground layer - sharp image
    Image(video.thumbnail) {
        width: 250
        height: 250
        cornerRadius: 12
        shadow: large
    }

    // Top layer - play button overlay
    Image(playIcon) {
        width: 60
        height: 60
    }
}
```

#### Conditional Rendering

Use standard Weft control flow within view bodies:

```weft
view ArticleListView {
    @State var articles: [Article] = []
    @State var isLoading: bool = true

    Column(spacing: 16) {
        if isLoading {
            LoadingSpinner()
        } else if articles.isEmpty {
            EmptyStateView(
                message: "No articles found"
                icon: emptyIcon
            )
        } else {
            for article in articles {
                ArticleCard(article: article)
            }
        }
    }
}
```

#### Text with Truncation

```weft
Text(longDescription) {
    font: body
    alignment: left
    maxLines: 3
    ellipsize: end
    lineSpacing: 1.4
}
```

### Navigation

Use `navigateTo()` for navigation between views:

```weft
Column(
    onTap: navigateTo(DetailView(item: item))
) {
    // card content
}

// Other navigation patterns
Button(action: navigateTo(SettingsView())) {
    text: "Go to Settings"
}

// Navigate back
Button(action: popView()) {
    text: "Back"
}

// Present modal
Button(action: presentModal(ShareView(content: content))) {
    text: "Share"
}
```

### Lists and Iteration

For lists, simply render views inside a loop within a scrollable container:

```weft
Column(
    isScrollable: true
    spacing: 8
) {
    for item in items {
        ItemView(item: item)
    }
}

// With index
for (index, item) in items.enumerated() {
    Row {
        Text("\(index + 1).")
        ItemView(item: item)
    }
}

// Filtered
for article in articles where article.isPublished {
    ArticleCard(article: article)
}
```

### Custom Components

Create reusable components by defining custom views:

```weft
view ArticleCard {
    var article: Article

    Column(
        onTap: navigateTo(ArticleDetailView(article: article))
        cornerRadius: 20
        padding: 16
        shadow: medium
    ) {
        Image(article.coverImage) {
            width: full
            height: 200
            scaleType: centerCrop
            bottomPadding: 8
        }

        Column(
            verticalPadding: 16
            spacing: 8
        ) {
            Text(article.title) {
                font: h2
                alignment: left
            }

            Text(article.excerpt) {
                font: body
                alignment: left
                maxLines: 3
                ellipsize: end
            }
        }
    }
}

// Use it
view ArticleListView {
    @State var articles: [Article] = []

    Column(isScrollable: true) {
        for article in articles {
            ArticleCard(article: article)
        }
    }
}
```

### Working with @Instruction

For complex UI effects or ambiguous requirements, use the `@Instruction` annotation to provide guidance:

```weft
ZStack {
    @Instruction('''
    Create a layered effect where the bottom image
    is heavily blurred to create a nice backdrop
    for the sharp top image. The blur should spill
    beyond the edges of the top image.
    ''')

    Image(photo) {
        blurRadius: 60
        saturation: 150
    }

    Image(photo) {
        width: 300
        height: 300
        cornerRadius: 20
    }
}
```

### Summary

Weft's UI building blocks are designed for **maximum expressivity with clear intent**:

- Use standard components (Column, Row, ZStack, Text, Image, etc.)
- Express styling through intuitive parameters (`cornerRadius: 12`, `spacing: 16`)
- Nest components naturally to build complex layouts
- Use loops and conditionals for dynamic content
- Invent parameters as needed — if the intent is clear, it will translate correctly
- Leverage `@Instruction` for complex or ambiguous UI requirements

The goal is to write UI code that reads like a design specification while remaining structured enough to generate native implementations across all target platforms.
