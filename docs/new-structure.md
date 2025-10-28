weft/docs/
├── README.md                          # Landing + navigation
│
├── getting-started/
│   ├── 01-introduction.md            # What & why (current intro)
│   ├── 02-quick-start.md             # 5-minute first file
│   └── 03-philosophy.md              # Core principles
│
├── language/                          # Core language features
│   ├── 01-types.md                   # Primitives, collections, optionals
│   ├── 02-control-flow.md            # If, loops, switch
│   ├── 03-functions.md               # Functions, async/await
│   ├── 04-operators.md               # Boolean, comparison, null safety
│   ├── 05-error-handling.md          # Try/catch/throw
│   └── 06-variables-enums.md         # var/let, enum syntax
│
├── structure/                         # Code organization
│   ├── 01-definitions.md             # type, class, struct, data, object
│   ├── 02-access-control.md          # public, private, etc.
│   ├── 03-scope.md                   # Braces vs indentation
│   └── 04-imports.md                 # Import system
│
├── architecture/                      # NEW - Design patterns
│   ├── 01-overview.md                # Why architecture matters
│   ├── 02-observability.md           # @Observable pattern
│   ├── 03-state-ownership.md         # @State, @Binding, @Environment
│   ├── 04-lifecycle-scope.md         # @Singleton, @ViewScoped, etc.
│   ├── 05-repositories.md            # @Repository + pattern
│   ├── 06-viewmodels.md              # @ViewModel + pattern
│   ├── 07-services.md                # @Service + pattern
│   ├── 08-dependency-flow.md         # How dependencies work
│   └── 09-complete-example.md        # Full Repository→ViewModel→View
│
├── ui/                                # User interface
│   ├── 01-views.md                   # view keyword, basics
│   ├── 02-components.md              # Text, Image, Button, etc.
│   ├── 03-layout.md                  # Column, Row, ZStack
│   ├── 04-styling.md                 # Parameters, appearance
│   ├── 05-interaction.md             # onTap, gestures
│   ├── 06-navigation.md              # navigateTo, modals
│   └── 07-lifecycle-hooks.md         # onAppear, onDisappear, onChange
│
├── data/                              # Data & persistence
│   ├── 01-json.md                    # @JSON, serialization
│   ├── 02-databases.md               # @Schema, @Id, @ForeignKey
│   └── 03-api-integration.md         # Async, error handling, DTOs
│
├── reference/                         # Complete references
│   ├── annotations.md                # Every annotation alphabetically
│   ├── types.md                      # Every type reference
│   ├── components.md                 # Every UI component
│   └── keywords.md                   # Every keyword
│
├── guides/                            # How-to guides
│   ├── state-management-guide.md     # Deep dive on state
│   ├── testing-patterns.md           # How to write testable Weft
│   ├── translation-guide.md          # For translators/LLMs
│   └── lsp-features.md               # LSP capabilities
│
└── examples/                          # Complete examples
    ├── todo-app/
    │   ├── README.md
    │   ├── models.weft
    │   ├── repository.weft
    │   ├── viewmodel.weft
    │   └── views.weft
    ├── news-reader/
    └── shopping-cart/
