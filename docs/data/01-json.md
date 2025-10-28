# JSON Serialization

Weft provides automatic JSON serialization for data types. Mark types with `@JSON` to enable automatic encoding/decoding.

## Core Principles

**Automatic mapping**: Properties map to JSON keys by default.

**Flexible naming**: Use `@JSONKey` to customize JSON field names.

**Type safety**: Weft validates types during serialization.

## Basic JSON Types

```weft
@JSON
type Article {
    var id: string
    var title: string
    var content: string
    var published: bool
}

// Usage
var article = Article(
    id: "123",
    title: "Hello World",
    content: "...",
    published: true
)

var json = article.toJSON()
// {"id":"123","title":"Hello World","content":"...","published":true}

var parsed = Article.fromJSON(jsonString)
```

## Custom Field Names

```weft
@JSON
type User {
    var id: string

    @JSONKey("display_name")
    var displayName: string

    @JSONKey("email_address")
    var email: string

    @JSONKey("created_at")
    var createdAt: datetime
}

// Maps to:
// {"id":"...", "display_name":"...", "email_address":"...", "created_at":"..."}
```

## Optional Fields

```weft
@JSON
type Post {
    var id: string
    var title: string
    var excerpt: string?           // optional in JSON
    var coverImage: string? = null // optional with default
    var tags: [string]? = null     // optional array
}

// Valid JSON with missing optionals:
// {"id":"1","title":"Post"}
```

## Nested Objects

```weft
@JSON
type Author {
    var id: string
    var name: string
}

@JSON
type Article {
    var id: string
    var title: string
    var author: Author              // nested object
    var relatedArticles: [Article]  // array of objects
}
```

## Collections

```weft
@JSON
type Category {
    var id: string
    var name: string
    var subcategories: [Category] = []
}

@JSON
type Blog {
    var posts: [Post]
    var tags: [string]
    var metadata: [string: string]  // dictionary/map
}
```

## Ignoring Fields

```weft
@JSON
type User {
    var id: string
    var username: string
    var email: string

    @JSONIgnore
    var password: string  // never serialize

    @JSONIgnore
    var localCache: [string: any] = [:]
}
```

## Date & Time Handling

```weft
@JSON
type Event {
    var id: string
    var name: string

    @JSONFormat("yyyy-MM-dd'T'HH:mm:ssZ")
    var startTime: datetime

    @JSONFormat("yyyy-MM-dd")
    var eventDate: date

    var timestamp: int  // unix timestamp
}
```

## Computed Properties

```weft
@JSON
type Article {
    var id: string
    var title: string
    var createdAt: datetime

    @JSONIgnore
    var formattedDate: string {
        return createdAt.format("MMM d, yyyy")
    }
}
```

## Enums

```weft
enum Status {
    pending
    approved
    rejected
}

@JSON
type Request {
    var id: string
    var status: Status  // serializes as string
}

// JSON: {"id":"123","status":"approved"}
```

## Arrays and Lists

```weft
@JSON
type Response {
    var data: [Article]
    var total: int
    var page: int
}

// Parse array directly
var articles = [Article].fromJSON(jsonArray)
```

## Error Handling

```weft
func loadArticle(id: string) async => Article? {
    try {
        var json = await api.fetch("/articles/\(id)")
        return Article.fromJSON(json)
    } catch error: JSONError {
        print("Failed to parse: \(error)")
        return null
    }
}
```

## API Response Pattern

```weft
@JSON
type APIResponse<T> {
    var data: T
    var message: string?
    var error: string?
}

@JSON
type ArticleResponse {
    var articles: [Article]
    var total: int
    var page: int
}

func fetchArticles() async => [Article] {
    var response = await api.get("/articles")
    var parsed = APIResponse<ArticleResponse>.fromJSON(response)
    return parsed.data.articles
}
```

## Data Transfer Objects (DTOs)

```weft
// API DTO - matches backend shape
@JSON
type ArticleDTO {
    var id: string
    @JSONKey("post_title")
    var title: string
    @JSONKey("post_content")
    var content: string
    @JSONKey("featured_image")
    var imageUrl: string?
}

// Domain model - app's internal shape
type Article {
    var id: string
    var title: string
    var content: string
    var imageUrl: string?
}

// Conversion
func toDomain(dto: ArticleDTO) => Article {
    return Article(
        id: dto.id,
        title: dto.title,
        content: dto.content,
        imageUrl: dto.imageUrl
    )
}
```

## Validation

```weft
@JSON
type User {
    var id: string
    var email: string
    var age: int

    func isValid() => bool {
        return email.contains("@") && age >= 0
    }
}

func parseUser(json: string) => User? {
    var user = User.fromJSON(json)
    return user?.isValid() ? user : null
}
```

## Best Practices

**Use DTOs for APIs**: Separate API shape from domain models.

```weft
// API layer
@JSON
type UserDTO { /* ... */ }

// Domain layer
type User { /* ... */ }

// Convert at boundary
func toDTO(user: User) => UserDTO
func toDomain(dto: UserDTO) => User
```

**Handle optionals explicitly**: Make null-safety clear.

```weft
@JSON
type Response {
    var data: [Article]?    // explicit optional
    var error: string?      // explicit optional
}
```

**Validate after parsing**: Don't trust external data.

```weft
var user = User.fromJSON(json)
if let validUser = user, validUser.isValid() {
    // use validUser
}
```

**Use type-safe defaults**: Avoid null where possible.

```weft
@JSON
type Config {
    var enabled: bool = false
    var timeout: int = 30
    var retries: int = 3
}
```

## See Also

- [Databases](02-databases.md) - Schema and persistence
- [API Integration](03-api-integration.md) - Async patterns
- [Repositories](../architecture/06-repositories.md) - Data layer
