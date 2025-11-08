# What's Changed: Annotation System v0.3.0

**Date**: January 2025  
**Purpose**: Quick reference for understanding the new annotation system

---

## Why We Changed It

**Goal**: Align Weft with Clean Architecture principles to help developers build well-structured, maintainable apps out of the box.

**Problems with old system**:
- `@Entity` was ambiguous (database concern vs business object)
- No clear layer separation
- Couldn't enforce dependency rules
- Annotations didn't map to architectural patterns
- State management wasn't explicit enough

**New system benefits**:
- Clear layer boundaries (Entities → Use Cases → Adapters → Frameworks)
- Dependency rule validation by LSP
- Explicit reactive relationships
- Separates business logic from infrastructure
- More scalable and extensible

---

## Quick Comparison

### Lifecycle Annotations
```
OLD: @Singleton, @ViewScoped, @FeatureScoped, @SessionScoped
NEW: @LifeCycle(singleton|session|feature|view)
```

### Role Annotations
```
OLD: @Repository, @ViewModel, @Service
NEW: @Role(entity|usecase|repository|service|viewmodel|gateway|dto|adapter)
     ↑ 8 roles total, maps to Clean Architecture layers
```

### State Annotations
```
OLD: @Observable (class), @State (property)
NEW: @Publisher (class), @Subscriber (property, REQUIRED), @LocalState (UI-only)
     ↑ Explicit reactive relationships, access modifiers control observability
```

### Documentation Annotations
```
CLARIFIED: @Instruction - only for translation ambiguity, NOT regular comments
CLARIFIED: @SumFunc - REPLACES implementation, no code underneath
```

---

## Clean Architecture Mapping

```
┌─────────────────────────────────────┐
│ FRAMEWORKS (@Role(adapter), @Schema)│  ← Outermost
│ ┌─────────────────────────────────┐ │
│ │ INTERFACE ADAPTERS              │ │
│ │ @Role(repository|service|       │ │
│ │       viewmodel|gateway)        │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ USE CASES                   │ │ │
│ │ │ @Role(usecase)              │ │ │
│ │ │ ┌─────────────────────────┐ │ │ │
│ │ │ │ ENTITIES                │ │ │ │  ← Innermost
│ │ │ │ @Role(entity)           │ │ │ │
│ │ │ └─────────────────────────┘ │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Dependency Rule**: Inner layers cannot depend on outer layers.

---

## Key Pattern Changes

### Entity Pattern (NEW)
```weft
// OLD: No specific annotation for business objects
// NEW: Clear separation
@Role(entity)
data Article {
    var id: string
    var title: string
    // Pure business logic, no framework dependencies
}
```

### Repository Pattern
```weft
// OLD: One annotation for everything
@Observable @Repository @Singleton
class ArticleRepository { }

// NEW: Interface + Implementation split
@Role(repository)
protocol ArticleRepository { }  // Interface (inner layer)

@Role(adapter)                   // Implementation (outer layer)
@LifeCycle(singleton)
@Publisher
class ArticleRepositoryImpl: ArticleRepository { }
```

### ViewModel Pattern
```weft
// OLD
@Observable @ViewModel @ViewScoped
class ArticleListViewModel {
    @State var error: string? = nil
}

// NEW
@Role(viewmodel)
@LifeCycle(view)
@Publisher
class ArticleListViewModel {
    var error: string? = nil  // Implicitly observable (public)
}
```

### View Pattern
```weft
// OLD
view ArticleListView {
    var viewModel: ArticleListViewModel  // Implicitly observable
    @State var showFilters: bool = false
}

// NEW
view ArticleListView {
    @Subscriber var viewModel: ArticleListViewModel  // Explicit!
    @LocalState var showFilters: bool = false  // Renamed for clarity
}
```

---

## The 8 Roles

1. **@Role(entity)** - Core business objects (innermost)
2. **@Role(usecase)** - Application business rules
3. **@Role(repository)** - Data access interface
4. **@Role(service)** - Business utility interface
5. **@Role(viewmodel)** - Presentation logic
6. **@Role(gateway)** - External service interface (payment, email, etc.)
7. **@Role(dto)** - Data transfer objects (API/DB boundary)
8. **@Role(adapter)** - Concrete implementations (outermost)

---

## State Management Rules

1. Mark class as `@Publisher` → "I have observable state"
2. Mark property as `@Subscriber` → "I observe this publisher" (REQUIRED now)
3. Use `@LocalState` only in views → "Ephemeral UI state"
4. In `@Publisher` classes:
   - Public properties → observable
   - `private(set)` → readable observable
   - `private` → NOT observable

---

## Annotation Usage Rules

### @Instruction
```weft
// ❌ WRONG: Using for regular comments
@Instruction("This fetches articles")
func fetchArticles() -> [Article]

// ✅ CORRECT: Translation ambiguity
@Instruction("API returns both featured_image and featured_image_full. Map featured_image.")
func fetchArticle(id: string) -> Article

// ✅ CORRECT: Platform-specific translation
@Role(adapter)
@Instruction("Use Realm for iOS, Room for Android")
class DatabaseAdapter: Database
```

### @SumFunc
```weft
// ❌ WRONG: Writing code underneath
func processPayment() {
    @SumFunc
    => Process payment
    
    // Implementation code...  ← NO!
}

// ✅ CORRECT: SumFunc IS the implementation
func processPayment(cart: ShoppingCart) async throws -> Receipt {
    @SumFunc
    => Validate cart items
    => Calculate total with tax
    => Process payment through gateway
    => Create order record
    => Send confirmation email
    => Return receipt
}
// No code underneath!
```

---

## Migration Checklist

- [ ] Replace `@Observable` with `@Publisher`
- [ ] Replace `@Singleton` with `@LifeCycle(singleton)`
- [ ] Replace `@ViewScoped` with `@LifeCycle(view)`
- [ ] Replace `@Repository` with `@Role(repository)`
- [ ] Replace `@ViewModel` with `@Role(viewmodel)`
- [ ] Replace `@Service` with `@Role(service)`
- [ ] Replace `@State` with `@LocalState` in views
- [ ] Add `@Subscriber` to all properties observing publishers
- [ ] Separate `@Role(entity)` (business) from `@Schema` (database)
- [ ] Split repositories/services into interface + adapter
- [ ] Replace `@Instruction` comments with regular comments
- [ ] Ensure `@SumFunc` has no code underneath

---

## Validation Configuration

```json
// weft.settings.json
{
  "validation": {
    "dependencyRule": "error",      // Enforce CA dependency rule
    "layerViolations": "error",     // Enforce layer boundaries
    "lifecycleViolations": "warning",
    "stateAnnotations": "warning"   // Missing @Subscriber, etc.
  },
  "architecture": {
    "style": "clean"
  }
}
```

---

## Files Completed

✅ `reference/annotations.md` - Complete rewrite  
✅ `QUICK_REFERENCE.md` - Updated patterns  
✅ `@Instruction` clarification  
✅ `@SumFunc` clarification  

## Files Pending

See `annotation-update-plan.md` for complete list and update order.