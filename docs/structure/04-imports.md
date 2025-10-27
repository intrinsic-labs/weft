# Imports

Weft uses import statements to reference types, functions, and other definitions from external files and modules. Imports establish dependencies and help the translator understand the relationships between different parts of your codebase.

## Basic Imports

Import individual types or entire modules:

```weft
// Import a single type
import Article
import User
import ArticleRepository

// Import multiple types from a module
import { Article, ArticleRepository, ArticleService }

// Import everything from a module
import * from articles
```

## Import Syntax Variants

Weft supports multiple import styles to accommodate different language backgrounds:

```weft
// JavaScript/TypeScript style
import { Article, User } from models

// Python style
from models import Article, User

// Swift/Kotlin style (implicit)
import Article
import User
```

All styles are equivalent—use whichever feels most natural.

## Module Organization

Organize your code into logical modules:

```weft
// models/Article.weft
data Article {
    var id: string
    var title: string
    var content: string
}

// repositories/ArticleRepository.weft
import Article

class ArticleRepository {
    func getArticles() => [Article] {
        // implementation
    }
}

// viewmodels/ArticleListViewModel.weft
import Article
import ArticleRepository

class ArticleListViewModel {
    private var repository: ArticleRepository
    
    func loadArticles() async {
        // implementation
    }
}
```

## Relative vs Absolute Imports

Use relative paths for imports within your project:

```weft
// Absolute (from project root)
import models/Article
import repositories/ArticleRepository

// Relative (from current file location)
import ./Article
import ../models/User
```

## Aliasing Imports

Rename imports to avoid naming conflicts:

```weft
// Alias a type to avoid conflicts
import Article as BlogArticle
import NewsArticle as Article

// Use the aliased name
var blog: BlogArticle = BlogArticle()
var news: Article = Article()
```

## Wildcard Imports

Import all types from a module:

```weft
// Import everything from models
import * from models

// Now you can use Article, User, etc. directly
var article: Article = Article()
var user: User = User()
```

Use wildcard imports sparingly—explicit imports are clearer.

## Platform-Specific Imports

Weft doesn't directly import platform-specific libraries, but you can indicate platform dependencies using annotations:

```weft
@Instruction('''
This file uses platform-specific date formatting.
Swift: import Foundation
Kotlin: import java.time.LocalDateTime
TypeScript: use date-fns library
''')

import Article

func formatArticleDate(article: Article) => string {
    return article.publishedDate.format("MMM d, yyyy")
}
```

## Examples

### Model Imports

```weft
// models/User.weft
data User {
    var id: string
    var username: string
    var email: string
}

// models/Article.weft
import User

data Article {
    var id: string
    var title: string
    var authorId: string
    var author: User?
}
```

### Repository Layer

```weft
// repositories/BaseRepository.weft
class BaseRepository {
    protected var database: Database
    
    protected func logQuery(query: string) {
        print("Query: \(query)")
    }
}

// repositories/ArticleRepository.weft
import Article
import BaseRepository

class ArticleRepository: BaseRepository {
    func getArticles() => [Article] {
        logQuery("SELECT * FROM articles")
        return database.query("SELECT * FROM articles")
    }
}
```

### ViewModel Layer

```weft
// viewmodels/ArticleListViewModel.weft
import Article
import ArticleRepository

class ArticleListViewModel {
    private var repository: ArticleRepository
    
    @State var articles: [Article] = []
    @State var isLoading: bool = false
    
    func loadArticles() async {
        isLoading = true
        articles = await repository.getArticles()
        isLoading = false
    }
}
```

### View Layer

```weft
// views/ArticleListView.weft
import Article
import ArticleListViewModel

view ArticleListView {
    var viewModel: ArticleListViewModel
    
    Column(isScrollable: true) {
        for article in viewModel.articles {
            ArticleCard(article: article)
        }
    }
}

// views/ArticleCard.weft
import Article

view ArticleCard {
    var article: Article
    
    Column(padding: 16) {
        Text(article.title) {
            font: h2
        }
    }
}
```

## Import Organization

Organize imports logically for readability:

```weft
// 1. Standard/platform types (if any)
import Foundation
import DateTime

// 2. Third-party dependencies
import HTTPClient
import DatabaseDriver

// 3. Local modules - models
import Article
import User
import Comment

// 4. Local modules - repositories
import ArticleRepository
import UserRepository

// 5. Local modules - services
import AnalyticsService
import AuthService
```

## Circular Dependencies

Avoid circular dependencies between modules:

```weft
// Bad: Circular dependency
// User.weft
import Article

type User {
    var articles: [Article]
}

// Article.weft
import User

type Article {
    var author: User
}
```

**Solution**: Use forward declarations or split into separate files:

```weft
// User.weft
type User {
    var id: string
    var username: string
}

// Article.weft
import User

type Article {
    var id: string
    var title: string
    var authorId: string
}

// UserWithArticles.weft
import User
import Article

type UserWithArticles {
    var user: User
    var articles: [Article]
}
```

## Translation

Imports translate to platform-specific import mechanisms:

**Swift:**
```swift
import Foundation
import MyAppModels

// Types are now available
let article = Article()
```

**Kotlin:**
```kotlin
import com.myapp.models.Article
import com.myapp.repositories.ArticleRepository

// Types are now available
val article = Article()
```

**TypeScript:**
```typescript
import { Article } from './models/Article';
import { ArticleRepository } from './repositories/ArticleRepository';

// Types are now available
const article = new Article();
```

## Best Practices

**Import only what you need**: Explicit imports are clearer than wildcards.

```weft
// Good: Clear what's being used
import Article
import User
import ArticleRepository

// Less clear: What types are actually used?
import * from models
import * from repositories
```

**Group related imports**: Keep imports organized by purpose.

```weft
// Good: Organized groups
// Models
import Article
import User

// Repositories
import ArticleRepository
import UserRepository

// Services
import AnalyticsService
```

**Avoid circular dependencies**: Structure your modules to prevent circular imports.

**Use consistent import style**: Pick one import syntax style and use it throughout your project.

## See Also

- [Definitions](01-definitions.md) - Type definitions that get imported
- [Architecture Overview](../architecture/01-overview.md) - Organizing code into modules
- [Project Structure](../guides/project-structure.md) - How to organize files and folders
