# Weft Documentation

Welcome to the Weft documentation! This guide will help you understand and use Weft, an interpretable pseudocode language for cross-platform development.

## Table of Contents

1. **[Introduction](01-introduction.md)** - Start here
   - What is Weft?
   - Key benefits and philosophy
   - How it works

2. **[Types & Collections](02-types.md)**
   - Primitive types (string, int, bool, etc.)
   - Collections (arrays, dictionaries, sets)
   - Optionals
   - Mutability
   - Type system overview

3. **[Control Flow & Operators](03-control-flow.md)**
   - Conditionals (if/else/elif)
   - Loops (for/while)
   - Switch/match statements
   - Functions and async/await
   - Operators (boolean, comparison, null safety)
   - Error handling
   - Access modifiers and static members

4. **[Syntax](04-syntax.md)**
   - Value assignment (var/let/const)
   - Enums
   - Scope & definition keywords (type, class, struct, data, object)
   - Imports

5. **[Annotations](05-annotations.md)**
   - Core annotations (@Instruction, @SumFunc, @Index, @JSON)
   - Database annotations (@Schema, @Id, @ForeignKey, etc.)
   - State management annotations (see User Interface)

6. **[User Interface](06-user-interface.md)**
   - The `view` keyword
   - State management (@State, @Binding, @Observed, @Environment)
   - Lifecycle hooks
   - Parent-child state flow

## Quick Start

New to Weft? Follow this learning path:

1. Read the [Introduction](01-introduction.md) to understand what Weft is and why it exists
2. Learn about [Types & Collections](02-types.md) to understand Weft's type system
3. Study [Control Flow & Operators](03-control-flow.md) for conditional logic and loops
4. Explore [Annotations](04-annotations.md) to learn how to add context and intent
5. Review [Syntax](05-syntax.md) for variable declarations and type definitions
6. If building UI, dive into [User Interface](06-user-interface.md) for views and state management

## Philosophy

Weft is built on these principles:

- **Structured enough to parse, loose enough to be creative**
- **Higher bandwidth per token** - more meaning with less code
- **Forces clear thinking** - helps you design better systems
- **Human + AI collaboration** - humans focus on logic, AI handles syntax
- **Strictly typed** - clear intent through explicit types

## Community & Support

- [Read the original blog post](https://rocketbro.vercel.app/blog/weft)
- [Follow updates on X/Twitter](https://x.com/var_rocketbro)

## Contributing

Weft is in active development. Feedback, suggestions, and contributions are welcome!

---

**Version:** 0.1.1
**Last Updated:** 2025
