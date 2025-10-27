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

Provides specific guidance to translators to reduce ambiguity during implementation.

```weft
@Instruction('''
API return clarification -
The API call returns both featured_image and featured_image_full.
Please map the standard featured_image field and ignore the full size.
''')
func parseArticleResponse(json: JSON) => Article {
    // parsing logic
}
```

**Usage:** Use when you need to clarify implementation details that aren't obvious from the code structure. Pass a single or multiline string with your instructions.

### @SumFunc

Summarizes function logic in plain English, replacing implementation details.

```weft
func fetchAndProcessArticles() async => [Article] {
    @SumFunc
    => fetch articles from API endpoint
    => filter out unpublished articles
    => sort by publication date descending
    => return processed article array
}
```

**Usage:** Use inside function bodies to describe logic at a high level. The translator implements the details. This is a key feature of Weft—write what you want, not how to do it.

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

- [Architecture Annotations](../architecture/02-lifecycle-scope.md) - `@Singleton`, `@ViewScoped`, lifecycle annotations
- [State Annotations](../architecture/04-state-ownership.md) - `@State`, `@Binding`, `@Environment`
- [Pattern Annotations](../architecture/05-patterns-overview.md) - `@Repository`, `@ViewModel`, `@Service`
- [Complete Annotation Index](../reference/annotations.md) - All annotations in one place