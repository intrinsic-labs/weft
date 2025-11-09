# Annotation System Update Plan

**Last Updated**: January 2025
**Status**: In Progress - Phase 1 Complete (Architecture Core), Moving to Phase 2

---

## Overview

We've redesigned Weft's annotation system to align with Clean Architecture principles. This document tracks what needs to be updated across the documentation to bring everything inline with the new system.

---

## ✅ Completed

- [x] `reference/annotations.md` - Complete rewrite with new system
- [x] `QUICK_REFERENCE.md` - Updated with new patterns
- [x] Clarified `@Instruction` - for translation ambiguity only, not regular comments
- [x] Clarified `@SumFunc` - replaces function implementation, no code underneath

---

## 🔄 In Progress

### Phase 1: Architecture Core ✅ COMPLETE

All Phase 1 files have been updated with:
- @Lifecycle(singleton|session|feature|view) parameterized form
- @Publisher replacing @Observable
- @Subscriber requirement for observing publishers
- @LocalState replacing @State (view-only)
- Clean Architecture introduction
- All 8 @Role annotations
- Updated examples throughout

#### Completed Files:
- [x] architecture/02-lifecycle-scope.md - ✅ Complete
- [x] architecture/03-observability.md - ✅ Complete
- [x] architecture/04-ui-state-ownership.md - ✅ Complete
- [x] architecture/05-roles-and-patterns.md - ✅ Complete
- [x] architecture/01-overview.md - ✅ Complete

---

### Phase 2: Language & Data

#### 10. `language/07-annotations.md`
**Current**: Documents @Main, @Instruction, @SumFunc, @Index as language-level annotations
**Needs**:
- Update @Instruction definition - clarify it's for translation ambiguity, not comments
- Update @SumFunc definition - clarify it replaces implementation, no code underneath
- Add examples showing correct vs incorrect usage
- Remove any code examples that show implementation under @SumFunc

#### 11. `data/02-databases.md`
**Current**: May document @Entity as database annotation
**Needs**:
- Clarify @Schema is for database mapping (framework layer)
- Separate @Role(entity) for core business objects (inner layer)
- Show entity → schema conversion pattern
- Add @Role(dto) examples for database DTOs

#### 12. `ui/01-views.md`
**Needs**:
- Update @State references to @LocalState
- Add @Subscriber requirement for observing view models
- Update all state management examples
- Ensure consistency with new state annotations (read architechture/04-ui-state-ownership.md for reference)

#### 13. `data/01-json.md`
**Needs**:
- Check for any @Entity references
- Add @Role(dto) pattern for API responses
- Show entity ↔ DTO conversion

#### 14. `data/03-api-integration.md`
**Needs**:
- Add @Role(dto) for API request/response objects
- Add @Role(gateway) for API service interfaces
- Add @Role(adapter) for concrete API implementations
- Show Clean Architecture API patterns

---

### Phase 3: UI & Polish

#### 15. `README.md`
**Needs**:
- Update any references to old annotation names
- Ensure links are accurate
- Update version number if needed


---

## Key Concepts to Emphasize Throughout

### Annotation Changes Summary

| Old (v0.2.0) | New (v0.3.0) | Notes |
|--------------|--------------|-------|
| `@Observable` | `@Publisher` | Class-level, implicit observability via access modifiers |
| `@Singleton` | `@Lifecycle(singleton)` | Parameterized |
| `@ViewScoped` | `@Lifecycle(view)` | Parameterized |
| `@FeatureScoped` | `@Lifecycle(feature)` | Parameterized |
| `@SessionScoped` | `@Lifecycle(session)` | Parameterized |
| `@Repository` | `@Role(repository)` | Interface definition |
| `@ViewModel` | `@Role(viewmodel)` | Presentation logic |
| `@Service` | `@Role(service)` | Utility interface |
| `@State` | `@LocalState` | UI-only, more explicit |
| `@Entity` (DB) | `@Schema` | Framework layer |
| N/A | `@Role(entity)` | Core business objects |
| N/A | `@Role(usecase)` | Application business rules |
| N/A | `@Role(gateway)` | External service interface |
| N/A | `@Role(dto)` | Data transfer object |
| N/A | `@Role(adapter)` | Concrete implementation |
| N/A | `@Subscriber` | Required for observing publishers |

### Role Annotations (8 Total)

```
@Role(entity)      - Core business objects (innermost)
@Role(usecase)     - Application business rules
@Role(repository)  - Data access interface
@Role(service)     - Business utility interface
@Role(viewmodel)   - Presentation logic
@Role(gateway)     - External service interface
@Role(dto)         - Data transfer objects
@Role(adapter)     - Concrete implementations (outermost)
```

### State Management Pattern

```
@Publisher         - Class has observable state
@Subscriber        - Property observes publisher (REQUIRED)
@Binding           - Two-way binding in UI (sugar for @Subscriber(writable: true))
@LocalState        - Ephemeral UI state (views only)
```

### Key Rules to Enforce

1. **Dependency Rule**: Inner layers cannot depend on outer layers
   - entity → depends on nothing
   - usecase → depends on entities and interfaces
   - repository/service/viewmodel/gateway → depends on entities and use cases
   - adapter → depends on anything (outermost)

2. **Lifecycle Dependencies**: Longer-lived → shorter-lived only
   - singleton → can inject into session, feature, view
   - session → can inject into feature, view
   - feature → can inject into view
   - view → cannot inject into longer-lived scopes

3. **State Annotations**:
   - @Subscriber requires target to be @Publisher
   - @LocalState & @Binding only allowed in views
   - In @Publisher classes, access modifiers control observability

4. **@Instruction vs Comments**:
   - Use comments for code documentation
   - Use @Instruction for translation ambiguity only

5. **@SumFunc**:
   - Replaces implementation - don't write code underneath
   - English description becomes the code

---

## Update Strategy

### Phase 1: Architecture Core ✅ COMPLETE
1. ✅ architecture/02-lifecycle-scope.md - DONE
2. ✅ architecture/03-observability.md - DONE
3. ✅ architecture/04-ui-state-ownership.md - DONE
4. ✅ architecture/05-roles-and-patterns.md - DONE
5. ✅ architecture/01-overview.md - DONE

### Phase 2: Language & Data
10. language/07-annotations.md
11. data/01-json.md
12. data/02-databases.md
13. data/03-api-integration.md

### Phase 3: UI & Polish
14. ui/01-views.md
15. README.md (check references)
16. index.md (update descriptions if needed)

---

## Notes for Future Updates

- Keep examples consistent across all docs
- Use the same sample domain (Article/Author/User) for continuity
- Always show interface/implementation split for repositories, services, gateways
- Emphasize @Subscriber requirement in all reactive examples
- Show @LocalState and @Binding only in view examples
- Include validation rules and weft.settings.json config where relevant

---

## Version Tracking

- **v0.2.0**: Old standalone annotations
- **v0.3.0**: New parameterized annotations + Clean Architecture alignment
