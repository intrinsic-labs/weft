# JSON Serialization

Weft provides a `@JSON` annotation to signal JSON serialization for data types.

**Automatic mapping**: Properties map to JSON keys by default.

**Flexible naming**: Use `@JSONKey` to customize JSON field names.

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

## Data Transfer Objects

Use `@Role(dto)` for objects that cross architectural boundaries (API responses, database records).

```weft
// API DTO - matches external API shape
@Role(dto)
@JSON
data ArticleDTO {
    var id: string
    @JSONKey("post_title")
    var title: string
    @JSONKey("post_content")
    var content: string
    @JSONKey("author_id")
    var authorId: string
    @JSONKey("featured_image")
    var imageUrl: string?

    func toEntity() -> Article {
        return Article(
            id: id,
            title: title,
            content: content,
            authorId: authorId,
            imageUrl: imageUrl
        )
    }
}

// Domain entity - app's core model
@Role(entity)
data Article {
    var id: string
    var title: string
    var content: string
    var authorId: string
    var imageUrl: string?
}
```

DTOs handle format differences (snake_case vs camelCase, date formats, field names) so entities remain clean.
```

## Validation

```weft
@Role(dto)
@JSON
data UserDTO {
    var id: string
    var email: string
    var age: int

    func toEntity() -> User? {
        if !email.contains("@") || age < 0 {
            return null
        }
        return User(id: id, email: email, age: age)
    }
}

func parseUser(json: string) -> User? {
    var dto = UserDTO.fromJSON(json)
    return dto?.toEntity()
}
```

## See Also

- [Databases](02-databases.md) - Schema and persistence
- [API Integration](03-api-integration.md) - Network requests and DTOs
- [Roles & Patterns](../architecture/05-roles-and-patterns.md) - DTO pattern details
