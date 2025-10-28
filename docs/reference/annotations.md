# Annotation Reference

Complete quick-reference table of all Weft annotations. Click through to detailed documentation.

---

## All Annotations

| Annotation | Category | Description | Documentation |
|------------|----------|-------------|---------------|
| **Language** |
| `@Main` | Entry Point | Marks application entry point | [Language: Annotations](../language/07-annotations.md#main) |
| `@Instruction` | Guidance | Provides translator guidance and clarification | [Language: Annotations](../language/07-annotations.md#instruction) |
| `@SumFunc` | Logic Summary | Summarizes function logic in plain English | [Language: Annotations](../language/07-annotations.md#sumfunc) |
| `@Index` | Documentation | Documents directory contents and structure | [Language: Annotations](../language/07-annotations.md#index) |
| **Architecture: Lifecycle** |
| `@Singleton` | Scope | Application lifetime - single shared instance | [Architecture: Lifecycle & Scope](../architecture/02-lifecycle-scope.md#singleton) |
| `@ViewScoped` | Scope | View lifetime - exists while view is visible | [Architecture: Lifecycle & Scope](../architecture/02-lifecycle-scope.md#viewscoped) |
| `@FeatureScoped` | Scope | Feature lifetime - exists during feature/flow | [Architecture: Lifecycle & Scope](../architecture/02-lifecycle-scope.md#featurescoped) |
| `@SessionScoped` | Scope | Session lifetime - exists from login to logout | [Architecture: Lifecycle & Scope](../architecture/02-lifecycle-scope.md#sessionscoped) |
| **Architecture: Patterns** |
| `@Observable` | Reactivity | Marks class with observable state for UI updates | [Architecture: Observability](../architecture/03-observability.md) |
| `@Repository` | Pattern | Marks data layer repository class | [Architecture: Repository Pattern](../architecture/06-repositories.md) |
| `@ViewModel` | Pattern | Marks presentation layer ViewModel class | [Architecture: ViewModel Pattern](../architecture/07-viewmodels.md) |
| `@Service` | Pattern | Marks business logic service class | [Architecture: Service Pattern](../architecture/08-services.md) |
| **State Management** |
| `@State` | State | Local state owned by current view/component | [Architecture: State Ownership](../architecture/04-state-ownership.md#state) |
| `@Binding` | State | Two-way binding to parent's state | [Architecture: State Ownership](../architecture/04-state-ownership.md#binding) |
| `@Environment` | State | App-wide or feature-wide shared context | [Architecture: State Ownership](../architecture/04-state-ownership.md#environment) |
| **Data: JSON** |
| `@JSON` | Serialization | Marks type for automatic JSON serialization | [Data: JSON](../data/01-json.md) |
| `@JSONKey` | Serialization | Customizes JSON field name mapping | [Data: JSON](../data/01-json.md#custom-field-names) |
| `@JSONIgnore` | Serialization | Excludes field from JSON serialization | [Data: JSON](../data/01-json.md#ignoring-fields) |
| `@JSONFormat` | Serialization | Specifies date/time format for JSON | [Data: JSON](../data/01-json.md#date--time-handling) |
| **Data: Database** |
| `@Schema` | Schema | Marks database schema/table definition | [Data: Databases](../data/02-databases.md#basic-schema) |
| `@Entity` | Schema | Alias for `@Schema` - marks database entity | [Data: Databases](../data/02-databases.md#basic-schema) |
| `@DatabaseModel` | Schema | Alias for `@Schema` - marks database model | [Data: Databases](../data/02-databases.md#basic-schema) |
| `@Id` | Field | Marks primary key field | [Data: Databases](../data/02-databases.md#primary-keys) |
| `@ForeignKey` | Field | Marks foreign key reference to another table | [Data: Databases](../data/02-databases.md#foreign-keys) |
| `@Reference` | Field | Alias for `@ForeignKey` | [Data: Databases](../data/02-databases.md#foreign-keys) |
| `@Relation` | Field | Alias for `@ForeignKey` | [Data: Databases](../data/02-databases.md#foreign-keys) |
| `@Index` | Field | Marks field for database indexing | [Data: Databases](../data/02-databases.md#indexes) |
| `@Unique` | Field | Marks field as unique constraint | [Data: Databases](../data/02-databases.md#unique-constraints) |
| `@Required` | Field | Marks field as required/non-null | [Data: Databases](../data/02-databases.md#required-fields) |
| `@Nullable` | Field | Marks field as allowing null values | [Data: Databases](../data/02-databases.md#optional-fields) |
| `@Optional` | Field | Alias for `@Nullable` | [Data: Databases](../data/02-databases.md#optional-fields) |
| `@Transient` | Field | Excludes field from database | [Data: Databases](../data/02-databases.md#excluding-fields) |
| `@Ignore` | Field | Alias for `@Transient` | [Data: Databases](../data/02-databases.md#excluding-fields) |
| `@NotField` | Field | Alias for `@Transient` | [Data: Databases](../data/02-databases.md#excluding-fields) |
| `@Exclude` | Field | Alias for `@Transient` | [Data: Databases](../data/02-databases.md#excluding-fields) |
| `@Migration` | Schema | Marks database migration with version | [Data: Databases](../data/02-databases.md#migrations) |

---

## Quick Examples

### Combining Architecture Annotations

```weft
@Observable
@Repository
@Singleton
class ArticleRepository {
    // Observable: state changes trigger UI updates
    // Repository: data layer pattern
    // Singleton: app-wide lifetime
}

@Observable
@ViewModel
@ViewScoped
class ArticleListViewModel {
    // Observable: state updates trigger view refreshes
    // ViewModel: presentation layer pattern
    // ViewScoped: created/destroyed with view
}
```

### Equivalent Database Annotations

These groups of annotations are interchangeable:

```weft
// Schema definition - all equivalent
@Schema / @Entity / @DatabaseModel

// Foreign key - all equivalent
@ForeignKey / @Reference / @Relation

// Nullable field - all equivalent
@Nullable / @Optional

// Exclude from database - all equivalent
@Transient / @Ignore / @NotField / @Exclude
```

### State Management Pattern

```weft
view ParentView {
    @State var searchText = ""
    
    SearchBar(query: $searchText)  // Pass binding with $
}

view SearchBar {
    @Binding var query: string     // Receive two-way binding
    @Environment var theme: Theme  // Access shared context
    
    TextField(binding: $query)
}
```

---

## See Also

- [Language: Annotations](../language/07-annotations.md) - Detailed language annotation docs
- [Architecture Overview](../architecture/01-overview.md) - Architecture patterns
- [State Ownership](../architecture/04-state-ownership.md) - State management patterns
- [Data: JSON](../data/01-json.md) - JSON serialization
- [Data: Databases](../data/02-databases.md) - Database schemas