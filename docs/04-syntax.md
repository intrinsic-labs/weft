# Syntax

## Value Assignment

Weft supports multiple keywords for declaring variables, allowing you to use the syntax you're most comfortable with.

### Mutable Variables

These mean the value can be rewritten later (mutable data): `var`, `mut`, `mutable`

```weft
var someVar
mut someMut
mutable someMutable
```

### Immutable Variables

These mean the value cannot be rewritten later (immutable data): `const`, `let`, `val`, `final`

```weft
const someConst
let someLet
val someVal
final someFinal
```

## Enums

Enums should use the `enum` keyword and comma separate case values. Typically, case values would be all-caps, but lowercase or sentence case are also acceptable.

### Basic Enums

```weft
enum SomeEnum {
  RED,
  GREEN,
  BLUE
}
```

### Enums with Associated Values

Enums may also define associated values:

```weft
enum SomeEnum {
  SUCCESS(message),
  ERROR(code, message),
  TIMEOUT
}
```

### Enums with Raw Values

And raw values with primitive types (like string or int):

```weft
enum SomeEnum: string {
  RED = "red",
  GREEN = "green",
  BLUE = "blue"
}
```

## Scope & Definition

Weft provides multiple keywords to define scope and structure. Use whichever feels most natural for your context — Weft's flexible syntax accepts various approaches, and the translator (whether human or model) will use context and annotations to implement correctly for the target platform.

### Scope
You can use curly braces `{ }` to define scope (like C-based languages) or indentation (like Python). Both are acceptable, even in the same file. Semicolons are optional.

```weft
func doSomething() => void {
    // scoped with braces
    var x = 10
    var y = 20
    return x + y;
}

def doSomethingElse:
    // scoped with indentation
    var x = 10
    var y = 20
    return x + y
```

### Primary Keywords

1. **`type`** - General-purpose keyword for quickly defining custom types/objects. The translator uses context and annotations to determine the best implementation (class, struct, interface, etc.) for the target platform. Use this when you want flexibility and don't need to specify exact implementation details.

2. **`class`** - Inheritance, complex functionality, state management. Use when you need traditional OOP features.

3. **`struct`** - DTO/object definition with some convenience methods. Use for data-centric types that may include helper methods.

4. **`data`** - Pure data with no custom methods (auto-generates boilerplate like equals, hash, toString, copy). Use for simple data containers.

5. **`object`** - Singleton objects or constant containers. A singleton is a design pattern where only one instance of the type exists throughout your application — useful for global constants, configuration, or shared resources.

6. **`view`** - UI components. See the [User Interface](06-user-interface.md) section for details.

### Examples

#### Quick Type Definition (Flexible Implementation)

```weft
type Article {
    var id: string
    var title: string
    var content: string
}
// Translator decides best implementation based on target:
// Swift: struct, Kotlin: data class, TypeScript: interface
```

#### Singleton/Constants Container

```weft
object ENDPOINTS {
    let BASE_URL = "https://api.example.com"
    let ARTICLES = self.BASE_URL + "/articles"
    let VIDEOS = self.BASE_URL + "/videos"
}
// Only one instance exists globally
```

#### Complex Functionality, State Management

```weft
class ArticleManager {
    private var cache: [Article]
    private var apiClient: APIClient

    func fetchArticles() => [Article] {
      @SumFunc
      => check if articles are in cache
      => if not, use apiClient to fetch from server
      => store fetched articles in cache (modify state)
    }
}
```

#### Data with Convenience Methods

```weft
struct Article {
    var id: string
    var title: string
    var content: string

    func toDisplayFormat() => DisplayArticle {
        // Custom transformation
    }

    func validate() => bool {
        // Custom validation logic
    }
}
```

#### Pure Data

```weft
data ArticleMetadata {
    var id: string
    var title: string
    var author: string
    var publishedDate: Date
}
// Auto-generates: equals, hash, toString, copy
// LLM knows: use data class (Kotlin), struct
// with Equatable/Hashable (Swift),
// interface (TypeScript), dataclass (Python)
```

## Imports

Use `import` statements to reference types from other files:

```weft
import Article
import User
import { ArticleService, UserService }
```

Imports help establish dependencies and allow the translator to understand the relationships between different parts of your codebase.
