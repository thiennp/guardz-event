# Guardz Event API Documentation

## Overview

Guardz Event provides multiple API patterns for safe event handling with runtime validation. The library offers both ergonomic callback-based APIs and legacy result-based APIs to accommodate different use cases and preferences.

## API Patterns

### 🎯 **Pattern 1: Ergonomic Event Listeners (Recommended)**

The ergonomic API provides a clean, callback-based interface that eliminates the need for manual result handling.

#### Core Functions

- `safePostMessageListener<T>(guard, config)` - Safe PostMessage handling
- `safeWebSocketListener<T>(guard, config)` - Safe WebSocket handling  
- `safeDOMEventListener<T>(guard, config)` - Safe DOM event handling
- `safeEventSourceListener<T>(guard, config)` - Safe EventSource handling
- `safeCustomEventListener<T>(guard, config)` - Safe custom event handling
- `safeStorageEventListener<T>(guard, config)` - Safe storage event handling

#### Configuration Interface

```typescript
interface ErgonomicEventListenerConfig<T> {
  /** Enable tolerance mode (default: false) */
  tolerance?: boolean;
  /** Allowed origins for security validation */
  allowedOrigins?: string[];
  /** Allowed sources for security validation */
  allowedSources?: string[];
  /** Callback for type mismatch errors */
  onTypeMismatch?: (errorMessage: string) => void;
  /** Callback for security violations */
  onSecurityViolation?: (origin: string, message: string) => void;
  /** Callback for other errors */
  onError?: (error: string, context: ErrorContext) => void;
  /** Required: Success callback with validated data */
  onSuccess: (data: T) => void;
}
```

#### Usage Examples

**PostMessage with Security Validation:**
```typescript
import { safePostMessageListener } from 'guardz-event';
import { isType, isString, isNumber, isBoolean } from 'guardz';

interface UserMessage {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

const isUserMessage = isType<UserMessage>({
  id: isNumber,
  name: isString,
  email: isString,
  isActive: isBoolean,
});

const safeMessageHandler = safePostMessageListener(
  isUserMessage,
  {
    allowedOrigins: ['https://trusted-domain.com'],
    tolerance: false,
    onSuccess: (data: UserMessage) => {
      console.log('✅ Valid message:', data);
      // Handle validated data
    },
    onTypeMismatch: (errorMessage: string) => {
      console.warn('⚠️  Type validation failed:', errorMessage);
    },
    onSecurityViolation: (origin: string, message: string) => {
      console.error('🚫 Security violation from', origin, ':', message);
    }
  }
);

// Direct assignment - no manual result handling!
window.addEventListener('message', safeMessageHandler);
```

**WebSocket with Tolerance Mode:**
```typescript
import { safeWebSocketListener } from 'guardz-event';

const safeWSHandler = safeWebSocketListener(
  isStockUpdate,
  {
    tolerance: true, // Allow partial data
    onSuccess: (data: StockUpdate) => {
      updateStockDisplay(data);
    },
    onTypeMismatch: (errorMessage: string) => {
      console.warn('⚠️  Data warning:', errorMessage);
    }
  }
);

ws.addEventListener('message', safeWSHandler);
```

**DOM Events:**
```typescript
import { safeDOMEventListener } from 'guardz-event';

const safeClickHandler = safeDOMEventListener(
  isClickData,
  {
    tolerance: false,
    onSuccess: (data: ClickData) => {
      handleUserClick(data);
    },
    onTypeMismatch: (errorMessage: string) => {
      console.warn('⚠️  Click data error:', errorMessage);
    }
  }
);

button.addEventListener('click', safeClickHandler);
```

### 🔄 **Pattern 2: Legacy Result-based API**

The legacy API returns result objects that require manual handling.

#### Core Functions

- `safePostMessage<T>(config)` - Safe PostMessage handling
- `safeWebSocket<T>(config)` - Safe WebSocket handling
- `safeDOMEvent<T>(config)` - Safe DOM event handling
- `safeEventSource<T>(config)` - Safe EventSource handling
- `safeCustomEvent<T>(config)` - Safe custom event handling
- `safeStorageEvent<T>(config)` - Safe storage event handling

#### Configuration Interface

```typescript
interface SafeEventConfig<T> {
  /** Type guard function to validate event data */
  guard: TypeGuardFn<T>;
  /** Enable tolerance mode (default: false) */
  tolerance?: boolean;
  /** Identifier for error context (default: event type) */
  identifier?: string;
  /** Error callback - only used in tolerance mode */
  onError?: (error: string, context: ErrorContext) => void;
  /** Validate event structure */
  validateEvent?: boolean;
  /** Timeout in milliseconds for async operations */
  timeout?: number;
  /** Allowed origins for security validation */
  allowedOrigins?: string[];
  /** Allowed sources for security validation */
  allowedSources?: string[];
}
```

#### Result Type

```typescript
type EventResult<T> = 
  | { status: Status.SUCCESS; data: T }
  | { status: Status.ERROR; code: number; message: string };
```

#### Usage Examples

**PostMessage with Manual Result Handling:**
```typescript
import { safePostMessage, Status } from 'guardz-event';

const safeMessageHandler = safePostMessage({ 
  guard: isUserMessage,
  allowedOrigins: ['https://trusted-domain.com']
});

window.addEventListener('message', (event) => {
  const result = safeMessageHandler(event);
  
  if (result.status === Status.SUCCESS) {
    console.log('✅ Valid message:', result.data);
  } else {
    console.log('❌ Error:', result.code, result.message);
  }
});
```

### 🔄 **Pattern 3: Fluent API Builder**

The fluent API provides a chainable interface for building event handlers.

#### Usage Example

```typescript
import { safe } from 'guardz-event';

const handler = safe()
  .postMessage()
  .guard(isUserMessage)
  .allowedOrigins(['https://trusted-domain.com'])
  .tolerance(true)
  .onError((error, context) => {
    console.warn(`Validation warning: ${error}`);
  })
  .createHandler();

window.addEventListener('message', handler);
```

### 🔄 **Pattern 4: Context API**

The context API provides shared configuration across multiple event handlers.

#### Usage Example

```typescript
import { createSafeEventContext } from 'guardz-event';

const eventContext = createSafeEventContext({
  allowedOrigins: ['https://trusted-domain.com'],
  defaultTolerance: true,
  onError: (error, context) => {
    console.warn(`Validation warning: ${error}`);
  }
});

const messageHandler = eventContext.postMessage({ guard: isUserMessage });
const wsHandler = eventContext.webSocket({ guard: isWSData });

window.addEventListener('message', messageHandler);
ws.addEventListener('message', wsHandler);
```

## Error Handling

### Error Types

1. **Validation Errors (Code: 500)** - When event data doesn't match the expected type
2. **Security Errors (Code: 403)** - When origin or source is not allowed
3. **WebSocket State Errors (Code: 500)** - When WebSocket is not in OPEN state
4. **API Support Errors (Code: 500)** - When required APIs are not supported

### Error Messages

**Validation Error:**
```
"Validation failed: Expected userData.id (\"1\") to be \"number\""
```

**Security Error:**
```
"PostMessage origin not allowed: https://malicious-site.com"
```

**WebSocket Error:**
```
"WebSocket not in OPEN state: 3"
```

**API Support Error:**
```
"Battery API not supported"
```

## Security Features

### Origin Validation

```typescript
const safeHandler = safePostMessageListener(
  isUserMessage,
  {
    allowedOrigins: ['https://trusted-domain.com', 'https://api.example.com'],
    onSuccess: (data) => console.log('Secure data:', data),
    onSecurityViolation: (origin, message) => console.error('Security:', message)
  }
);
```

### Source Validation

```typescript
const safeHandler = safePostMessageListener(
  isUserMessage,
  {
    allowedOrigins: ['https://trusted-domain.com'],
    allowedSources: ['trusted-iframe', 'main-window'],
    onSuccess: (data) => console.log('Secure data:', data),
    onSecurityViolation: (origin, message) => console.error('Security:', message)
  }
);
```

## Tolerance Mode

Tolerance mode allows partial data validation and graceful degradation.

```typescript
const tolerantHandler = safeWebSocketListener(
  isStockUpdate,
  {
    tolerance: true,
    onSuccess: (data) => {
      console.log('Data processed (may have validation issues):', data);
    },
    onTypeMismatch: (errorMessage) => {
      console.warn('Validation warning:', errorMessage);
    }
  }
);
```

## Type Safety

### Automatic Type Inference

```typescript
const result = await safeEvent({ event, guard: isUserMessage });

if (result.status === Status.SUCCESS) {
  // TypeScript knows this is UserMessage
  console.log(result.data.name); // ✅ Type-safe
  console.log(result.data.email); // ✅ Type-safe
}
```

### Generic Type Guards

```typescript
function createMessageGuard<T>() {
  return isType<T>({
    id: isNumber,
    timestamp: isNumber,
    data: isAny
  });
}

const result = await safeEvent({ 
  event, 
  guard: createMessageGuard<UserMessage>() 
});
```

## Migration Guide

### From Legacy API to Ergonomic API

**Before (Legacy):**
```typescript
const handler = safePostMessage({ guard: isUserMessage });
window.addEventListener('message', (event) => {
  const result = handler(event);
  if (result.status === Status.SUCCESS) {
    handleSuccess(result.data);
  } else {
    handleError(result.message);
  }
});
```

**After (Ergonomic):**
```typescript
const handler = safePostMessageListener(
  isUserMessage,
  {
    onSuccess: handleSuccess,
    onTypeMismatch: handleTypeError,
    onSecurityViolation: handleSecurityError
  }
);
window.addEventListener('message', handler);
```

## Best Practices

### 1. Always Validate Origins

```typescript
const safeHandler = safePostMessageListener(
  isUserMessage,
  {
    allowedOrigins: ['https://trusted-domain.com'], // Always specify
    tolerance: false,
    onSuccess: (data) => console.log('Secure data:', data),
    onSecurityViolation: (origin, message) => console.error('Security:', message)
  }
);
```

### 2. Use Tolerance Mode for Non-Critical Data

```typescript
const safeHandler = safeWebSocketListener(
  isAnalyticsData,
  {
    tolerance: true, // Allow partial data for analytics
    onSuccess: (data) => {
      // Use data confidently
    },
    onTypeMismatch: (error) => {
      // Log but don't break functionality
      analytics.log('validation_warning', { error });
    }
  }
);
```

### 3. Handle Different Error Types Appropriately

```typescript
const safeHandler = safePostMessageListener(
  isUserMessage,
  {
    allowedOrigins: ['https://trusted-domain.com'],
    onSuccess: (data) => {
      // Handle success
    },
    onSecurityViolation: (origin, message) => {
      // Security violation - log and block
      securityLogger.log('origin_violation', { origin });
    },
    onTypeMismatch: (error) => {
      // Validation error - log and handle gracefully
      console.warn('Data validation failed:', error);
    }
  }
);
```

### 4. Use Context API for Consistent Configuration

```typescript
const eventContext = createSafeEventContext({
  allowedOrigins: ['https://trusted-domain.com'],
  defaultTolerance: false,
  onError: (error, context) => {
    // Centralized error handling
    errorLogger.log('event_validation_error', { error, context });
  }
});
```

## Supported Event Sources

### Core Event Sources
- **DOM Events** - Click, keydown, submit, etc.
- **PostMessage** - Cross-origin communication
- **WebSocket** - Real-time bidirectional communication
- **EventSource** - Server-sent events
- **Custom Events** - Application-specific events
- **Storage Events** - Local/session storage changes

### Observer-based Sources
- **Intersection Observer** - Element visibility tracking
- **Resize Observer** - Element size changes
- **Mutation Observer** - DOM tree changes
- **Performance Observer** - Performance metrics

### Device API Sources
- **Geolocation** - GPS coordinates
- **Device Orientation** - Device rotation data
- **Device Motion** - Device acceleration data

### Communication Sources
- **Service Worker Messages** - Background script communication
- **Broadcast Channel** - Cross-tab communication

### Payment & System Sources
- **Payment Request** - Payment method changes
- **Battery Status** - Device battery information
- **Network Information** - Connection type and quality

## Performance Considerations

### Memory Management

- Event listeners are automatically cleaned up when elements are removed
- Use `removeEventListener` when manually cleaning up
- Consider using `AbortController` for modern event handling

### Validation Performance

- Type guards are executed synchronously for performance
- Consider using tolerance mode for high-frequency events
- Cache validated data when possible

### Security Performance

- Origin validation is fast and doesn't impact performance
- Source validation adds minimal overhead
- Security checks are performed before type validation 