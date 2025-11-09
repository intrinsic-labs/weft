# Weft Documentation - Complete Index

This document provides a comprehensive index of all Weft documentation currently available in the project.

## Project Structure

```
weft/docs/
├── README.md                          # Main landing page and navigation
├── QUICK_REFERENCE.md                 # Quick reference guide
├── new-structure.md                   # Planned structure (reference)
│
├── getting-started/
│   └── 01-introduction.md             # What is Weft and why it exists
│
├── language/                          # Core language features
│   ├── 01-types.md                    # Primitives, collections, optionals
│   ├── 02-variables-enums.md          # Variable declarations, enum definitions
│   ├── 03-control-flow.md             # Conditionals, loops, switch statements
│   ├── 04-functions.md                # Function declarations, async/await, closures
│   ├── 05-operators.md                # Boolean, comparison, null safety operators
│   ├── 06-error-handling.md           # Try/catch, throwing errors, Result types
│   └── 07-annotations.md              # Language-level annotations
│
├── structure/                         # Code organization
│   ├── 01-definitions.md              # type, class, struct, data, object keywords
│   ├── 02-access-control.md           # public, private, protected, internal
│   ├── 03-scope.md                    # Braces vs indentation, semicolons
│   └── 04-imports.md                  # Module system and import syntax
│
├── architecture/                      # Design patterns and architecture
│   ├── 01-overview.md                 # Architecture philosophy and patterns
│   ├── 02-lifecycle-scope.md          # @Lifecycle annotations and scope management
│   ├── 03-observability.md            # Observability with @Publisher & @Subscriber
│   ├── 04-ui-state-ownership.md       # @LocalState, @Binding, state ownership in UI
│   ├── 05-roles-and-patterns.md       # Clean Architecture and @Role Annotations
│   ├── 06-dependency-injection.md     # Implicit dependency injection system
│   └── 07-full-example.md             # Full example of implementing Weft's architecture
│
├── ui/                                # User interface
│   ├── 00-overview.md                 # UI philosophy, flexibility, syntax freedom
│   ├── 01-views.md                    # View basics, state management, lifecycle
│   ├── 02-components.md               # Text, Image, Button, TextField, etc.
│   └── 03-navigation.md               # Stack navigation, modals, tabs, deep linking
│
├── data/                              # Data and persistence
│   ├── 01-json.md                     # JSON serialization and @JSON annotation
│   ├── 02-databases.md                # Database schemas and annotations
│   └── 03-api-integration.md          # API integration patterns
│
└── reference/                         # Reference documentation
    └── annotations.md                 # Complete annotation reference
```

## Getting Started

### Introduction
- **File**: `getting-started/01-introduction.md`
- **Content**: What is Weft, why it exists, core philosophy

## Language Fundamentals

### Types & Collections
- **File**: `language/01-types.md`
- **Content**: Primitives (string, int, float, bool), arrays, dictionaries, optionals, type inference

### Variables & Enums
- **File**: `language/02-variables-enums.md`
- **Content**: Variable declaration syntax (var/let), enum definitions with associated values

### Control Flow
- **File**: `language/03-control-flow.md`
- **Content**: Conditionals (if/else), loops (for, while), switch statements, pattern matching

### Functions
- **File**: `language/04-functions.md`
- **Content**: Function declarations, parameters, return types, async/await, closures, higher-order functions

### Operators
- **File**: `language/05-operators.md`
- **Content**: Boolean operators, comparison operators, null safety operators, arithmetic operators

### Error Handling
- **File**: `language/06-error-handling.md`
- **Content**: Try/catch/throw patterns, Result types, error propagation

### Annotations
- **File**: `language/07-annotations.md`
- **Content**: Language-level annotations (@Main, @Instruction, @SumFunc, @Index)

## Code Organization

### Definitions
- **File**: `structure/01-definitions.md`
- **Content**: Keywords (type, class, struct, data, object) and when to use each

### Access Control
- **File**: `structure/02-access-control.md`
- **Content**: Access modifiers (public, private, protected, internal)

### Scope
- **File**: `structure/03-scope.md`
- **Content**: Braces vs indentation, semicolons, parentheses, syntax flexibility

### Imports
- **File**: `structure/04-imports.md`
- **Content**: Module system, import syntax, namespace management

## Architecture & Patterns

### Overview
- **File**: `architecture/01-overview.md`
- **Content**: Architecture philosophy, why patterns matter, overview of Weft's approach

### Lifecycle & Scope
- **File**: `architecture/02-lifecycle-scope.md`
- **Content**: Scope annotations (@Singleton, @ViewScoped, @FeatureScoped, @SessionScoped), lifetime management

### Observability
- **File**: `architecture/03-observability.md`
- **Content**: @Observable pattern, reactive state, automatic UI updates

### State Ownership
- **File**: `architecture/04-ui-state-ownership.md`
- **Content**: @State (local state), @Binding (two-way state), @Environment (shared context)

### Patterns Overview
- **File**: `architecture/05-roles-and-patterns.md`
- **Content**: How Repositories, ViewModels, and Services work together

### Repository Pattern
- **File**: `architecture/06-repositories.md`
- **Content**: @Repository annotation, data layer implementation, caching, persistence

### ViewModel Pattern
- **File**: `architecture/07-viewmodels.md`
- **Content**: @ViewModel annotation, presentation logic, state management

### Service Pattern
- **File**: `architecture/08-services.md`
- **Content**: @Service annotation, business logic, utilities, shared functionality

### Dependency Injection
- **File**: `architecture/06-dependency-injection.md`
- **Content**: Implicit DI system, how dependencies are inferred and resolved

## User Interface

### UI Overview
- **File**: `ui/00-overview.md`
- **Content**: UI philosophy, syntax flexibility, inventing parameters, @Instruction usage, styling freedom

### Views
- **File**: `ui/01-views.md`
- **Content**: View keyword, properties, state management (@State, @Binding, @Environment), lifecycle hooks, computed properties

### Components
- **File**: `ui/02-components.md`
- **Content**: Layout containers (Column, Row, ZStack, ScrollView), text and images, interactive components (Button, TextField, Checkbox), lists, system components, platform-specific components

### Navigation
- **File**: `ui/03-navigation.md`
- **Content**: Stack navigation, modal presentation, tab navigation, deep linking, passing data between views

## Data & Persistence

### JSON
- **File**: `data/01-json.md`
- **Content**: @JSON annotation, automatic serialization, custom field names, nested types

### Databases
- **File**: `data/02-databases.md`
- **Content**: Database schemas, database annotations, entity relationships

### API Integration
- **File**: `data/03-api-integration.md`
- **Content**: Async patterns, error handling, DTOs, API client patterns

## Reference

### Annotations
- **File**: `reference/annotations.md`
- **Content**: Complete alphabetical reference of all annotations with examples

## Supporting Documentation

### Main README
- **File**: `README.md`
- **Content**: Project landing page, navigation hub, links to all sections

### Quick Reference
- **File**: `QUICK_REFERENCE.md`
- **Content**: Fast lookup reference for common patterns

---

## Documentation Statistics

**Total Files**: 29

**By Section**:
- Getting Started: 1 file
- Language: 7 files
- Structure: 4 files
- Architecture: 9 files
- UI: 4 files
- Data: 3 files
- Reference: 1 file

**Status**: Core documentation complete. All major language features, architecture patterns, and UI concepts are documented.

---

**Last Updated**: October 2025
