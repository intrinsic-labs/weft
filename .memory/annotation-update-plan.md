# Annotation System Update Plan

**Last Updated**: January 2025  
**Status**: In Progress - Planning Phase Complete, Starting Updates

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

## 🔄 Needs Updating

### Critical Updates (Core Changes)

#### 1. `language/07-annotations.md`
**Current**: Documents @Main, @Instruction, @SumFunc, @Index as language-level annotations  
**Needs**: 
- Update @Instruction definition - clarify it's for translation ambiguity, not comments
- Update @SumFunc definition - clarify it replaces implementation, no code underneath
- Add examples showing correct vs incorrect usage
- Remove any code examples that show implementation under @SumFunc

#### 2. `architecture/02-lifecycle-scope.md`
**Current**: Documents @Singleton, @ViewScoped, @FeatureScoped, @SessionScoped as separate annotations  
**Needs**:
- Migrate to `@LifeCycle(singleton|session|feature|view)` parameterized form
- Update all examples throughout
- Add dependency hierarchy rules (longer → shorter lived only)
- Note that protocols don't have lifecycle annotations

#### 3. `architecture/03-observability.md`
**Current**: Documents @Observable pattern  
**Needs**:
- Deprecate @Observable, introduce @Publisher
- Explain implicit observability via access modifiers in @Publisher classes
- Update all code examples to use @Publisher
- Add migration notes

#### 4. `architecture/04-state-ownership.md`
**Current**: Documents @State, @Binding, @Environment  
**Needs**:
- Rename @State to @LocalState (UI-only)
- Add @Subscriber as required annotation for observing publishers
- Update @Binding to be sugar for @Subscriber(writable: true)
- Clarify @LocalState is view-only (LSP enforced)
- Update all examples

#### 5. `architecture/05-patterns-overview.md`
**Current**: Overview of Repositories, ViewModels, Services working together  
**Needs**:
- Add Clean Architecture layer introduction
- Update to use @Role(repository|viewmodel|service)
- Add new roles: entity, usecase, gateway, dto, adapter
- Show how roles map to CA layers
- Update all code examples

#### 6. `architecture/06-repositories.md`
**Current**: Documents @Repository annotation  
**Needs**:
- Update to @Role(repository) for interfaces
- Add @Role(adapter) for implementations
- Show interface/implementation split
- Emphasize returning entities not DTOs
- Update examples with @LifeCycle and @Publisher

#### 7. `architecture/07-viewmodels.md`
**Current**: Documents @ViewModel annotation  
**Needs**:
- Update to @Role(viewmodel)
- Add @Publisher and @Subscriber patterns
- Show @LocalState usage in connected views
- Update lifecycle to @LifeCycle(view) typically
- Update all examples

#### 8. `architecture/08-services.md`
**Current**: Documents @Service annotation  
**Needs**:
- Update to @Role(service) for interfaces
- Add @Role(adapter) for implementations
- Show interface/implementation split pattern
- Update examples

#### 9. `data/02-databases.md`
**Current**: May document @Entity as database annotation  
**Needs**:
- Clarify @Schema is for database mapping (framework layer)
- Separate @Role(entity) for core business objects (inner layer)
- Show entity → schema conversion pattern
- Add @Role(dto) examples for database DTOs

---

### Important Updates (Context & Consistency)

#### 10. `architecture/01-overview.md`
**Needs**:
- Add Clean Architecture introduction
- Explain concentric circles and dependency rule
- Show how Weft's roles map to CA layers
- Set context for all architecture docs

#### 11. `ui/01-views.md`
**Needs**:
- Update @State references to @LocalState
- Add @Subscriber requirement for observing view models
- Update all state management examples
- Ensure consistency with new state annotations

#### 12. `data/01-json.md`
**Needs**:
- Check for any @Entity references
- Add @Role(dto) pattern for API responses
- Show entity ↔ DTO conversion

#### 13. `data/03-api-integration.md`
**Needs**:
- Add @Role(dto) for API request/response objects
- Add @Role(gateway) for API service interfaces
- Add @Role(adapter) for concrete API implementations
- Show Clean Architecture API patterns

#### 14. `README.md`
**Needs**:
- Update any references to old annotation names
- Ensure links are accurate
- Update version number if needed

---

### New Content Needed

#### 15. `architecture/10-clean-architecture.md` (NEW FILE)
**Should Include**:
- What is Clean Architecture?
- The dependency rule explained
- Concentric circles diagram (text representation)
- How Weft's @Role annotations map to CA layers
- Dependency validation rules
- Complete example showing all layers
- Common pitfalls and how to avoid them
- Link to reference/annotations.md for details

---

## Key Concepts to Emphasize Throughout

### Annotation Changes Summary

| Old (v0.2.0) | New (v0.3.0) | Notes |
|--------------|--------------|-------|
| `@Observable` | `@Publisher` | Class-level, implicit observability via access modifiers |
| `@Singleton` | `@LifeCycle(singleton)` | Parameterized |
| `@ViewScoped` | `@LifeCycle(view)` | Parameterized |
| `@FeatureScoped` | `@LifeCycle(feature)` | Parameterized |
| `@SessionScoped` | `@LifeCycle(session)` | Parameterized |
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
@Binding           - Two-way binding (sugar for @Subscriber(writable: true))
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
   - @LocalState only allowed in views
   - In @Publisher classes, access modifiers control observability

4. **@Instruction vs Comments**:
   - Use comments for code documentation
   - Use @Instruction for translation ambiguity only

5. **@SumFunc**:
   - Replaces implementation - don't write code underneath
   - English description becomes the code

---

## Update Strategy

### Phase 1: Architecture Core (Most Critical)
1. architecture/02-lifecycle-scope.md
2. architecture/03-observability.md
3. architecture/04-state-ownership.md
4. architecture/05-patterns-overview.md
5. architecture/01-overview.md (add CA intro)

### Phase 2: Pattern Details
6. architecture/06-repositories.md
7. architecture/07-viewmodels.md
8. architecture/08-services.md
9. architecture/10-clean-architecture.md (NEW)

### Phase 3: Language & Data
10. language/07-annotations.md
11. data/01-json.md
12. data/02-databases.md
13. data/03-api-integration.md

### Phase 4: UI & Polish
14. ui/01-views.md
15. README.md (check references)
16. index.md (update descriptions if needed)

---

## Notes for Future Updates

- Keep examples consistent across all docs
- Use the same sample domain (Article/Author/User) for continuity
- Always show interface/implementation split for repositories, services, gateways
- Emphasize @Subscriber requirement in all reactive examples
- Show @LocalState only in view examples
- Include validation rules and weft.settings.json config where relevant

---

## Version Tracking

- **v0.2.0**: Old standalone annotations
- **v0.3.0**: New parameterized annotations + Clean Architecture alignment