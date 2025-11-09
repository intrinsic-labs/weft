# Databases

Weft separates domain entities from database schemas:

- **`@Role(entity)`** - Core business objects in your domain layer
- **`@Schema`** - Database table definitions in your framework layer

This separation follows Clean Architecture principles: entities are pure domain logic, schemas handle persistence details.

## Entities vs Schemas

```weft
// Domain entity - pure business logic
@Role(entity)
data Article {
    var id: string
    var title: string
    var content: string
    var authorId: string
    var publishedAt: datetime?
}

// Database schema - persistence mapping
@Schema
struct ArticleSchema {
    @Id(generated)
    var id: string
    var title: string
    var content: string
    
    @ForeignKey("users")
    @Index
    var author_id: string
    
    @Nullable
    var published_at: datetime?
    
    var created_at: datetime
    var updated_at: datetime
}
```

Entities define **what** your data means. Schemas define **how** it's stored.

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

## See Also

- [Roles & Patterns](../architecture/05-roles-and-patterns.md) - Entity and repository patterns
- [JSON](01-json.md) - DTOs and serialization
- [API Integration](03-api-integration.md) - Network layer
