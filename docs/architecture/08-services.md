# Service Pattern

Services provide business logic, utilities, and cross-cutting concerns. They handle operations that don't fit cleanly into repositories or ViewModels, like analytics, authentication, and validation.

## Purpose

A service encapsulates:
- Business rules and domain logic
- Stateless utility operations
- Cross-cutting concerns (analytics, logging, notifications)
- Integrations with external systems
- App-wide coordination

## Basic Service

**Note:** The `@Service` annotation explicitly marks this class as a service, communicating the business logic pattern to developers and translators.

```weft
@Service
@Singleton
class AnalyticsService {
    private var isEnabled: bool = true
    
    func trackEvent(name: string, properties: [string: any]) {
        @SumFunc
        => return early if analytics disabled
        => send event to analytics backend
        => log event for debugging
    }
    
    func trackScreenView(screenName: string) {
        trackEvent("screen_view", ["screen": screenName])
    }
}
```

## Key Characteristics

**Explicit Annotation**: Always use `@Service` to mark service classes. This communicates the pattern and helps with code organization.

**Singleton Scope**: Typically `@Singleton` for app-wide availability.

**Stateless Preferred**: Keep services stateless when possible for easier testing.

**Focused Purpose**: Each service handles one specific concern.

**Injected into ViewModels**: Services are used by ViewModels, not directly by views.

## Common Patterns

### Authentication Service

```weft
@Observable
@Service
@Singleton
class AuthService {
    private var api: APIClient
    private var storage: SecureStorage
    
    private(set) var currentUser: User? = null
    private(set) var isAuthenticated: bool = false
    
    func login(email: string, password: string) async throws {
        @SumFunc
        => call API with credentials
        => save auth token to secure storage
        => update current user and auth state
        => throw error if login fails
    }
    
    func logout() async {
        @SumFunc
        => clear auth token from storage
        => clear current user
        => set authenticated to false
        => navigate to login screen
    }
    
    func restoreSession() async {
        @SumFunc
        => load token from secure storage
        => fetch current user if token exists
        => update auth state silently
    }
}
```

### Validation Service

```weft
@Service
@Singleton
class ValidationService {
    func isValidEmail(email: string) => bool {
        return email.contains("@") && email.contains(".")
    }
    
    func isValidPassword(password: string) => bool {
        return password.length >= 8
    }
    
    func isValidUrl(url: string) => bool {
        @SumFunc
        => check if string matches URL pattern
        => return true if valid URL format
    }
}
```

### Notification Service

```weft
@Service
@Singleton
class NotificationService {
    private var hasPermission: bool = false
    
    func requestPermission() async {
        @SumFunc
        => request notification permission from OS
        => update hasPermission based on result
    }
    
    func scheduleNotification(title: string, body: string, date: datetime) {
        @SumFunc
        => return early if no permission
        => create notification with title and body
        => schedule for specified date
    }
    
    func cancelAll() {
        @SumFunc
        => cancel all pending notifications
    }
}
```

### Logging Service

```weft
@Service
@Singleton
class LoggingService {
    private var isDebugMode: bool = true
    
    func logError(error: Error, context: string) {
        @SumFunc
        => log error to console
        => send to remote logging service
        => include context and timestamp
    }
    
    func logInfo(message: string) {
        @SumFunc
        => return early if not debug mode
        => log info message to console
    }
    
    func logWarning(message: string) {
        @SumFunc
        => log warning to console
        => optionally send to remote service
    }
}
```

## Best Practices

**Keep Services Stateless**: Stateless services are easier to test and reason about.

```weft
// Good: Stateless service
@Service
@Singleton
class ValidationService {
    func isValidEmail(email: string) => bool {
        return email.contains("@")
    }
}

// Avoid: Unnecessary state
@Service
class ValidationService {
    private var lastValidatedEmail: string?  // Why store this?
}
```

**Single Responsibility**: Each service handles one concern.

```weft
// Good: Focused services
@Service class AnalyticsService { }
@Service class AuthService { }
@Service class ValidationService { }

// Avoid: Kitchen sink service
@Service class UtilityService { }  // Too broad
```

**Inject into ViewModels**: Services should be used by ViewModels, not views.

```weft
// Good: ViewModel uses service
@ViewModel
class ArticleListViewModel {
    private var analytics: AnalyticsService
    
    func selectArticle(id: string) {
        analytics.trackEvent("article_selected", ["id": id])
    }
}

// Avoid: View uses service directly
view ArticleListView {
    var analytics: AnalyticsService  // Should be in ViewModel
}
```

**Use for Cross-Cutting Concerns**: Things that span multiple features.

```weft
// Good: Cross-cutting concerns
@Service class AnalyticsService { }
@Service class LoggingService { }
@Service class NotificationService { }

// Avoid: Feature-specific logic
@Service class ArticleBusinessLogic { }  // Belongs in ViewModel or Repository
```

## Complete Example

```weft
@Observable
@Service
@Singleton
class AuthService {
    private var api: APIClient
    private var storage: SecureStorage
    private var analytics: AnalyticsService
    
    private(set) var currentUser: User? = null
    private(set) var isAuthenticated: bool = false
    private(set) var authToken: string? = null
    
    func login(email: string, password: string) async throws {
        @SumFunc
        => validate email format
        => call API with credentials
        => receive auth token and user data
        => save token to secure storage
        => update current user and auth state
        => track login event
        => throw error if login fails
    }
    
    func logout() async {
        analytics.trackEvent("logout", ["user_id": currentUser?.id ?? "unknown"])
        
        @SumFunc
        => clear auth token from storage
        => clear current user
        => set authenticated to false
        => navigate to login screen
    }
    
    func restoreSession() async {
        @SumFunc
        => load auth token from secure storage
        => if no token, return silently
        => fetch current user from API using token
        => update current user and auth state
        => if fetch fails, clear token and return
    }
    
    func updateProfile(user: User) async throws {
        @SumFunc
        => call API to update user profile
        => update current user on success
        => track profile update event
        => throw error on failure
    }
    
    func changePassword(oldPassword: string, newPassword: string) async throws {
        @SumFunc
        => validate new password meets requirements
        => call API with old and new passwords
        => logout and re-login on success
        => throw error on failure
    }
}
```

## Service Coordination

Services can depend on other services:

```weft
@Service
@Singleton
class UserAnalyticsService {
    private var analytics: AnalyticsService
    private var logging: LoggingService
    
    func trackUserAction(userId: string, action: string) {
        analytics.trackEvent("user_action", [
            "user_id": userId,
            "action": action
        ])
        
        logging.logInfo("User \(userId) performed \(action)")
    }
}
```

## See Also

- [Patterns Overview](05-patterns-overview.md) - How patterns work together
- [ViewModel Pattern](07-viewmodels.md) - Using services in ViewModels
- [Repository Pattern](06-repositories.md) - Difference between services and repositories
- [Lifecycle & Scope](02-lifecycle-scope.md) - Service scope and lifetime