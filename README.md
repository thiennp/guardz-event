# Guardz Event

A type-safe event handling library with runtime validation using [guardz](https://github.com/thiennp/guardz) for guarding unsafe data from 3rd parties and various event sources.

## Features

- **Type-safe event handling** with runtime validation
- **Ergonomic callback-based API** for easy event handling
- **Multiple API patterns** for different use cases
- **Comprehensive security validation** for origins and sources
- **Support for 30+ event sources** including DOM, WebSocket, PostMessage, and more
- **Tolerance mode** for graceful degradation
- **Zero dependencies** beyond guardz
- **Observer pattern support** for Intersection, Resize, Mutation, and Performance observers
- **Device API support** for Geolocation, Device Orientation, and Motion
- **Service Worker and Broadcast Channel support**
- **Payment and Battery API support**

## Installation

```bash
npm install guardz-event guardz@^1.7.0
```

**Note:** This library requires guardz version 1.7.0 or higher for optimal performance and type safety.

## Related Packages

This library is part of the **guardz ecosystem** - a comprehensive suite of type-safe validation tools:

- **[guardz](https://github.com/thiennp/guardz)** - Core type guard library with runtime validation
- **[guardz-generator](https://github.com/thiennp/guardz-generator)** - Generate type guards from TypeScript interfaces and schemas
- **[guardz-axios](https://github.com/thiennp/guardz-axios)** - Type-safe HTTP client with runtime validation
- **[guardz-event](https://github.com/thiennp/guardz-event)** - Type-safe event handling with runtime validation (this package)

### Ecosystem Benefits

- **Consistent API**: All packages follow the same design patterns and conventions
- **Type Safety**: Full TypeScript support with automatic type inference
- **Runtime Validation**: Comprehensive validation at runtime for production safety
- **Performance Optimized**: Minimal overhead with synchronous validation
- **Developer Experience**: Excellent IDE support and error messages

## Quick Start

### 🎯 **Recommended: Ergonomic API**

```typescript
import { safePostMessageListener, safeWebSocketListener, safeDOMEventListener } from 'guardz-event';
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

// Create safe event listener with callbacks
const safeMessageHandler = safePostMessageListener(
  isUserMessage,
  {
    allowedOrigins: ['https://trusted-domain.com'],
    onSuccess: (data) => {
      console.log('Valid message:', data); // Fully typed as UserMessage
    },
    onTypeMismatch: (error) => {
      console.warn('Type validation failed:', error);
    },
    onSecurityViolation: (origin, message) => {
      console.error('Security violation from', origin, ':', message);
    }
  }
);

// Direct assignment - no manual result handling!
window.addEventListener('message', safeMessageHandler);
```

### 🔄 **Legacy: Result-based API**

```typescript
import { safePostMessage, Status } from 'guardz-event';

const safeMessageHandler = safePostMessage({ 
  guard: isUserMessage,
  allowedOrigins: ['https://trusted-domain.com']
});

window.addEventListener('message', (event) => {
  const result = safeMessageHandler(event);
  
  if (result.status === Status.SUCCESS) {
    console.log('Valid message:', result.data); // Fully typed as UserMessage
  } else {
    console.log('Error:', result.code, result.message);
  }
});
```

## Result Type

The library uses a **discriminated union** for type-safe results:

```typescript
type EventResult<T> = 
  | { status: Status.SUCCESS; data: T }
  | { status: Status.ERROR; code: number; message: string };
```

### Success Response

When the event data passes validation:

```typescript
{
  status: Status.SUCCESS,
  data: T // Your validated data
}
```

### Error Response

When validation fails or security checks fail:

```typescript
{
  status: Status.ERROR,
  code: number,    // 403 for security errors, 500 for validation errors
  message: string  // Human-readable error message
}
```

## Error Types and Messages

### 1. Validation Errors (Code: 500)
When event data doesn't match the expected type:

```typescript
{
  status: Status.ERROR,
  code: 500,
  message: "Validation failed: Expected userData.id (\"1\") to be \"number\""
}
```

### 2. Security Errors (Code: 403)
When origin or source is not allowed:

```typescript
{
  status: Status.ERROR,
  code: 403,
  message: "PostMessage origin not allowed: https://malicious-site.com"
}
```

### 3. WebSocket State Errors (Code: 500)
When WebSocket is not in OPEN state:

```typescript
{
  status: Status.ERROR,
  code: 500,
  message: "WebSocket not in OPEN state: 3"
}
```

### 4. API Support Errors (Code: 500)
When required APIs are not supported:

```typescript
{
  status: Status.ERROR,
  code: 500,
  message: "Battery API not supported"
}
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

## API Patterns

### 🎯 **Pattern 1: Ergonomic Event Listeners (Recommended)**

Simple, callback-based approach:

```typescript
import { 
  safePostMessageListener, 
  safeWebSocketListener, 
  safeDOMEventListener 
} from 'guardz-event';

// PostMessage with security validation
const messageHandler = safePostMessageListener(
  isUserMessage,
  {
    allowedOrigins: ['https://trusted-domain.com'],
    onSuccess: (data) => console.log('Valid message:', data),
    onTypeMismatch: (error) => console.warn('Type error:', error),
    onSecurityViolation: (origin, message) => console.error('Security:', message)
  }
);

// WebSocket with tolerance mode
const wsHandler = safeWebSocketListener(
  isStockData,
  {
    tolerance: true,
    onSuccess: (data) => updateStockDisplay(data),
    onTypeMismatch: (error) => console.warn('Data warning:', error)
  }
);

// DOM events
const clickHandler = safeDOMEventListener(
  isClickData,
  {
    onSuccess: (data) => handleClick(data),
    onTypeMismatch: (error) => console.warn('Click data error:', error)
  }
);

// Usage
window.addEventListener('message', messageHandler);
ws.addEventListener('message', wsHandler);
button.addEventListener('click', clickHandler);
```

### 🔄 **Pattern 2: Configuration-first (Legacy)**

Full control over event configuration:

```typescript
import { safeEvent } from 'guardz-event';

const result = await safeEvent({
  event: messageEvent,
  guard: isUserMessage,
  allowedOrigins: ['https://trusted-domain.com'],
  tolerance: true,
  onError: (error, context) => {
    console.warn(`Validation warning: ${error}`);
  }
});

if (result.status === Status.SUCCESS) {
  console.log('Valid data:', result.data);
}
```

### 🔄 **Pattern 3: Fluent API Builder (Legacy)**

Chainable, readable API:

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

### 🔄 **Pattern 4: Context API (Legacy)**

Shared configuration across events:

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

## Advanced Features

### Tolerance Mode

Handle invalid event data gracefully:

```typescript
const safeHandler = safePostMessageListener(
  isUserMessage,
  {
    tolerance: true,
    onSuccess: (data) => {
      console.log('Message data (may have validation issues):', data);
    },
    onTypeMismatch: (error) => {
      console.warn('Validation warning:', error);
    }
  }
);

window.addEventListener('message', safeHandler);
```

### Security Validation

Validate origins and sources for security:

```typescript
const safeHandler = safePostMessageListener(
  isUserMessage,
  {
    allowedOrigins: ['https://trusted-domain.com', 'https://api.example.com'],
    allowedSources: ['trusted-iframe', 'main-window'],
    onSuccess: (data) => {
      console.log('Secure message:', data);
    },
    onSecurityViolation: (origin, message) => {
      console.error('Security violation:', message);
    }
  }
);

window.addEventListener('message', safeHandler);
```

### Observer Pattern Support

Safe handling of observer callbacks:

```typescript
import { safeIntersectionObserver } from 'guardz-event';

interface IntersectionData {
  isIntersecting: boolean;
  ratio: number;
}

const isIntersectionData = isType<IntersectionData>({
  isIntersecting: isBoolean,
  ratio: isNumber,
});

const intersectionHandler = safeIntersectionObserver({ guard: isIntersectionData });

const observer = new IntersectionObserver((entries) => {
  const results = intersectionHandler(entries);
  
  results.forEach(result => {
    if (result.status === Status.SUCCESS) {
      console.log('Element visibility:', result.data);
    } else {
      console.error('Validation failed:', result.message);
    }
  });
});
```

### Device API Support

Safe handling of device sensors:

```typescript
import { safeGeolocation, safeDeviceOrientation } from 'guardz-event';

interface GeoData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

const isGeoData = isType<GeoData>({
  latitude: isNumber,
  longitude: isNumber,
  accuracy: isNumber,
});

const geoHandler = safeGeolocation({ guard: isGeoData });

navigator.geolocation.getCurrentPosition((position) => {
  const result = geoHandler(position);
  
  if (result.status === Status.SUCCESS) {
    console.log('Location:', result.data);
  } else {
    console.error('Location error:', result.message);
  }
});
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

if (result.status === Status.SUCCESS) {
  console.log('Message:', result.data);
}
```

## Examples

### Basic PostMessage Security

```typescript
import { safePostMessageListener } from 'guardz-event';
import { isType, isString, isNumber } from 'guardz';

interface ChatMessage {
  userId: number;
  message: string;
  timestamp: number;
}

const isChatMessage = isType<ChatMessage>({
  userId: isNumber,
  message: isString,
  timestamp: isNumber,
});

const safeChatHandler = safePostMessageListener(
  isChatMessage,
  {
    allowedOrigins: ['https://chat.example.com'],
    tolerance: false,
    onSuccess: (data) => {
      displayMessage(data);
    },
    onSecurityViolation: (origin, message) => {
      console.error('Security violation:', message);
    },
    onTypeMismatch: (error) => {
      console.error('Invalid message format:', error);
    }
  }
);

window.addEventListener('message', safeChatHandler);
```

### WebSocket Real-time Data

```typescript
import { safeWebSocketListener } from 'guardz-event';
import { isType, isString, isNumber, isArray } from 'guardz';

interface StockUpdate {
  symbol: string;
  price: number;
  change: number;
  volume: number[];
}

const isStockUpdate = isType<StockUpdate>({
  symbol: isString,
  price: isNumber,
  change: isNumber,
  volume: isArray(isNumber),
});

const safeStockHandler = safeWebSocketListener(
  isStockUpdate,
  {
    tolerance: true,
    onSuccess: (data) => {
      updateStockDisplay(data);
    },
    onTypeMismatch: (error) => {
      console.warn('Stock data validation warning:', error);
    }
  }
);

const ws = new WebSocket('wss://stocks.example.com/feed');
ws.addEventListener('message', safeStockHandler);
```

### Intersection Observer for Lazy Loading

```typescript
import { safeIntersectionObserver } from 'guardz-event';
import { isType, isBoolean, isNumber } from 'guardz';

interface VisibilityData {
  isVisible: boolean;
  ratio: number;
}

const isVisibilityData = isType<VisibilityData>({
  isVisible: isBoolean,
  ratio: isNumber,
});

const safeVisibilityHandler = safeIntersectionObserver({
  guard: isVisibilityData
});

const lazyLoadObserver = new IntersectionObserver((entries) => {
  const results = safeVisibilityHandler(entries);
  
  results.forEach((result, index) => {
    if (result.status === Status.SUCCESS) {
      const entry = entries[index];
      if (result.data.isVisible && result.data.ratio > 0.5) {
        loadImage(entry.target as HTMLImageElement);
      }
    } else {
      console.error('Visibility data error:', result.message);
    }
  });
});

// Observe all lazy-load images
document.querySelectorAll('img[data-src]').forEach(img => {
  lazyLoadObserver.observe(img);
});
```

### Device Orientation for Gaming

```typescript
import { safeDeviceOrientation } from 'guardz-event';
import { isType, isNumber, isBoolean } from 'guardz';

interface OrientationData {
  alpha: number;
  beta: number;
  gamma: number;
  absolute: boolean;
}

const isOrientationData = isType<OrientationData>({
  alpha: isNumber,
  beta: isNumber,
  gamma: isNumber,
  absolute: isBoolean,
});

const safeOrientationHandler = safeDeviceOrientation({
  guard: isOrientationData,
  tolerance: true,
  onError: (error, context) => {
    console.warn(`Orientation data warning: ${error}`);
  }
});

window.addEventListener('deviceorientation', (event) => {
  const result = safeOrientationHandler(event);
  
  if (result.status === Status.SUCCESS) {
    updateGameControls(result.data);
  } else {
    console.error('Orientation error:', result.message);
  }
});
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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT 