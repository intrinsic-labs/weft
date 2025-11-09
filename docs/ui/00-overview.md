# User Interface Overview

Weft's UI system is **intentionally loose and flexible**. Unlike traditional frameworks with rigid APIs, Weft prioritizes **clear intent over strict syntax**. If your meaning is obvious, it will translate correctly.

## Core Principles

### 1. Invent What You Need

You don't need to memorize a Weft UI API. If a parameter name clearly expresses what you want, use it:

```weft
Image(profilePhoto) {
    cornerRadius: 50
    border: 2px solid
    borderColor: theme.accent
    shadow: medium
    grayscale: 50%
}
```

The translator will map these to platform-appropriate code—SwiftUI modifiers, Compose parameters, CSS properties, etc.

### 2. Multiple Syntax Styles

Write in whatever style feels natural. Weft accepts syntax from Swift, Kotlin, TypeScript, and more:

```weft
// Swift-style
Button(action: { count += 1 }) {
    text: "Increment"
}

// Kotlin-style
Button(
    onClick = { count += 1 },
    text = "Increment"
)

// React-style
Button({
    onClick: () => count += 1,
    text: "Increment"
})

// Mix and match
Button(onClick: { count += 1 }) {
    text: "Increment"
    backgroundColor: blue
}
```

All of these are valid. Choose what's comfortable.

### 3. Parameters: Parentheses or Trailing Closure

Both work. Use parentheses for quick params, trailing closure for complex styling:

```weft
// Parentheses only
Column(spacing: 16, padding: 20, isScrollable: true)

// Trailing closure only
Column {
    spacing: 16
    padding: 20
    isScrollable: true
}

// Mix both
Column(spacing: 16, isScrollable: true) {
    padding: 20
    backgroundColor: white
    cornerRadius: 12
}
```

### 4. Reference System Components Freely

Don't worry if a system level/native UI component doesn't "officially" exist in Weft. Reference what you need:

```weft
view VideoPlayer {
    var url: string

    NativeVideoPlayer(url: url) {
        controls: true
        autoplay: false
        looping: false
    }
}

view MapView {
    var coordinates: LatLng

    NativeMapView(center: coordinates) {
        zoom: 15
        showsUserLocation: true
        mapType: satellite
    }
}
```

The translator will map to the platform's native video player, map view, etc.

### 5. Use @Instruction for Clarity

When intent might be ambiguous, add an `@Instruction` annotation:

```weft
ZStack {
    @Instruction('''
    The background image should blur dramatically to create
    a frosted glass effect, with the sharp foreground image
    centered and elevated with a prominent shadow
    ''')

    Image(background) {
        blur: 40
        brightness: 1.2
    }

    Image(foreground) {
        width: 300
        height: 300
        shadow: large
    }
}
```

## What Weft Provides

Weft does provide some first-party components and patterns:

**Layout Containers**
- `Column` - vertical stack
- `Row` - horizontal stack
- `ZStack` - layered/overlapping views
- `ScrollView` - scrollable container

**Basic Components**
- `Text` - labels and text
- `Image` - static images
- `AsyncImage` - remote images with loading
- `Button` - interactive buttons
- `TextField` - text input
- `Divider` - separator lines

**Patterns**
- State management: `@LocalState`, `@Binding`, `@Subscriber`
- Lifecycle hooks: `onAppear`, `onDisappear`, `onChange`
- Control flow: `if`, `for`, conditionals
- Navigation: `navigateTo()`, `popView()`, `presentModal()`

But this is a **baseline, not a limit**. Extend as needed.

## Styling Philosophy

### Self-Documenting Parameters

If the parameter name makes its purpose obvious, use it:

```weft
Text("Headline") {
    font: h1
    fontWeight: bold
    textColor: black
    letterSpacing: 1.2
    textTransform: uppercase
}

Image(thumbnail) {
    width: 100
    height: 100
    scaleType: centerCrop
    clipShape: circle
    border: 2px
    borderColor: white
    shadow: md
}

Column {
    backgroundColor: white
    cornerRadius: 16
    padding: 20
    margin: 16
    shadow: large
    elevation: 8
    opacity: 0.95
}
```

### Common Parameter Categories

**Layout & Spacing**
```weft
width, height, padding, margin, spacing
alignment, verticalAlignment, horizontalAlignment
```

**Visual Styling**
```weft
backgroundColor, borderColor, textColor
cornerRadius, border, shadow, opacity
```

**Typography**
```weft
font, fontSize, fontWeight, lineHeight
textAlign, letterSpacing, textTransform
```

**Images**
```weft
scaleType, contentMode, clipShape
blur, saturation, brightness, contrast
```

**Interaction**
```weft
onTap, onClick, onLongPress, onSwipe
isDisabled, isHidden, isScrollable
```

## Flexibility in Practice

### Example: Card Component

Here are multiple valid ways to write the same card:

```weft
// Swift-style
Card {
    Image(photo) {
        width: full
        height: 200
        scaleType: centerCrop
    }

    Text(title) {
        font: h2
        padding: 16
    }
}

// Kotlin-style
Card(
    elevation = 4,
    cornerRadius = 12,
    padding = 16
) {
    Image(photo, scaleType = ScaleType.CenterCrop) {
        width: full
        height: 200
    }

    Text(text = title, style = h2)
}

// Custom component - defined elsewhere and imported
FancyCard(
    image: photo,
    title: title,
    elevation: medium,
    style: rounded
)

// All valid - choose what communicates best
```

### Example: Mixing Styles

```weft
view ArticleCard {
    var article: Article
    @LocalState var isBookmarked = false  // Swift-style initialization

    Column(onClick: () => navigateTo(DetailView(article))) {  // React-style
        AsyncImage(article.coverImage) {  // Swift-style
            width: full
            height: 200
            contentMode: aspectFill
        }

        VStack(spacing = 8, padding = 16) {  // Mix of styles
            Text(article.title, fontSize: 18, fontWeight: .bold)
            Text(article.excerpt, maxLines: 3)
        }

        Row {
            Spacer()
            IconButton(
                icon: isBookmarked ? Icons.bookmarkFilled : Icons.bookmark,
                onClick: { isBookmarked.toggle() }
            )
        }
    }
}
```

## Translation Examples

The same Weft code translates idiomatically to each platform:

**Weft:**
```weft
Column(spacing: 16, padding: 20) {
    Text("Hello") {
        font: h1
        textColor: blue
    }

    Button(onClick: { count += 1 }) {
        text: "Tap"
    }
}
```

**SwiftUI:**
```swift
VStack(spacing: 16) {
    Text("Hello")
        .font(.largeTitle)
        .foregroundColor(.blue)

    Button("Tap") {
        count += 1
    }
}
.padding(20)
```

**Jetpack Compose:**
```kotlin
Column(
    modifier = Modifier.padding(20.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp)
) {
    Text(
        text = "Hello",
        style = MaterialTheme.typography.h1,
        color = Color.Blue
    )

    Button(onClick = { count += 1 }) {
        Text("Tap")
    }
}
```

**React:**
```typescript
<div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <h1 style={{ color: 'blue' }}>Hello</h1>
    <button onClick={() => setCount(count + 1)}>Tap</button>
</div>
```

## When to Use @Instruction

Use `@Instruction` when:

**1. Complex animations or transitions**
```weft
@Instruction('''
Animate the card with a spring animation when it appears,
starting slightly below and fading in
''')
Column { /* ... */ }
```

**2. Platform-specific behavior**
```weft
@Instruction('''
On iOS, use a native sheet presentation.
On Android, use a bottom sheet with drag-to-dismiss.
On web, use a centered modal dialog.
''')
presentModal(ShareView())
```

**3. Ambiguous visual effects**
```weft
@Instruction('''
Create a glassmorphism effect with blur, slight transparency,
and a subtle border that adapts to light/dark mode
''')
Column {
    blur: 20
    opacity: 0.8
    border: 1px
}
```

**4. Complex gestures**
```weft
@Instruction('''
Support pinch-to-zoom, double-tap to zoom to fit,
and drag to pan the image
''')
GestureArea {
    Image(photo)
}
```

## Best Practices

**Do: Express clear intent**
```weft
Button {
    text: "Delete Account"
    style: destructive
    confirmationDialog: "Are you sure?"
}
```

**Don't: Be overly vague**
```weft
// Bad - too ambiguous
Button {
    look: fancy
    behavior: nice
}
```

**Do: Use familiar patterns**
```weft
// Developers know what this means
Image(avatar) {
    clipShape: circle
    border: 2px solid white
    shadow: medium
}
```

**Do: Invent when needed**
```weft
// Clear intent, even if not "official" API
ProgressRing {
    progress: 0.75
    strokeWidth: 8
    color: theme.accent
    showPercentage: true
}
```

**Do: Mix styles naturally**
```weft
// Whatever reads best for the situation
Row(alignment: .center, spacing = 12) {
    Icon(name: "star", size: 20, color = yellow)
    Text(rating.toString(), fontWeight: .bold)
}
```

## See Also

- [Views](01-views.md) - View basics and state management
- [Components](02-components.md) - Common UI components
- [Layout](03-layout.md) - Layout patterns
- [Styling](04-styling.md) - Styling approaches
