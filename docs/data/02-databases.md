# Databases

Weft provides annotations for defining database schemas. Mark types with `@Schema`, `@Entity`, or `@DatabaseModel` to create tables.

## Core Principles

**Schema-first**: Define your schema, get type-safe queries.

**Annotation-driven**: Use `@Id`, `@ForeignKey`, `@Index` to describe structure. Specific annotations outlined in this document.

**Platform translation**: Same schema becomes Room, SwiftData or CoreData, SQLite, Postgres, etc

## Basic Schema

```weft
@Schema
struct User {
    @Id(generated)
    var id: string
    var username: string
    var email: string
    var createdAt: datetime
}
```

**Translates to:**
- **Android**: Room entity
- **iOS**: SwiftData or CoreData entity
- **Backend**: SQL table

## Primary Keys

```weft
@Schema
struct Article {
    @Id(generated)
    var id: string          // auto-generated
    var title: string
}

@Schema
struct Setting {
    @Id
    var key: string         // provided by app
    var value: string
}

// Implicit ID (property named 'id')
@Schema
struct Post {
    var id: string          // automatically treated as @Id
    var content: string
}
```

## Field Types

```weft
@Schema
struct Product {
    @Id(generated)
    var id: string
    var name: string
    var price: float
    var quantity: int
    var available: bool
    var tags: [string]              // usually stored as JSON
    var metadata: [string: string]  // usually stored as JSON
    var createdAt: datetime
}
```

## Optional Fields

```weft
@Schema
struct Profile {
    @Id(generated)
    var id: string
    var username: string

    @Nullable
    var bio: string?

    @Nullable
    var avatarUrl: string?

    var settings: [string: any]? = null
}
```

## Foreign Keys

```weft
@Schema
struct Post {
    @Id(generated)
    var id: string
    var title: string

    @ForeignKey("users")
    var authorId: string

    var content: string
}

// Alternative annotations (same behavior)
@Schema
struct Comment {
    @Id(generated)
    var id: string

    @Reference("posts")
    var postId: string

    @Relation("users")
    var userId: string

    var text: string
}
```

## Indexes

```weft
@Schema
struct Article {
    @Id(generated)
    var id: string

    var title: string

    @Index
    var slug: string        // indexed for fast lookup

    @Index
    var publishedAt: datetime

    var content: string
}

// Composite index (needs platform-specific implementation)
@Schema
@Index(["authorId", "publishedAt"])
struct Post {
    @Id(generated)
    var id: string

    @ForeignKey("users")
    var authorId: string

    var publishedAt: datetime
}
```

## Unique Constraints

```weft
@Schema
struct User {
    @Id(generated)
    var id: string

    @Unique
    var username: string

    @Unique
    var email: string

    var createdAt: datetime
}
```

## Excluding Fields

All these annotations have the same effect:

```weft
@Schema
struct Article {
    @Id(generated)
    var id: string
    var title: string
    var content: string

    @Transient
    var wordCount: int {
        return content.split(" ").count
    }

    @Ignore
    var localCache: [string: any] = [:]

    @NotField
    var isSelected: bool = false
}
```

## Required Fields

```weft
@Schema
struct User {
    @Id(generated)
    var id: string

    @Required
    var email: string       // cannot be null

    @Required
    var username: string

    var bio: string?        // can be null
}
```

## Relationships

```weft
// One-to-Many
@Schema
struct Author {
    @Id(generated)
    var id: string
    var name: string
}

@Schema
struct Book {
    @Id(generated)
    var id: string
    var title: string

    @ForeignKey("authors")
    var authorId: string
}

// Many-to-Many (junction table)
@Schema
struct StudentCourse {
    @Id(generated)
    var id: string

    @ForeignKey("students")
    var studentId: string

    @ForeignKey("courses")
    var courseId: string

    var enrolledAt: datetime
}
```

## Timestamps

```weft
@Schema
struct Post {
    @Id(generated)
    var id: string
    var title: string

    @Index
    var createdAt: datetime

    var updatedAt: datetime?

    var publishedAt: datetime?
}
```

## Complete Example

```weft
@Schema
struct AuditLog {
    @Id(generated)
    var logId: string

    @ForeignKey("users")
    @Index
    var userId: string

    @Required
    var action: string

    @Index
    var timestamp: datetime

    @Nullable
    var details: [string: any]

    var ipAddress: string?

    @Transient
    var isRecent: bool {
        return timestamp > Date.now().addDays(-7)
    }
}
```

## Migrations

Define migrations when schema changes.

```weft
@Migration(version: 2)
@Instruction('''
Add 'verified' column to users table.
Default value should be false for existing rows.
''')
@Schema
struct User {
    @Id(generated)
    var id: string
    var username: string
    var email: string
    var verified: bool = false  // new field
}
```

## Queries in Repositories

```weft
@Observable
@Repository
@Singleton
class UserRepository {
    private var database: Database

    func getUser(id: string) async => User? {
        @SumFunc
        => query database for user by id
        => return user or null
    }

    func getUserByEmail(email: string) async => User? {
        @SumFunc
        => query database where email matches
        => return first result or null
    }

    func getAllUsers() async => [User] {
        @SumFunc
        => query all users from database
        => order by created date descending
        => return array of users
    }
}
```

## Inserting Data

```weft
@Repository
class ArticleRepository {
    private var database: Database

    func saveArticle(article: Article) async {
        @SumFunc
        => insert or update article in database
        => handle conflicts by replacing existing
    }

    func saveMany(articles: [Article]) async {
        @SumFunc
        => batch insert articles for performance
        => use transaction for atomicity
    }
}
```

## Deleting Data

```weft
@Repository
class TodoRepository {
    private var database: Database

    func deleteTodo(id: string) async {
        @SumFunc
        => delete todo from database by id
    }

    func deleteCompleted() async {
        @SumFunc
        => delete all todos where completed is true
    }

    func clearAll() async {
        @SumFunc
        => delete all todos from database
    }
}
```

## See Also

- [JSON](01-json.md) - Serialization patterns
- [API Integration](03-api-integration.md) - Network + database
- [Repositories](../architecture/06-repositories.md) - Data layer pattern
