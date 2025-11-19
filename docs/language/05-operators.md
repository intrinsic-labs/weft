# Operators

Weft supports both symbol-based and word-based operators. 

## Boolean Logic Operators

Weft accepts both symbols and words for boolean operations:

```weft
// AND operators (all equivalent)
if isActive && hasPermission { }
if isActive and hasPermission { }

// OR operators (all equivalent)
if isAdmin || isModerator { }
if isAdmin or isModerator { }

// NOT operators (all equivalent)
if !isDeleted { }
if not isDeleted { }
```

### Examples

```weft
func canEditPost(user: User, post: Post) => bool {
    return user.isAdmin || (user.id == post.authorId && post.isEditable)
}

func isValidUser(user: User) => bool {
    return user.isActive and user.email != null and not user.isBanned
}
```

## Comparison Operators

Standard comparison operators work as expected:

```weft
==  // equal to
!=  // not equal to
<   // less than
>   // greater than
<=  // less than or equal to
>=  // greater than or equal to

// Natural language variants (all valid)
is equal to
is not equal to
is less than
is greater than
is less than or equal to
is greater than or equal to
```

### Examples

```weft
if user.age >= 18 {
    // user is an adult
}

if article.viewCount > 1000 {
    // popular article
}

if status == "active" {
    // status is active
}

if price != 0.0 {
    // price is set
}

// Natural language comparisons
if age is greater than or equal to 18 {
    // user is an adult
}

if score is less than passingGrade {
    // student failed
}

if status is equal to "active" {
    // status is active
}

if count is not equal to 0 {
    // has items
}
```

## Arithmetic Operators

```weft
+   // addition
-   // subtraction
*   // multiplication
/   // division
%   // modulo (remainder)

// Natural language variants (also valid)
plus
minus
times
divided by
modulo

// Compound assignment
+=  // add and assign
-=  // subtract and assign
*=  // multiply and assign
/=  // divide and assign
```

### Examples

```weft
var total = price + tax
var discount = price * 0.1
var remaining = total - discount

var count = 0
count += 1  // count is now 1
count *= 2  // count is now 2

var isEven = number % 2 == 0

// Natural language arithmetic
var total = price plus tax
var perItem = total divided by itemCount
var discount = price times 0.1
var remaining = total minus discount
```

## String Operators

```weft
// Concatenation
var fullName = firstName + " " + lastName

// String interpolation (multiple styles supported)
var greeting = "Hello, \(name)!"              // Swift-style
var message = "User ${user.id} has ${user.points} points"  // JS/TS/Kotlin-style
var status = "Status: {isActive}"             // Natural style

// All interpolation styles are equivalent - use what works for you and your team
// We do recommend being consistent within a project for the sake of clarity

// Multiline strings
var paragraph = """
This is a multiline string.
It preserves line breaks.
Use triple quotes for multiline text.
"""
```

## Null Safety Operators

Weft provides several operators for working safely with optional values:

### Optional Chaining

Use `?` to safely access properties on optional values:

```weft
// Safe navigation
var title = article?.metadata?.title

// If article or metadata is null, title will be null
// No runtime error occurs
```

### Null Coalescing

Use `??` to provide default values for null/nil values:

```weft
// Provide default value
var displayName = user.nickname ?? user.username ?? "Anonymous"

// Chain multiple fallbacks
var imageUrl = article.customImage ?? article.featuredImage ?? defaultImage
```

### Force Unwrap

Use `!` to force unwrap an optional (use with caution):

```weft
// Only use when you're certain the value is not null
var article = optionalArticle!

// Better: Use if-let or guard
if let article = optionalArticle {
    // safely use article here
}
```

## Membership Operators

Check if an item exists in a collection:

```weft
// Check membership
if item in collection {
    // item exists in collection
}

if item not in collection {
    // item does not exist in collection
}
```

### Examples

```weft
var allowedRoles = ["admin", "moderator", "editor"]

if user.role in allowedRoles {
    // user has permission
}

var bannedUsers = ["user123", "user456"]
if user.id not in bannedUsers {
    // user is not banned
}
```

## Ternary Operator

Concise conditional expressions:

```weft
// condition ? valueIfTrue : valueIfFalse
var status = isActive ? "Active" : "Inactive"
var message = count > 0 ? "You have \(count) items" : "No items"
var color = score >= 80 ? Color.green : Color.red
```

## Range Operators

Create ranges for iteration. Exclusive or half-open ranges are declared as `..<` while inclusive ranges use `..` or `...`:

```weft
// Inclusive range (0 to 10)
for i in 0..10 {
    // i goes from 0 to 10
}

for i in 0...10 {
    // i goes from 0 to 10
}

// Exclusive range (0 to 10)
for i in 0..<10 {
    // i goes from 0 to 9
}

// Can be used with any comparable types
for char in 'a'..'z' {
    // iterate through letters
}
```

## Operator Precedence

Operators follow standard mathematical precedence:

1. Parentheses `()`
2. Unary operators `!`, `not`, `-`, `+`
3. Multiplication and division `*`, `/`, `%`
4. Addition and subtraction `+`, `-`
5. Comparison `<`, `>`, `<=`, `>=`
6. Equality `==`, `!=`
7. Logical AND `&&`, `and`
8. Logical OR `||`, `or`
9. Ternary `? :`
10. Assignment `=`, `+=`, `-=`, etc.

### Examples

```weft
// Use parentheses for clarity
var result = (a + b) * c
var isValid = (age >= 18) && (hasPermission || isAdmin)

// Without parentheses (relies on precedence)
var result = a + b * c  // b * c is evaluated first
```

## Type Checking and Casting

Check types and safely cast values:

```weft
// Type checking
if value is string {
    // value is a string
}

// Type casting
var text = value as string
var optionalText = value as? string  // safe cast, returns null if fails
```

## Best Practices

**Use word operators for readability**: When logic is complex, word operators can be clearer.

**Prefer optional chaining over force unwrapping**: Avoid crashes by handling nulls gracefully.

**Use parentheses for complex expressions**: Make operator precedence explicit.

## See Also

- [Control Flow](03-control-flow.md) - Using operators in conditionals
- [Functions](04-functions.md) - Operators in function logic
- [Types](01-types.md) - Type system and optionals
- [Error Handling](06-error-handling.md) - Handling null and error cases
