# Annotations

Annotations in Weft provide metadata and context to code, helping communicate intent to both developers and translators. They are prefixed with `@` and can be applied to types, functions, and properties.

## Core Annotations

### @Main

Marks the entry point of the application.

```weft
@Main
class MyApp: App {
    @State var theme = Theme()
    
    var content: View {
        MainView() {
            environment: [theme]
        }
    }
}
```

**Usage:** Apply to a class or function that serves as the application entry point. For standard apps, annotate a class conforming to the `App` protocol.

### @Instruction

Provides guidance to translators when translation is ambiguous or platform-specific.

**Use for:**
- Clarifying ambiguous external data (e.g. which API field to use)
- Platform-specific implementation choices
- Framework selection guidance
- Etc

**Do not use for:**
- Regular code comments (use `//` instead)
- Documenting what code does (code should be self-explanatory)
- General explanations

```weft
// ✅ CORRECT: Resolving ambiguity
@Instruction("API returns both featured_image and featured_image_full. Map featured_image.")
func parseArticleResponse(json: JSON) -> Article

// ✅ CORRECT: Platform-specific choice
@Role(adapter)
@Instruction("Use Realm for iOS, Room for Android")
class DatabaseAdapter: Database

// ❌ WRONG: Regular comment
@Instruction("This function fetches articles")
func fetchArticles() -> [Article]
```

**Usage:** Apply to classes, functions, or properties. Pass a string with your clarification.

### @SumFunc

Replaces function implementation with a high-level natural language description. The translator generates the actual code.

**Important:** `@SumFunc` IS the implementation. You don't need to write the actual code underneath it.

```weft
// ✅ CORRECT: @SumFunc is the implementation
func fetchAndProcessArticles() async -> [Article] {
    @SumFunc
    => fetch articles from API endpoint
    => filter out unpublished articles
    => sort by publication date descending
    => return processed article array
}
// Your work is done!

// ❌ WRONG: Code under @SumFunc
func processPayment(cart: Cart) async -> Receipt {
    @SumFunc
    => Process the payment
    
    let total = cart.calculateTotal()  // @SumFunc replaces this
    return gateway.charge(total)       // Use regular comments to document regular functions
}
```

**Usage:** Place inside function body. Write what you want done, not how to do it. This is pseudocode's core feature—communicate intent, let the translator handle implementation.

### @Index

Creates an index file documenting a directory's contents and purpose.

```weft
@Index('models')

# Models Directory

This directory contains all data models for the application:

- **DTOs**: API response models (ArticleDTO, UserDTO)
- **Domain**: Core domain models (Article, User, Comment)
- **ViewModels**: Presentation models for UI

All models follow the naming convention: EntityType + suffix.
```

**Usage:** Create an `index.weft` file in a directory with `@Index('directory_name')` at the top. Write context in markdown or plain text.

## See Also

- [Lifecycle Annotations](../architecture/02-lifecycle-scope.md) - `@Lifecycle(singleton|session|feature|view)`
- [State Annotations](../architecture/04-ui-state-ownership.md) - `@LocalState`, `@Binding`, `@Subscriber`
- [Role Annotations](../architecture/05-roles-and-patterns.md) - `@Role(entity|usecase|repository|...)`
- [Complete Annotation Reference](../reference/annotations.md) - All annotations in one place