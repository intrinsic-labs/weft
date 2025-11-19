# Imports

Weft uses import statements to reference types and definitions from other files. Imports help the translator understand dependencies between different parts of your codebase.

## Basic Syntax

Import individual types or groups of types:

```weft
// Import a single type
import Article
import User

// Import multiple types from a module
import { Article, ArticleRepository, ArticleService }

// Import everything from a module
import * from models
```

## Multiple Syntax Styles

Weft supports different import styles to accommodate various language backgrounds:

```weft
// JavaScript/TypeScript style
import { Article, User } from models

// Python style
from models import Article, User

// Swift/Kotlin style (implicit module)
import Article
import User
```

All styles are equivalent—the main point is they signal to the translator where and what to look for when writing implementations.

## Aliasing

Rename imports to avoid naming conflicts:

```weft
// Alias a type to avoid conflicts
import Article as BlogArticle
import NewsArticle as Article

// Use the aliased name
var blog: BlogArticle = BlogArticle()
var news: Article = Article()
```

## Platform-Specific Dependencies

Use `@Instruction` to indicate platform-specific imports:

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

## Platform Translation

The translator handles platform-specific import syntax:

- **Swift**: `import ModuleName` or `import Foundation`
- **Kotlin**: `import com.package.ClassName`
- **TypeScript**: `import { Type } from './path'`

## Best Practices

**Import only what you need**: Be explicit rather than using wildcards.

**Use consistent import style**: Pick one syntax style for your project and stick with it.

**Organize by layer**: Group imports by architecture layer (models, repositories, viewmodels, etc.).

## See Also

- [Definitions](01-definitions.md) - Type definitions that get imported
- [Architecture Overview](../architecture/01-overview.md) - Organizing code into modules
