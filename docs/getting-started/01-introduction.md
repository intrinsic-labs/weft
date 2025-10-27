# Introduction to Weft

## What is Weft?

Weft is an interpretable, non-rigid, cooperative pseudocode language designed for cross-platform development that allows generation of fully native implementations for iOS, Android, web, and desktop. Unlike traditional frameworks that use a runtime layer or bridge, Weft is **structured, actionable documentation** that translates into idiomatic native code for each target platform.

Think of Weft as a metalanguage that sits between natural language specifications and executable code. You write your application once in clear, flexible pseudocode, and then generate pure idiomatic Swift, Kotlin, TypeScript, or other target languages. The result: native performance everywhere, with no runtime dependencies.

Weft captures semantic concept and intent in source code form. It reads like a developer's thoughts, formalized enough that an implementer can act on them.

## Key Benefits

- **Native Performance**: No bridge, no runtime overhead — just pure native code
- **Flexible Syntax**: Use syntax from whatever language you're most comfortable with
- **Clear Intent**: Annotations and structured flow communicate your reasoning, not just actions
- **Human-in-the-Loop**: You maintain control and understanding of your codebase
- **No Lock-in**: Generated code is yours — remove the Weft layer anytime and maintain native codebases independently

Weft is perfect for solo developers and small teams who need native performance across multiple platforms but can't afford to maintain separate codebases from scratch.

## Philosophy

Weft is built on several core principles:

1. **Structured enough to parse, loose enough to be creative** - Write in the syntax you're most comfortable with
2. **Higher bandwidth per token** - Communicate more semantic meaning with less code
3. **Forces clear thinking** - The act of writing structured code helps you design better systems
4. **Human + AI collaboration** - Humans focus on logic and intent, AI handles syntax translation
5. **Strictly typed** - Every variable, parameter, and return value has a defined type for clarity

## How It Works

1. **Write Weft code** - Define your application logic, data models, and UI in clear pseudocode
2. **Translate to native** - Use language models or human translators to generate idiomatic platform code
3. **Review and refine** - Stay in control by reviewing all generated code
4. **Ship native apps** - Deploy pure Swift for iOS, Kotlin for Android, TypeScript for web

## Learn More

- [Read the original blog post](https://rocketbro.vercel.app/blog/weft)
- [View the project on GitHub](https://github.com/asherpope/weft)

## Documentation Structure

This documentation is organized into the following sections:

1. **Introduction** (you are here) - Overview and philosophy
2. **Control Flow & Operators** - Conditionals, loops, functions, operators
3. **Types & Collections** - Primitive types, arrays, dictionaries, sets
4. **Annotations** - Special annotations for intent and metadata
5. **Syntax** - Variables, enums, classes, structs, and more
6. **User Interface** - Views and state management

Start with the basics and work your way through, or jump to the section you need!