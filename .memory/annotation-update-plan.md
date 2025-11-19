# Annotation System Update Plan

**Last Updated**: January 2025
**Status**: ✅ COMPLETE - All Phases Finished

---

## Overview

We've redesigned Weft's annotation system to align with Clean Architecture principles. All documentation has been updated to reflect the new v0.3.0 annotation system.

---

## ✅ Completed

- [x] `reference/annotations.md` - Complete rewrite with new system
- [x] `QUICK_REFERENCE.md` - Updated with new patterns
- [x] Clarified `@Instruction` - for translation ambiguity only, not regular comments
- [x] Clarified `@SumFunc` - replaces function implementation, no code underneath

---

## ✅ All Phases Complete

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
- [x] ui/04-ui-state-ownership.md - ✅ Complete
- [x] architecture/04-roles-and-patterns.md - ✅ Complete
- [x] architecture/01-overview.md - ✅ Complete

All Phase 2 files have been updated with:
- @Instruction clarification (translation ambiguity only)
- @SumFunc clarification (replaces implementation, no code underneath)
- @Role(dto) pattern for API/database boundaries
- @Role(entity) vs @Schema separation
- @Role(gateway) and @Role(adapter) for API layer
- @LocalState replacing @State in views
- @Subscriber requirement for observing publishers
- Removed "Best Practices" sections (keeping docs lean)

#### Completed Files:
- [x] language/07-annotations.md - ✅ Complete
- [x] data/01-json.md - ✅ Complete
- [x] data/02-databases.md - ✅ Complete
- [x] data/03-api-integration.md - ✅ Complete
- [x] ui/01-views.md - ✅ Complete
- [x] README.md - ✅ Complete (version updated to 0.3.0)

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

## Completion Summary

All documentation has been successfully updated to v0.3.0:

### Phase 1: Architecture Core ✅ 
- architecture/02-lifecycle-scope.md
- architecture/03-observability.md
- ui/04-ui-state-ownership.md
- architecture/04-roles-and-patterns.md
- architecture/01-overview.md

### Phase 2: Language & Data ✅
- language/07-annotations.md
- data/01-json.md
- data/02-databases.md
- data/03-api-integration.md
- ui/01-views.md
- README.md

### Phase 3: Polish ✅
- index.md

### Key Changes Applied
- @Instruction now explicitly for translation ambiguity only
- @SumFunc clarified as replacing implementation (no code underneath)
- @Role(dto) pattern consistently applied for API/database boundaries
- @Role(entity) vs @Schema separation clearly documented
- @Role(gateway) and @Role(adapter) for network layer
- @LocalState replacing @State in views
- @Subscriber requirement for observing publishers
- All "Best Practices" sections removed (docs kept lean)
- Version updated to 0.3.0 across project

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
