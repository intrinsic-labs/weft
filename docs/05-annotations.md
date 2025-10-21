# Annotations

Weft makes heavy use of annotations to capture intent, context, and metadata about code entities. Annotations are prefixed with `@` and can be applied to types, properties, functions, and more.

## Core Annotations

### @Main
Marks the main entry point of the application. There should be only one `@Main` annotation in the entire codebase.

```weft
@Main
func main() {
    // application entry point
}
```

### @Instruction

Specific arbitrary instructions to human or LLM translators to reduce ambiguity during target implementation. Pass in a single/multiline string, like so:

```weft
@Instruction('''
API return clarification -
The API call will return both a featured_image and
a featured_image_full value; please map the plain
featured_image during target implementation and
ignore the full size
''')
```

Use `@Instruction` when you need to provide context or clarification that isn't obvious from the code structure itself.

### @SumFunc

Summarize desired functionality with N lines of following statements beginning with `=>`. This annotation helps communicate the logical flow of a function without getting bogged down in implementation details:

```weft
func fetchPosts() => [Post] {
  @SumFunc
  => use the self.filter property to call the posts api endpoint
  => organize results into a function scoped variable
  => return the variable as an array of type Post
}
```

### @Index

Create an `index.weft` file in a directory and put `@Index('directory_name')` at the top. This file will be referenced for general context and insights about the directory contents. Write content in markdown or plain text and use XML tags as desired.

```weft
@Index('models')

This directory contains all data models for the application,
organized into subdirectories for DTOs and database schemas.
```

### @JSON

Marks a type or property as being serialized to/from JSON. This is useful for API models and data transfer objects.

```weft
@JSON
type Article {
    var id: string
    var title: string
    var content: string
}
```

## Database Annotations

Weft supports the following annotations for marking database schema definitions: `@Schema`, `@Entity`, `@DatabaseModel`. They all accomplish the same task: tell the system that this object is a schema definition for your database.

> By default, all properties on any database schema are treated as fields to be stored in the table.

### Schema Definition

```weft
@Schema
struct User {
    @Id(generated)
    var id: string
    var username: string
    var email: string
}
```

### Available Database Annotations

**`@Id`**: Marks a field as the primary key. Use `@Id(generated)` to indicate the ID should be auto-generated. Note: a property simply named `id` will be automatically assigned as the primary key.

**`@Field`**: Marks a property to be stored as a column in the database schema. By default, all properties on any object marked as a schema will be treated as a field. You can add the annotation for clarity if desired.

**`@Transient`, `@Exclude`, `@Ignore`, `@NotField`**: Marks a field to be ignored by the database.

**`@ForeignKey('table_name')`, `@Reference('table_name')`, `@Relation('table_name')`**: Marks a field as a foreign key referencing another table.

**`@Index`**: Marks a field to be indexed for faster queries.

**`@Nullable`, `@Optional`**: Marks a field as allowing null values. Alternatively, you can do this in the variable declaration by using a question mark on the type, like `var someField: string?`.

**`@Required`**: Marks a field as required.

**`@Unique`**: Marks a field as unique across all records.

### Complete Database Example

```weft
@Schema
struct AuditLog {
    @Id(generated)
    var logId: int

    @ForeignKey("users")
    var userId: string

    var action: string

    @Index
    var timestamp: datetime

    @Nullable
    var details: object

    @Ignore
    var notes: string
}
```

## State Management Annotations

Weft provides four core annotations for managing state in user interfaces: `@State`, `@Binding`, `@Observed`, and `@Environment`. These annotations create reactive relationships between data and views, ensuring UI automatically updates when data changes.

See the [User Interface](06-user-interface.md) section for complete details and additional examples.

### @Observed

The `@Observed` annotation serves two related purposes: marking observable data sources and consuming them in views.

#### Marking Observable Types

Use `@Observed` on class/type definitions to indicate they contain observable state that views will react to:

```weft
@Observed
class ArticleEngine {
    private(set) var articles: [Article] = []
    private(set) var isLoading: bool = false

    func fetchArticles() async {
        self.isLoading = true
        @SumFunc
        => fetch articles from API
        => parse into Article objects
        => update self.articles
        self.isLoading = false
    }

    func clearCache() {
        self.articles = []
    }
}
```

When you mark a type with `@Observed`, the translator knows to:
- **SwiftUI**: Make it conform to `Observable`
- **Jetpack Compose**: Use `mutableStateOf` for reactive properties
- **React**: Create appropriate state management (Context, store, etc.)

#### Consuming Observable Objects in Views

Use `@Observed` on view properties to observe external state objects. These objects will be passed in when an instance of the view is initialized. When the object's state changes, the view automatically re-renders:

```weft
view ArticleListView {
    @Observed var engine: ArticleEngine     // observes external observable

    Column(isScrollable: true) {
        if engine.isLoading {
            LoadingSpinner()
        } else {
            for article in engine.articles {
                ArticleCard(article: article)
            }
        }
    }
}
```

### @State

Marks local mutable state owned by the view. The view creates and manages the lifecycle of this state:

```weft
view CounterView {
    @State var count: int = 0
    @State var isExpanded: bool = false

    Column {
        Text("Count: \(count)")
        Button(action: { count += 1 }) {
            text: "Increment"
        }
    }
}
```

Use `@State` when:
- The state is private to this view
- The view is responsible for creating and managing the state
- Child views don't need to modify this state (otherwise use `@Binding`)

### @Binding

Creates a two-way connection to state owned by a parent view for when a child need to read *and* write to the state. Changes made through a binding update the parent's state:

```weft
view ParentView {
    @State var searchText: string = ""

    SearchBar(searchText: $searchText)    // pass binding with $ prefix
}

view SearchBar {
    @Binding var searchText: string       // two-way binding to parent state

    TextField(binding: $searchText) {
        placeholder: "Search..."
    }
}
```

Use `@Binding` when:
- A child view needs to read AND write parent state
- You want changes in the child to reflect in the parent
- Creating reusable components that modify external state

### @Environment

Injects state from the environment/context, typically for app-wide or feature-wide shared state:

```weft
view ArticleView {
    @Environment var theme: Theme
    @Environment var authService: AuthService
    @Environment var navigation: NavigationController

    Column {
        Text(article.title) {
            textColor: theme.primaryColor    // uses environment theme
        }
    }
}
```

Use `@Environment` when:
- The state is shared across many views
- You don't want to pass state explicitly through every level
- Working with app-wide concerns (theme, auth, navigation, etc.)

### State Ownership Summary

Understanding which annotation to use comes down to ownership and data flow:

- **`@State`** - "I own and create this state"
- **`@Binding`** - "I can read and write parent's state through a two-way connection"
- **`@Observed`** - "Someone else owns this observable object, I'm watching it for changes"
- **`@Environment`** - "This is shared app-wide or feature-wide, give me access to it"

### Complete Example: State Flow

```weft
// Define an observable data source
@Observed
class ShoppingCart {
    private(set) var items: [Item] = []
    private(set) var total: float = 0.0

    func addItem(item: Item) {
        items.append(item)
        recalculateTotal()
    }

    private func recalculateTotal() {
        @SumFunc
        => sum all item prices
        => update self.total
    }
}

// Parent view owns state
view ShopView {
    @State var cart = ShoppingCart()              // owns the cart
    @State var selectedCategory: string = "all"   // owns filter state

    Column {
        CategoryPicker(
            selected: $selectedCategory           // pass binding with $
        )
        ProductList(
            cart: cart,                           // pass observable
            category: selectedCategory            // pass value
        )
        CartSummary(cart: cart)                   // pass same observable
    }
}

// Child observes and uses binding
view ProductList {
    @Observed var cart: ShoppingCart              // observes cart
    var category: string                          // read-only prop

    Column {
        for product in products where product.category == category {
            ProductCard(
                product: product,
                onAdd: { cart.addItem(product) }
            )
        }
    }
}

// Child uses binding
view CategoryPicker {
    @Binding var selected: string                 // two-way binding

    Row {
        for category in categories {
            Button(action: { selected = category }) {
                text: category
            }
        }
    }
}

// Child observes cart
view CartSummary {
    @Observed var cart: ShoppingCart              // observes cart

    Text("Total: $\(cart.total)")                // auto-updates when total changes
}
```
