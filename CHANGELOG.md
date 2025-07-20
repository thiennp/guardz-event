# Changelog

All notable changes to Guardz Event will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-19

### Changed 🔄

- **Dependency Upgrade** - Upgraded guardz peer dependency from ^1.4.1 to ^1.7.0
- **Enhanced Type Safety** - Leveraging new guardz 1.7.0 features for improved type validation
- **Performance Improvements** - Utilizing guardz 1.7.0 optimizations for better runtime performance

### Added 🎉

- **New Ergonomic API** - Callback-based event listeners for cleaner, more intuitive usage
  - `safePostMessageListener<T>(guard, config)` - Safe PostMessage with callbacks
  - `safeWebSocketListener<T>(guard, config)` - Safe WebSocket with callbacks
  - `safeDOMEventListener<T>(guard, config)` - Safe DOM events with callbacks
  - `safeEventSourceListener<T>(guard, config)` - Safe EventSource with callbacks
  - `safeCustomEventListener<T>(guard, config)` - Safe custom events with callbacks
  - `safeStorageEventListener<T>(guard, config)` - Safe storage events with callbacks

- **Granular Error Handling** - Separate callbacks for different error types:
  - `onSuccess(data)` - Called when validation passes
  - `onTypeMismatch(errorMessage)` - Called for validation errors
  - `onSecurityViolation(origin, message)` - Called for security violations
  - `onError(result)` - Called for other errors

- **Direct Event Listener Assignment** - No more manual result handling:
  ```typescript
  // Before (Legacy)
  const handler = safePostMessage({ guard: isUserMessage });
  window.addEventListener('message', (event) => {
    const result = handler(event);
    if (result.status === Status.SUCCESS) {
      handleSuccess(result.data);
    } else {
      handleError(result.message);
    }
  });

  // After (Ergonomic)
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

- **Enhanced Type Safety** - Better TypeScript integration with automatic type inference
- **Improved Developer Experience** - Cleaner, more readable code with less boilerplate
- **Backward Compatibility** - All legacy APIs remain fully functional

### Changed 🔄

- **Interface Updates** - Added `ErgonomicEventListenerConfig<T>` interface for new API
- **Documentation Overhaul** - Updated README and examples to showcase ergonomic API
- **Example Improvements** - Added comprehensive examples for all event types

### Deprecated ⚠️

- No deprecations in this release - all legacy APIs remain supported

### Removed 🗑️

- Nothing removed

### Fixed 🔧

- Improved type safety across all event handlers
- Enhanced error message clarity and consistency
- Better handling of edge cases in validation

### Security 🔒

- Enhanced security validation with more granular error reporting
- Improved origin and source validation error messages

## [Unreleased]

## [0.1.0] - 2024-01-XX

### Added 🎉

- **Core Event Handling** - Safe event validation for multiple event sources
  - `safePostMessage<T>(config)` - Safe PostMessage handling
  - `safeWebSocket<T>(config)` - Safe WebSocket handling
  - `safeDOMEvent<T>(config)` - Safe DOM event handling
  - `safeEventSource<T>(config)` - Safe EventSource handling
  - `safeCustomEvent<T>(config)` - Safe custom event handling
  - `safeStorageEvent<T>(config)` - Safe storage event handling

- **Result-based API** - Type-safe result objects for event validation
  ```typescript
  type EventResult<T> = 
    | { status: Status.SUCCESS; data: T }
    | { status: Status.ERROR; code: number; message: string };
  ```

- **Security Features** - Origin and source validation for PostMessage
  - `allowedOrigins` - Validate message origins
  - `allowedSources` - Validate message sources

- **Tolerance Mode** - Graceful degradation for partial data validation
  - `tolerance: true` - Allow partial validation with warnings

- **Fluent API Builder** - Chainable interface for building event handlers
  ```typescript
  const handler = safe()
    .postMessage()
    .guard(isUserMessage)
    .allowedOrigins(['https://trusted-domain.com'])
    .createHandler();
  ```

- **Context API** - Shared configuration across multiple event handlers
  ```typescript
  const eventContext = createSafeEventContext({
    allowedOrigins: ['https://trusted-domain.com'],
    defaultTolerance: true
  });
  ```

- **Additional Event Sources** - Support for 30+ event sources including:
  - Observer APIs (Intersection, Resize, Mutation, Performance)
  - Device APIs (Geolocation, Orientation, Motion)
  - Communication APIs (Service Worker, Broadcast Channel)
  - Payment & System APIs (Payment Request, Battery, Network Info)

- **Type Safety** - Full TypeScript support with automatic type inference
- **Error Handling** - Comprehensive error types and messages
- **Performance Optimized** - Synchronous validation with minimal overhead

### Security 🔒

- **Origin Validation** - Prevent malicious PostMessage attacks
- **Source Validation** - Validate event sources for security
- **Type Validation** - Runtime type checking for all event data
- **Error Isolation** - Graceful error handling without crashes

---

## Migration Guide

### From Legacy API to Ergonomic API

The new ergonomic API provides a much cleaner interface while maintaining full backward compatibility.

#### Before (Legacy API)
```typescript
import { safePostMessage, Status } from 'guardz-event';

const safeMessageHandler = safePostMessage({ 
  guard: isUserMessage,
  allowedOrigins: ['https://trusted-domain.com']
});

window.addEventListener('message', (event) => {
  const result = safeMessageHandler(event);
  
  if (result.status === Status.SUCCESS) {
    console.log('Valid message:', result.data);
  } else {
    console.log('Error:', result.message);
  }
});
```

#### After (Ergonomic API)
```typescript
import { safePostMessageListener } from 'guardz-event';

const safeMessageHandler = safePostMessageListener(
  isUserMessage,
  {
    allowedOrigins: ['https://trusted-domain.com'],
    onSuccess: (data) => {
      console.log('Valid message:', data);
    },
    onTypeMismatch: (error) => {
      console.warn('Type validation failed:', error);
    },
    onSecurityViolation: (origin, message) => {
      console.error('Security violation from', origin, ':', message);
    }
  }
);

window.addEventListener('message', safeMessageHandler);
```

### Benefits of the Ergonomic API

1. **Cleaner Code** - No manual result handling required
2. **Better Error Handling** - Granular callbacks for different error types
3. **Type Safety** - Automatic type inference in success callbacks
4. **Direct Assignment** - Event listeners can be assigned directly
5. **Intuitive Interface** - More natural callback-based approach
6. **Backward Compatible** - Legacy API remains fully functional

### When to Use Each API

#### Use Ergonomic API When:
- Building new applications
- Wanting cleaner, more readable code
- Need granular error handling
- Prefer callback-based interfaces

#### Use Legacy API When:
- Maintaining existing code
- Need full control over result handling
- Want to handle results in custom ways
- Prefer explicit result checking

Both APIs provide the same functionality and security features - the choice is purely about developer preference and code style. 