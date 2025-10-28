# UI Components Reference

First-party Weft UI components. Remember: you can invent beyond this list—these are just the baseline.

## Layout Containers

### Column

Vertical stack of views.

```weft
Column(spacing: 16, padding: 20) {
    Text("First")
    Text("Second")
    Text("Third")
}

// Scrollable
Column(isScrollable: true, spacing: 8) {
    for item in items {
        ItemView(item: item)
    }
}
```

**Common parameters:** `spacing`, `padding`, `alignment`, `isScrollable`, `backgroundColor`, `cornerRadius`

### Row

Horizontal stack of views.

```weft
Row(spacing: 12, alignment: center) {
    Image(icon)
    Text("Label")
    Spacer()
    Text("Value")
}
```

**Common parameters:** `spacing`, `padding`, `alignment`, `verticalAlignment`, `horizontalAlignment`

### ZStack

Layered views (z-axis stacking). Later views appear on top.

```weft
ZStack {
    Image(background) { blur: 20 }
    Image(foreground) { width: 200, height: 200 }
    Text("Overlay") { textColor: white }
}
```

**Common parameters:** `alignment`, `width`, `height`

### ScrollView

Explicit scrollable container.

```weft
ScrollView(axis: vertical) {
    Column(spacing: 16) {
        for item in items { ItemCard(item) }
    }
}

// Horizontal scrolling
ScrollView(axis: horizontal) {
    Row(spacing: 12) {
        for photo in photos { Image(photo) }
    }
}
```

**Common parameters:** `axis`, `showsIndicator`, `refreshable`

### Spacer

Flexible space filler between elements.

```weft
Row {
    Text("Left")
    Spacer()
    Text("Right")
}
```

**Common parameters:** `minLength`

## Text & Typography

### Text

Display text with styling.

```weft
Text("Hello World")

Text("Styled") {
    font: h1
    textColor: blue
    fontWeight: bold
}

Text(user.name) {
    font: body
    fontSize: 16
    lineSpacing: 1.4
    maxLines: 2
    ellipsize: end
}
```

**Common parameters:** `font`, `fontSize`, `fontWeight`, `textColor`, `alignment`, `lineSpacing`, `maxLines`, `ellipsize`, `letterSpacing`, `textTransform`

**Font values:** `h1`, `h2`, `h3`, `h4`, `body`, `caption`, `small`

## Images

### Image

Display static images.

```weft
Image(photo)

Image(avatar) {
    width: 100
    height: 100
    scaleType: centerCrop
    clipShape: circle
    border: 2px solid white
}

Image(banner) {
    width: full
    height: 200
    scaleType: aspectFill
    cornerRadius: 12
}
```

**Common parameters:** `width`, `height`, `scaleType`, `contentMode`, `clipShape`, `cornerRadius`, `border`, `blur`, `saturation`, `brightness`, `opacity`

**Scale types:** `centerCrop`, `fit`, `fill`, `aspectFit`, `aspectFill`

**Clip shapes:** `circle`, `rectangle`, `roundedRectangle`, `capsule`

### AsyncImage

Load remote images with loading/error states.

```weft
AsyncImage(url: article.imageUrl)

AsyncImage(url: photo.url) {
    width: 300
    height: 200
    placeholder: Image(placeholderIcon)
    errorImage: Image(errorIcon)
    scaleType: centerCrop
}
```

**Common parameters:** Same as `Image`, plus `placeholder`, `errorImage`, `url`

## Interactive Components

### Button

Tappable button with action.

```weft
Button(action: { count += 1 }) {
    text: "Increment"
}

Button(onClick: save) {
    text: "Save"
    icon: Icons.save
    backgroundColor: theme.primary
    textColor: white
    cornerRadius: 8
    padding: 16
}

// Style variants
Button(action: delete) {
    text: "Delete"
    style: destructive
}
```

**Common parameters:** `action`/`onClick`, `text`, `icon`, `style`, `isDisabled`, `backgroundColor`, `textColor`, `cornerRadius`, `padding`

**Style values:** `filled`, `outlined`, `text`, `destructive`

### TextField

Text input field with binding.

```weft
TextField(binding: $username)

TextField(binding: $email) {
    placeholder: "Email address"
    keyboardType: email
    autocorrect: false
}

TextField(binding: $password) {
    placeholder: "Password"
    isSecure: true
}
```

**Common parameters:** `binding`, `placeholder`, `keyboardType`, `isSecure`, `autocorrect`, `maxLength`, `multiline`

**Keyboard types:** `default`, `email`, `number`, `phone`, `url`

### Checkbox

Toggle checkbox with binding.

```weft
Checkbox(isChecked: $agreed)

Checkbox(isChecked: $termsAccepted) {
    label: "I agree to terms"
}
```

**Common parameters:** `isChecked`, `label`, `onToggle`

### Toggle

Toggle switch with binding.

```weft
Toggle(isOn: $isDarkMode)

Toggle(isOn: $notificationsEnabled) {
    label: "Enable Notifications"
}
```

**Common parameters:** `isOn`, `label`, `onToggle`

## Visual Elements

### Divider

Visual separator line.

```weft
Divider()

Divider {
    color: gray
    thickness: 1
    margin: 16
}

// Vertical divider
Divider(axis: vertical) {
    height: 40
}
```

**Common parameters:** `axis`, `color`, `thickness`, `margin`

### ProgressBar

Progress indicator.

```weft
ProgressBar(progress: 0.75)

ProgressBar(progress: downloadProgress) {
    color: theme.accent
    height: 8
    cornerRadius: 4
}
```

**Common parameters:** `progress`, `color`, `height`, `backgroundColor`, `cornerRadius`

### LoadingSpinner

Activity indicator.

```weft
LoadingSpinner()

LoadingSpinner {
    size: large
    color: theme.primary
}
```

**Common parameters:** `size`, `color`

**Size values:** `small`, `medium`, `large`

### Icon

Display icons from system icon sets.

```weft
Icon(name: "star")

Icon(name: "heart") {
    size: 24
    color: red
}

Icon(Icons.bookmark) {
    size: 20
    color: theme.accent
}
```

**Common parameters:** `name`, `size`, `color`

## Lists & Collections

### List

Optimized list rendering for large collections.

```weft
List(items: articles) { article in
    ArticleCard(article: article)
}

List(items: users, spacing: 8) { user in
    UserRow(user: user)
}
```

**Common parameters:** `items`, `spacing`, `onRefresh`, `emptyView`

### LazyColumn / LazyRow

Lazy-loaded vertical or horizontal list.

```weft
LazyColumn(spacing: 12) {
    for article in articles {
        ArticleCard(article: article)
    }
}

LazyRow(spacing: 8) {
    for category in categories {
        CategoryChip(category: category)
    }
}
```

**Common parameters:** `spacing`, `padding`, `alignment`

### Grid

Grid layout for items.

```weft
Grid(columns: 3, spacing: 8) {
    for photo in photos {
        Image(photo) {
            width: 100
            height: 100
        }
    }
}
```

**Common parameters:** `columns`, `spacing`, `padding`

## System Components

Reference system-level components freely. The translator will map to native equivalents.

### DatePicker

```weft
DatePicker(selection: $selectedDate) {
    label: "Choose Date"
    mode: date
}
```

### TimePicker

```weft
TimePicker(selection: $selectedTime) {
    label: "Choose Time"
}
```

### Picker / Dropdown

```weft
Picker(selection: $selectedOption) {
    label: "Choose Option"
    options: ["Option A", "Option B", "Option C"]
}
```

### ColorPicker

```weft
ColorPicker(selection: $selectedColor) {
    label: "Theme Color"
}
```

### Slider

```weft
Slider(value: $volume, range: 0...100)

Slider(value: $brightness) {
    minimum: 0
    maximum: 1
    step: 0.1
}
```

### Alert / Dialog

```weft
Alert(
    title: "Delete Item?",
    message: "This action cannot be undone",
    primaryAction: { confirmDelete() },
    secondaryAction: { dismiss() }
)
```

### Sheet / Modal

```weft
Sheet(isPresented: $showingSheet) {
    SettingsView()
}
```

## Platform-Specific Components

When you need platform-specific UI, reference it directly:

```weft
// Video player
NativeVideoPlayer(url: videoUrl) {
    controls: true
    autoplay: false
}

// Map view
NativeMapView(center: coordinates) {
    zoom: 15
    showsUserLocation: true
}

// Web view
WebView(url: websiteUrl) {
    allowsNavigation: true
}

// Camera
CameraView(onCapture: handlePhoto)

// QR Scanner
QRScannerView(onScan: handleQRCode)
```

The translator will map these to platform equivalents (AVPlayerViewController, MapKit, Google Maps, WebView, Camera APIs, etc.).

## Custom Components

Create reusable components by defining views:

```weft
view Card {
    var content: View

    Column {
        padding: 16
        backgroundColor: white
        cornerRadius: 12
        shadow: medium

        content
    }
}

// Usage
Card {
    Text("Card content goes here")
}
```

## Styling Parameters

All components accept common styling parameters:

**Layout:** `width`, `height`, `padding`, `margin`, `alignment`

**Visual:** `backgroundColor`, `borderColor`, `borderWidth`, `cornerRadius`, `shadow`, `opacity`

**Interaction:** `onTap`, `onClick`, `onLongPress`, `isDisabled`, `isHidden`

See [UI Overview](00-overview.md) for more on the flexible styling system.

## See Also

- [UI Overview](00-overview.md) - Flexibility and principles
- [Views](01-views.md) - View structure and state management
- [Navigation](03-navigation.md) - Navigation patterns
