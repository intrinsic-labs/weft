# Weft Project Memory

This folder contains living documentation to help maintain context across sessions. Think of this as a **persistent cache for thoughts and current state**, not an archive of historical changes.

---

## What is Weft?

**Weft is an interpretable pseudocode language for cross-platform development.** It sits between natural language specifications and executable code, allowing developers to write applications once in clear, structured pseudocode and generate idiomatic native code for Swift (iOS), Kotlin (Android), TypeScript (web), and other platforms.

### Core Philosophy

1. **Structured enough to parse, loose enough to be creative** - Flexible syntax that accommodates different coding styles
2. **Higher bandwidth per token** - Communicate more semantic meaning with less code
3. **Forces clear thinking** - Writing structured code helps design better systems
4. **Human + AI collaboration** - Humans focus on logic and intent, AI handles syntax translation
5. **Strictly typed** - Every variable, parameter, and return value has a defined type for clarity

### Project Goals

- **Enable Clean Architecture** - Built-in support for well-structured, maintainable applications
- **Native Performance** - Generates pure native code with no runtime overhead
- **No Lock-in** - Generated code is yours to keep and modify
- **Annotation-Driven Design** - Use semantic annotations to express architectural intent
- **LSP Support** - Real-time validation, dependency rule enforcement, and IDE integration

---

## Purpose of This Folder

**The `.memory/` folder is for active context that helps continue work in progress.**

### ✅ What Belongs Here

- **Current work state** - What we're in the middle of doing
- **Update plans** - What needs to be done next and why
- **Decision rationale** - Why we made specific design choices
- **Key concepts** - Important patterns and rules to maintain consistency
- **Context for AI assistants** - Information needed to pick up where we left off

### ❌ What Doesn't Belong Here

- **Historical changelogs** - Don't document every change that happened
- **Completed work archives** - Remove or update files once work is done
- **Duplicate documentation** - Don't copy what's already in the docs
- **Temporary notes** - Clean up when no longer relevant

### Guidelines

1. **Keep it current** - Update or delete files as work progresses
2. **Be concise** - Focus on what's needed to continue, not what happened
3. **Stay relevant** - If you wouldn't need it in a new session, remove it
4. **Think cache, not archive** - Optimize for quick context loading

---

## Current Project State

**Version**: 0.3.0  
**Current Focus**: Updating documentation to align with new Clean Architecture-based annotation system

### Recent Major Changes

- **Annotation System Redesign** - Moved from standalone annotations to parameterized forms that map to Clean Architecture layers
- **Role-Based Architecture** - 8 role annotations (entity, usecase, repository, service, viewmodel, gateway, dto, adapter)
- **State Management Refinement** - Explicit reactive relationships with @Publisher, @Subscriber, @LocalState
- **Clarified Documentation Annotations** - @Instruction for translation ambiguity only, @SumFunc replaces implementation

### Files in This Folder

- **`annotation-update-plan.md`** - Tracks which documentation files need updating and what changes are needed
- **`whats-changed.md`** - Quick reference for understanding the new annotation system (use for onboarding new sessions)
- **`README.md`** (this file) - Project overview and memory folder purpose

---

## For New Sessions

When starting a new session:

1. Read `whats-changed.md` for quick context on the annotation system
2. Check `annotation-update-plan.md` for current work status
3. Update these files as you make progress
4. Delete or consolidate information that's no longer needed

Remember: This is a tool for continuity, not a diary. Keep it lean and useful.