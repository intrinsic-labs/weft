# Types & Collections

**Weft is a strictly-typed language.** Every variable, parameter, and return value must have a defined type (either explicit or inferred). This ensures clear communication of intent to translators and results in higher-quality native code generation.

Types can be explicit or inferred from context:
```weft
var name: string = "John"    // explicit
var name = "John"            // inferred as string (also valid)
var name: string             // declaration without assignment
```

## Primitive Types

Weft supports the following primitive types. The canonical style is **lowercase**, but **PascalCase** is also supported for developers coming from Swift, Kotlin, or other statically-typed languages.

### Core Types

```weft
// Text
string / String

// Numbers
int / Int / integer / Integer       // whole numbers
float / Float                       // decimal numbers (32-bit)
double / Double                     // decimal numbers (64-bit, higher precision)

// Boolean
bool / Bool / boolean / Boolean

// Temporal
date / Date                         // calendar date
datetime / DateTime                 // date with time

// Special Types
url / URL / Url                     // web addresses, URIs
image / Image                       // image data/references
void / Void                         // no return value (for functions)
```

**Note:** Weft does not support `any` as a type, as it goes against the goal of clear intent and structure. For dynamic data, define a proper data transfer object (DTO), enums with associated values, or interfaces/protocols to capture expected structure.

## Collections

Weft supports three core collection types: **arrays**, **dictionaries/maps**, and **sets**. Multiple syntax variants are supported to accommodate developers from different language backgrounds.

### Arrays/Lists

```weft
[Type]                              // canonical - array of Type
Array<Type>                         // also supported (generic style)
List<Type>                          // also supported (Kotlin style)

[string]                            // array of strings
[Article]                           // array of Articles
```

### Dictionaries/Maps

```weft
[Key: Value]                        // canonical - Swift-style
Map<Key, Value>                     // also supported (Kotlin/Java style)
Dict<Key, Value>                    // also supported (Python style)

[string: Article]                   // dictionary mapping strings to Articles
[int: User]                         // dictionary mapping ints to Users
```

### Sets

```weft
Set<Type>                           // unique, unordered collection

Set<string>                         // set of unique strings
Set<int>                            // set of unique integers
```

## Optionals

```weft
// Optional types
Type?                               // optional Type (may be null/nil)
string?                             // optional string
User?                               // optional User

// Optional collections
[Type]?                             // optional array
[string]?                           // may be null or array of strings
[string: int]?                      // optional dictionary
Set<string>?                        // optional set
```

## Mutability

Use `var` vs `let` to control mutability of collections, not the type itself:

```weft
let readOnly: [Article]             // immutable binding - cannot reassign
var mutable: [Article]              // mutable binding - can modify or reassign

let constMap: [string: int]         // cannot reassign this dictionary
var mutMap: [string: int]           // can modify or reassign this dictionary
```

## Examples

```weft
type User {
    var id: string
    var username: string
    var age: int
    var isActive: bool
    var profileImage: image?        // optional image
    var lastLogin: datetime?        // optional datetime
}

type Cache {
    var articles: [string: Article]     // dictionary mapping IDs to Articles
    var tags: Set<string>               // set of unique tags
    var favorites: [Article]            // array of favorite articles
    var metadata: Map<string, string>   // alternative Map syntax
}

func calculateAverage(numbers: [float]) => float {
    var sum: float = 0.0
    for num in numbers {
        sum += num
    }
    return sum / numbers.count
}

func groupByCategory(articles: [Article]) => [string: [Article]] {
    var groups: [string: [Article]] = [:]
    @SumFunc
    => iterate through articles
    => group by category name
    => return dictionary of category to array of articles
}

async func fetchUser(id: string) => User? {
    // may return User or null
}
```
