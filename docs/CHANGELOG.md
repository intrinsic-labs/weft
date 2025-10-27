# Weft Documentation Changelog

## Version 0.2.0 - October 2025

### Major Refactor: Phase 1 Complete

#### New Structure

Reorganized documentation from flat structure to organized folder hierarchy:

```
docs/
├── getting-started/    # Introduction and onboarding
├── language/          # Core language features
├── structure/         # Code organization
├── architecture/      # NEW - Design patterns and lifecycle
├── ui/                # User interface (to be populated)
├── data/              # Data and persistence (to be populated)
├── reference/         # Complete references (to be populated)
└── examples/          # Complete example apps (to be populated)
```

#### New Content

**Architecture Section (NEW)**
- `architecture/01-overview.md` - Architecture philosophy and patterns
- `architecture/02-observability.md` - `@Observable` pattern for reactive state
- `architecture/04-lifecycle-scope.md` - `@Singleton`, `@ViewScoped`, `@FeatureScoped`, `@SessionScoped`

**Language Section (Refactored & Expanded)**
- Reordered for better learning flow:
  - `language/01-types.md` - Type system (moved from old structure)
  - `language/02-variables-enums.md` - Variable declarations and enums (moved up - foundational)
  - `language/03-control-flow.md` - Conditionals, loops, switch (added supported keywords section)
  - `language/04-functions.md` - Functions, async/await, closures (added return type variants, throws keyword, closure in keyword)
  - `language/05-operators.md` - All operators (added natural language variants for comparison and arithmetic)
  - `language/06-error-handling.md` - Try/catch, throwing, Result types (added syntax overview section)
- Added multiple string interpolation styles: `\()`, `${}`, `{}`
- Added `throws` keyword for marking functions that can throw errors
- Added natural language operators: "is less than", "plus", "divided by", etc.
- Added closure `in` keyword support
- Clarified async context requirements (Task blocks)

**Structure Section (NEW)**
- `structure/01-definitions.md` - type, class, struct, data, object keywords
- `structure/02-access-control.md` - Access modifiers and encapsulation
- `structure/03-scope.md` - Braces vs indentation, semicolons
- `structure/04-imports.md` - Module system and imports

#### Key Changes

**Annotations**
- Changed `@Observed` → `@Observable` (more accurate naming)
  - `@Observable` marks classes that have observable state
  - Observation is implicit when using observable types
- Removed `@Inject` (dependencies inferred from context)
- Added lifecycle annotations: `@Singleton`, `@ViewScoped`, `@FeatureScoped`, `@SessionScoped`
- Added semantic annotations: `@Repository`, `@ViewModel`, `@Service`

**Language Features**
- Multiple return type syntaxes: `=>`, `:`, `->`, `returns`
- Multiple function keywords: `func`, `function`, `fn`, `def`
- Natural language operators for readability
- Multiple string interpolation styles
- `throws` keyword for error propagation
- Closure `in` keyword support

**Dependency Injection**
- Dependencies are declared as properties without annotation
- Scope annotations control lifetime
- Translator generates platform-specific DI based on context

**Documentation Structure**
- Organized by concern (language features, organization, architecture, UI, data)
- Progressive disclosure (beginner → intermediate → advanced)
- Clear learning path with "See Also" links
- Room for future growth without clutter

#### Migration Notes

**Breaking Changes**
- `@Observed` renamed to `@Observable`
- Applied to class definitions, not properties
- Observation is implicit based on type

**Old locations → New locations**
- `01-introduction.md` → `getting-started/01-introduction.md`
- `02-types.md` → `language/01-types.md`
- `03-control-flow.md` → Split across `language/03-06-*.md`
- `04-syntax.md` → Split into `language/02-variables-enums.md` and `structure/01-*.md`
- `05-annotations.md` → To be split across architecture, data, reference sections
- `06-user-interface.md` → To be split across `ui/` and `architecture/03-*.md`

#### Coming Soon (Phase 2)

- Complete architecture section (repositories, viewmodels, services, examples)
- State ownership documentation (`@State`, `@Binding`, `@Environment`)
- UI section (views, components, layouts, styling)
- Data section (JSON, databases, API integration)
- Reference section (complete annotation/type/component references)
- Example apps (TODO, news reader, shopping cart)

## Version 0.1.1 - 2025

Initial documentation release with flat structure.

---

**Note:** This changelog documents the documentation changes, not language changes. Weft is still in active development.