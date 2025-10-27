# Weft

**Interpretable pseudocode for cross-platform development**

Weft is a structured, actionable metalanguage that sits between natural language specifications and executable code. Write your application once in clear, flexible pseudocode, and generate pure idiomatic Swift, Kotlin, TypeScript, or other target languages.

## Featured Project

Want to see Weft in action? Check out [Clearly Reformed in Weft](https://github.com/intrinsic-labs/clearly-reformed-weft), the first project to adopt Weft. The app targets iOS and Android and uses Weft as the baseline source of truth.

---

## Getting Started

**New to Weft?** Start here:

1. [Introduction](getting-started/01-introduction.md) - What is Weft and why does it exist?
2. [Quick Start](getting-started/02-quick-start.md) - Write your first Weft file *(coming soon)*
3. [Philosophy](getting-started/03-philosophy.md) - Core principles *(coming soon)*

---

## Documentation

### Language Fundamentals

Learn the core language features:

- [Types & Collections](language/01-types.md) - Primitives, arrays, dictionaries, optionals
- [Variables & Enums](language/02-variables-enums.md) - Variable declarations, enum definitions
- [Control Flow](language/03-control-flow.md) - Conditionals, loops, switch statements
- [Functions](language/04-functions.md) - Function declarations, async/await, closures
- [Operators](language/05-operators.md) - Boolean, comparison, null safety operators
- [Error Handling](language/06-error-handling.md) - Try/catch, throwing errors, Result types

### Code Organization

Organize your codebase effectively:

- [Definitions](structure/01-definitions.md) - `type`, `class`, `struct`, `data`, `object` keywords
- [Access Control](structure/02-access-control.md) - `public`, `private`, `protected`, `internal`
- [Scope](structure/03-scope.md) - Braces vs indentation, semicolons, parentheses
- [Imports](structure/04-imports.md) - Module system and import syntax

### Architecture & Patterns

Design scalable, maintainable applications:

- [Overview](architecture/01-overview.md) - Architecture philosophy and patterns
- [Observability](architecture/02-observability.md) - `@Observable` and reactive state
- [State Ownership](architecture/03-state-ownership.md) - `@State`, `@Binding`, `@Environment` *(coming soon)*
- [Lifecycle & Scope](architecture/04-lifecycle-scope.md) - `@Singleton`, `@ViewScoped`, `@FeatureScoped`
- [Repositories](architecture/05-repositories.md) - Data layer pattern *(coming soon)*
- [ViewModels](architecture/06-viewmodels.md) - Presentation layer pattern *(coming soon)*
- [Services](architecture/07-services.md) - Business logic pattern *(coming soon)*
- [Dependency Flow](architecture/08-dependency-flow.md) - How dependencies work *(coming soon)*
- [Complete Example](architecture/09-complete-example.md) - Full app architecture *(coming soon)*

### User Interface

Build user interfaces:

- [Views](ui/01-views.md) - View basics and state management *(coming soon)*
- [Components](ui/02-components.md) - Text, Image, Button, TextField *(coming soon)*
- [Layout](ui/03-layout.md) - Column, Row, ZStack, Spacer *(coming soon)*
- [Styling](ui/04-styling.md) - Appearance parameters and theming *(coming soon)*
- [Interaction](ui/05-interaction.md) - Gestures, taps, user input *(coming soon)*
- [Navigation](ui/06-navigation.md) - Navigation patterns and modals *(coming soon)*
- [Lifecycle Hooks](ui/07-lifecycle-hooks.md) - `onAppear`, `onDisappear`, `onChange` *(coming soon)*

### Data & Persistence

Work with data:

- [JSON](data/01-json.md) - Serialization and `@JSON` annotation *(coming soon)*
- [Databases](data/02-databases.md) - Schema definitions and database annotations *(coming soon)*
- [API Integration](data/03-api-integration.md) - Async patterns and error handling *(coming soon)*

### Reference

Complete references for quick lookup:

- [All Annotations](reference/annotations.md) - Complete annotation reference *(coming soon)*
- [All Types](reference/types.md) - Complete type reference *(coming soon)*
- [All Components](reference/components.md) - Complete UI component reference *(coming soon)*
- [All Keywords](reference/keywords.md) - Complete keyword reference *(coming soon)*

### Examples

See complete examples in action:

- [TODO App](examples/todo-app/) - Simple task management app *(coming soon)*
- [News Reader](examples/news-reader/) - Medium complexity app with API integration *(coming soon)*
- [Shopping Cart](examples/shopping-cart/) - Complex app with auth and payments *(coming soon)*

---

## Philosophy

Weft is built on these principles:

- **Structured enough to parse, loose enough to be creative** - Write in the syntax you're most comfortable with
- **Higher bandwidth per token** - Communicate more semantic meaning with less code
- **Forces clear thinking** - The act of writing structured code helps you design better systems
- **Human + AI collaboration** - Humans focus on logic and intent, AI handles syntax translation
- **Strictly typed** - Every variable, parameter, and return value has a defined type for clarity

## How It Works

1. **Write Weft code** - Define your application logic, data models, and UI in clear pseudocode
2. **Translate to native** - Use language models or human translators to generate idiomatic platform code
3. **Review and refine** - Stay in control by reviewing all generated code
4. **Ship native apps** - Deploy pure Swift for iOS, Kotlin for Android, TypeScript for web

## Key Benefits

- **Native Performance** - No bridge, no runtime overhead—just pure native code
- **Flexible Syntax** - Use syntax from whatever language you're most comfortable with
- **Clear Intent** - Annotations and structured flow communicate your reasoning, not just actions
- **Human-in-the-Loop** - You maintain control and understanding of your codebase
- **No Lock-in** - Generated code is yours—remove the Weft layer anytime

## Community & Support

- [Read the original blog post](https://rocketbro.vercel.app/blog/weft)
- [Follow updates on X/Twitter](https://x.com/var_rocketbro)
- [GitHub Repository](https://github.com/asherpope/weft)

## Contributing

Weft is in active development. Feedback, suggestions, and contributions are welcome!

---

**Version:** 0.2.0  
**Last Updated:** October 2025