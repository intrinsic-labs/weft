# Weft: Structured Specification Language

## The Problem

You write detailed specs before you code. Thousands of lines describing types, behaviors, rules, constraints, and decisions. Markdown is easy to write but impossible to validate. By the time you're deep into implementation, your spec has contradictions you don't know about, references to things you renamed, and decisions you forgot you made.

Enterprise tools exist (DOORS, Jama) but cost $50k/year and require weeks of training. Formal methods exist (TLA+, Alloy) but have learning curves measured in months. There's nothing in the middle.

## The Solution

Weft is a specification language that combines the ease of markdown with the safety of type checking.

```weft
@Rule("verification-required", '''
All social features require `user.isVerified == true`.
No exceptions, including admin users.
''')

@Definition("verified-user", '''
A user who has completed email verification.
Represented by `User.isVerified == true`.
''')

type User {
    """
    Core identity in the system. Central to auth and social features.
    See: @Definition("verified-user")
    """
    id: string
    email: string
    isVerified: bool
}

@Implements("verification-required")
service Messaging {
    """
    Handles all user-to-user messaging.
    """

    @Precondition("sender.isVerified == true")
    sendMessage(sender: User, recipient: User, content: string) -> Message
}
```

As you write, the LSP validates:
- Referenced types exist (`User`, `Message`)
- Referenced rules exist (`@Implements("verification-required")`)
- Field references resolve (`sender.isVerified`)
- Cross-references are valid (`@Definition("verified-user")`)
- Architectural constraints are met (entities don't depend on adapters)

Your spec stays consistent as it grows.

---

## Value Proposition

**For solo developers and indie teams who write detailed specs before coding:**

Weft catches spec inconsistencies as you write, not after you've built the wrong thing.

| | Markdown | Weft | Enterprise Tools |
|--|----------|------|------------------|
| Learning curve | None | Hours | Weeks |
| Cost | Free | Free | $50k+/year |
| Validation | None | Real-time | Batch reports |
| Prose support | Native | Markdown inside | Clunky |
| AI-friendly | Sort of | Very | Varies |

**The pitch in one sentence:**

> Weft is markdown with type checking for your specs.

---

## Target Audience

### Primary: Solo Developers Building Complex Systems

- Working alone on ambitious projects
- Think carefully before coding
- Have been burned by "I thought I decided this already"
- Want structure but not bureaucracy

### Secondary: Small Indie Teams (2-5 people)

- Need shared source of truth
- Can't afford enterprise tooling
- Want to validate specs before implementation
- Collaborate asynchronously on design

### Not For

- Quick weekend projects (just use markdown)
- Teams with dedicated requirements engineers (use enterprise tools)
- Academic verification needs (use TLA+)

---

## Core Principles

### 1. Quick to Write

If it's slower than markdown, people won't use it. Weft should feel like writing code you already know.

- Syntax looks like TypeScript/Swift (familiar)
- Prose blocks are just markdown (no new formatting to learn)
- Annotations are optional (progressive complexity)
- Minimal ceremony for simple specs

**Test:** Can someone write their first Weft spec in 10 minutes with just a quick reference card?

### 2. Validates What Matters

Focus on catching real problems, not enforcing style.

- Broken references (types, fields, rules that don't exist)
- Orphaned definitions (rule exists but nothing implements it)
- Architectural violations (entity depends on adapter)
- Stale cross-references (renamed something, reference is now broken)

**Test:** Does every error the LSP reports represent a real spec problem?

### 3. Markdown Inside, Structure Outside

Don't reinvent prose. Let people write markdown where they need prose.

```weft
@Rule("data-retention", '''
## Data Retention Policy

All user data must be retained for **7 years** per compliance requirements.

### Affected Entities
- `User`
- `Transaction`
- `AuditLog`

### Implementation Notes
Use soft-delete pattern. See @Decision("soft-delete").
''')
```

**Test:** Can you paste existing markdown into a Weft prose block and have it just work?

### 4. AI-Native

Structured specs are dramatically easier for AI to reason about than free-form markdown.

- Annotations provide semantic context
- References are parseable, not buried in prose
- Rules and constraints are explicit and queryable
- Cross-references create a knowledge graph

**Test:** Can an AI consistency pass be 10x more effective on Weft than equivalent markdown?

---

## Key Features

### Must Have (MVP)

#### 1. Type System
Basic types, custom types, fields, optionals, collections.

```weft
type User {
    id: string
    email: string
    profile: UserProfile?
    roles: [Role]
}
```

#### 2. Docstrings (Triple-Quote Prose)
Markdown prose attached to any type, field, or function.

```weft
type Transaction {
    """
    Represents a financial transaction in the system.

    ## Invariants
    - `amount` is always in cents (integer) to avoid floating point
    - `status` follows state machine: pending -> processing -> complete|failed

    ## Related
    - @Rule("transaction-immutability")
    - @Definition("idempotency-key")
    """

    id: string
    amount: int
    status: TransactionStatus
}
```

#### 3. @Rule - Global Invariants
Rules that apply across the system. Can be referenced by @Implements.

```weft
@Rule("idempotency", '''
All write operations must be idempotent using client-provided idempotency keys.
Keys are valid for 24 hours. Duplicate requests within window return original response.
''')
```

#### 4. @Definition - Domain Glossary
Define terms used throughout. LSP validates references resolve.

```weft
@Definition("soft-delete", '''
Marking a record as deleted without physical removal.
Implemented via `deletedAt: datetime?` field on all entities.
All queries must filter `deletedAt == null` by default.
''')
```

#### 5. @Decision - Rationale Capture
Why things are the way they are. Links to code that implements the decision.

```weft
@Decision("use-cents", '''
Store all monetary amounts as integers (cents) rather than floats.

**Considered:**
- Float: simpler math, but floating point errors in financial calc
- Decimal: precise, but not all platforms support well
- Integer cents: universally supported, precise, explicit

**Chose integer cents** because cross-platform consistency matters more than API elegance.
''')
```

#### 6. @OpenQuestion - Unresolved Issues
Track what still needs decisions. LSP can generate report.

```weft
@OpenQuestion("rate-limiting-strategy", '''
How should we rate limit API endpoints?

**Options:**
1. Per-user token bucket
2. Per-endpoint sliding window
3. Tiered by subscription level

**Blocking:** API design, pricing model
**Decide by:** Sprint 4 planning
''')
```

#### 7. LSP with Real-Time Validation
The core value. Must validate as you type.

- Type reference resolution
- Rule/Definition reference resolution
- Field reference resolution in prose (`user.isVerified`)
- Orphan detection (defined but never referenced)
- Cross-file validation

#### 8. Editor Extensions (VSCode + Zed)
One-click install. Zero configuration. Just works on .weft files.

Both editors supported via the same LSP server:
- **VSCode**: Extension wraps LSP with syntax highlighting
- **Zed**: Extension points to LSP binary with language config

---

### Should Have (v1.1)

#### @Constraint - Non-Functional Requirements
Performance, security, availability requirements attached to specific things.

```weft
@Constraint(latency: "p99 < 100ms", security: "PII encrypted at rest")
service UserService { ... }
```

#### @Example / @Scenario - Concrete Cases
Illustrate behavior with specific inputs/outputs.

```weft
func calculateDiscount(cart: Cart, user: User) -> Money {
    @Example('''
    Given: cart.total = $100, user.tier = "gold"
    Then: discount = $15 (15% gold discount)
    ''')
}
```

#### @Assumption - Explicit Dependencies
Things you're assuming that might change.

```weft
@Assumption("single-timezone", '''
MVP assumes all users are in US Eastern timezone.
Affects: scheduling, notifications, reporting.
''')
```

#### Coverage Reports
CLI command: `weft coverage` - shows which types/functions lack docstrings, which rules are never implemented, which definitions are never referenced.

#### Export to Markdown
CLI command: `weft export --format=md` - generates readable markdown documentation from Weft specs. Useful for sharing with non-Weft users.

---

### Nice to Have (Future)

- @Risk - Known risks attached to components
- @Stakeholder - Who cares about this decision
- @Milestone - When this needs to be done
- Multiple file support with imports
- Diagram generation from type relationships
- Diff view for spec changes over time
- Integration with GitHub PR reviews

---

## Failure Points

### 1. Too Much Friction to Write

**Risk:** If Weft feels heavyweight compared to markdown, adoption dies.

**Symptoms:**
- Users start in Weft, switch back to markdown
- "I'll add the annotations later" (they won't)
- Specs are half-annotated, losing consistency value

**Mitigations:**
- Minimal syntax for simple cases (just types + docstrings)
- Annotations are always optional
- Quick reference card fits on one page
- Syntax highlighting makes structure obvious
- Snippets/autocomplete for common patterns

**Success metric:** New users write their first spec in <15 minutes.

---

### 2. LSP Doesn't "Just Work"

**Risk:** If installation is complex or validation is slow/buggy, trust erodes.

**Symptoms:**
- "I installed it but nothing happened"
- False positives that train users to ignore errors
- Lag when typing in large specs

**Mitigations:**
- VSCode extension is one-click install
- Zero configuration required
- Validation completes in <100ms for files up to 10k lines
- Error messages are clear and actionable
- Extensive testing before launch

**Success metric:** 90% of users successfully validate their first spec without asking for help.

---

### 3. Not Enough Value Over Markdown

**Risk:** Users try Weft, don't see enough benefit, go back to markdown.

**Symptoms:**
- "It's nice but not worth learning new syntax"
- The errors it catches aren't things that actually burned them
- AI consistency passes work "well enough" on markdown

**Mitigations:**
- Focus on the pain points that actually hurt: broken references, contradictory rules, stale decisions
- Make the value visible: "Weft caught 12 issues in your spec"
- Comparison mode: import markdown, show what Weft would catch
- Testimonials from real usage showing real catches

**Success metric:** Users report Weft caught issues that would have caused implementation bugs.

---

### 4. Scope Creep Back to Full Language

**Risk:** We keep adding features until Weft is a programming language again.

**Symptoms:**
- "Let's add control flow for validation rules"
- "We need computed properties"
- "What if we generated code from this?"

**Mitigations:**
- Hard rule: Weft never executes. It only validates structure.
- No function bodies (only signatures)
- No expressions (only declarations)
- Resist the code generation temptation
- Clear product boundary in this document

**Success metric:** Core feature set stays stable after v1.0.

---

## Success Criteria

### Launch (v1.0)

- [ ] Type system complete (types, fields, functions, signatures)
- [ ] Docstrings with markdown support
- [ ] @Rule, @Definition, @Decision, @OpenQuestion annotations
- [ ] LSP validates references in real-time
- [ ] VSCode extension works with one-click install
- [ ] Documentation: quick start, reference, examples
- [ ] 10 beta users have validated specs with Weft

### Traction (v1.1)

- [ ] 100+ active users
- [ ] Users report catching real spec issues
- [ ] Community feedback incorporated
- [ ] @Constraint, @Example, @Assumption added
- [ ] Coverage reports working
- [ ] Export to markdown working

### Sustainable (v2.0)

- [ ] 1000+ active users
- [ ] Clear differentiation from alternatives
- [ ] Stable core with minimal churn
- [ ] Extensions/plugins ecosystem emerging
- [ ] Revenue or sustainable funding model

---

## Non-Goals

To keep scope focused, Weft explicitly does NOT:

- **Generate code** - It validates specs, not produces output
- **Execute anything** - No runtime, no evaluation
- **Replace documentation** - It structures specs, not prose
- **Handle requirements management** - No workflow, approvals, or versioning
- **Compete with formal methods** - No mathematical proofs
- **Work for all team sizes** - Optimized for solo/indie, not enterprise

---

## Next Steps

1. **Validate the pivot** - Share this document, get feedback
2. **Design the grammar** - Formal syntax specification
3. **Build parser** - Start with core types and docstrings
4. **Build LSP** - Reference resolution first
5. **Build VSCode extension** - Minimal viable integration
6. **Beta with real specs** - Use on actual projects, find gaps
7. **Iterate** - Refine based on friction points

---

## Appendix: Comparison with Alternatives

### vs Markdown

| Aspect | Markdown | Weft |
|--------|----------|------|
| Learning curve | None | ~1 hour |
| Reference validation | No | Yes |
| Type checking | No | Yes |
| Rule consistency | No | Yes |
| AI reasoning | Unstructured | Structured |
| Prose support | Native | Markdown inside |

**When to use markdown:** Quick docs, simple specs, no consistency needs.

**When to use Weft:** Detailed specs, complex systems, multiple types with relationships.

### vs TypeScript Interfaces

| Aspect | TypeScript | Weft |
|--------|------------|------|
| Type definitions | Yes | Yes |
| Prose/docstrings | JSDoc | Native markdown |
| Global rules | No | @Rule |
| Decision capture | No | @Decision |
| Glossary | No | @Definition |
| Open questions | No | @OpenQuestion |
| Runs code | Yes | No |

**When to use TypeScript:** You're building a TypeScript app and types are the spec.

**When to use Weft:** Cross-platform specs, behavior documentation, decision tracking.

### vs TLA+

| Aspect | TLA+ | Weft |
|--------|------|------|
| Learning curve | Months | Hours |
| Mathematical rigor | Full | None |
| Behavioral verification | Yes | No |
| Reference checking | Limited | Full |
| Prose support | Minimal | Native markdown |
| Industry adoption | Niche | Targeting mainstream |

**When to use TLA+:** Critical systems, concurrent algorithms, need mathematical proof.

**When to use Weft:** Practical specs, type relationships, want structure without formalism.

---

*Last updated: 2026-02-07*
*Status: Draft - seeking feedback*
