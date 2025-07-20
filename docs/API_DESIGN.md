# API Design Documentation

## Overview

Guardz Event provides multiple API patterns to accommodate different use cases and developer preferences. The API design follows principles of consistency, type safety, and developer experience while maintaining backward compatibility.

## API Design Principles

### 1. Type Safety First
- Full TypeScript support with automatic type inference
- Runtime validation with guardz integration
- Compile-time error detection

### 2. Developer Experience
- Intuitive and readable APIs
- Comprehensive error messages
- Excellent IDE support

### 3. Consistency
- Consistent patterns across all event types
- Uniform error handling
- Standardized configuration interfaces

### 4. Flexibility
- Multiple API patterns for different use cases
- Configurable validation rules
- Extensible architecture

## API Patterns

### Pattern 1: Ergonomic API (Recommended)

**Purpose**: Provide a clean, callback-based interface that eliminates manual result handling.

**Design Goals**:
- Reduce boilerplate code
- Improve readability
- Prevent common errors
- Better developer experience

**Core Functions**:
```typescript
// PostMessage events
safePostMessageListener<T>(guard, config): (event: MessageEvent) => void

// WebSocket events
safeWebSocketListener<T>(guard, config): (event: MessageEvent) => void

// DOM events
safeDOMEventListener<T>(guard, config): (event: Event) => void

// EventSource events
safeEventSourceListener<T>(guard, config): (event: MessageEvent) => void

// Custom events
safeCustomEventListener<T>(guard, config): (event: CustomEvent) => void

// Storage events
safeStorageEventListener<T>(guard, config): (event: StorageEvent) => void
```

**Configuration Interface**:
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

**Usage Examples**:

**Basic Usage**:
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
  isActive: isBoolean
});

const handler = safePostMessageListener(
  isUserMessage,
  {
    onSuccess: (data) => {
      console.log('Valid message:', data);
      // data is fully typed as UserMessage
    },
    onTypeMismatch: (error) => {
      console.warn('Type validation failed:', error);
    },
    onSecurityViolation: (origin, message) => {
      console.error('Security violation from', origin, ':', message);
    }
  }
);

window.addEventListener('message', handler);
```

**With Security Validation**:
```typescript
const secureHandler = safePostMessageListener(
  isUserMessage,
  {
    allowedOrigins: ['https://trusted-domain.com'],
    allowedSources: ['trusted-iframe'],
    onSuccess: (data) => {
      console.log('Secure message:', data);
    },
    onSecurityViolation: (origin, message) => {
      console.error('Security violation:', message);
      // Log to security monitoring service
      securityMonitor.trackViolation({ origin, message });
    }
  }
);
```

**With Tolerance Mode**:
```typescript
const tolerantHandler = safePostMessageListener(
  isUserMessage,
  {
    tolerance: true,
    onSuccess: (data) => {
      console.log('Message data (may have validation issues):', data);
    },
    onTypeMismatch: (error) => {
      console.warn('Validation warning:', error);
      // Still process the data but log the warning
    }
  }
);
```

### Pattern 2: Legacy API

**Purpose**: Provide result-based event handling for maximum control and backward compatibility.

**Design Goals**:
- Maximum control over event processing
- Explicit result handling
- Backward compatibility
- Manual error management

**Core Functions**:
```typescript
// PostMessage events
safePostMessage<T>(config): (event: MessageEvent) => EventResult<T>

// WebSocket events
safeWebSocket<T>(config): (event: MessageEvent) => EventResult<T>

// DOM events
safeDOMEvent<T>(config): (event: Event) => EventResult<T>

// EventSource events
safeEventSource<T>(config): (event: MessageEvent) => EventResult<T>

// Custom events
safeCustomEvent<T>(config): (event: CustomEvent) => EventResult<T>

// Storage events
safeStorageEvent<T>(config): (event: StorageEvent) => EventResult<T>
```

**Configuration Interface**:
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

**Result Type**:
```typescript
type EventResult<T> = 
  | { status: Status.SUCCESS; data: T }
  | { status: Status.ERROR; code: number; message: string };
```

**Usage Examples**:

**Basic Usage**:
```typescript
import { safePostMessage, Status } from 'guardz-event';

const handler = safePostMessage({ 
  guard: isUserMessage,
  identifier: 'user-message'
});

window.addEventListener('message', (event) => {
  const result = handler(event);
  
  if (result.status === Status.SUCCESS) {
    console.log('Valid message:', result.data);
    // result.data is fully typed as UserMessage
  } else {
    console.error('Error:', result.code, result.message);
  }
});
```

**With Security Validation**:
```typescript
const secureHandler = safePostMessage({ 
  guard: isUserMessage,
  allowedOrigins: ['https://trusted-domain.com'],
  allowedSources: ['trusted-iframe']
});

window.addEventListener('message', (event) => {
  const result = secureHandler(event);
  
  if (result.status === Status.SUCCESS) {
    console.log('Secure message:', result.data);
  } else if (result.code === 403) {
    console.error('Security violation:', result.message);
  } else {
    console.error('Validation error:', result.message);
  }
});
```

**With Tolerance Mode**:
```typescript
const tolerantHandler = safePostMessage({ 
  guard: isUserMessage,
  tolerance: true,
  onError: (error, context) => {
    console.warn('Validation warning:', error);
  }
});

window.addEventListener('message', (event) => {
  const result = tolerantHandler(event);
  
  if (result.status === Status.SUCCESS) {
    console.log('Message processed:', result.data);
  } else {
    console.warn('Warning:', result.message);
    // Still process the data despite validation issues
  }
});
```

### Pattern 3: Builder API

**Purpose**: Provide a fluent, chainable interface for building event handlers.

**Design Goals**:
- Readable and expressive code
- Method chaining
- Progressive configuration
- Type safety throughout the chain

**Core Class**:
```typescript
class SafeEventBuilder<T = unknown> {
  // Event type selection
  domEvent(eventType: string): SafeEventBuilder<T>
  postMessage(): SafeEventBuilder<T>
  webSocket(): SafeEventBuilder<T>
  eventSource(): SafeEventBuilder<T>
  customEvent(eventType: string): SafeEventBuilder<T>
  storageEvent(): SafeEventBuilder<T>
  
  // Configuration
  guard<U>(guardFn: TypeGuardFn<U>): SafeEventBuilder<U>
  tolerance(enabled?: boolean): SafeEventBuilder<T>
  identifier(id: string): SafeEventBuilder<T>
  timeout(ms: number): SafeEventBuilder<T>
  allowedOrigins(origins: string[]): SafeEventBuilder<T>
  allowedSources(sources: string[]): SafeEventBuilder<T>
  onError(callback: (error: string, context: ErrorContext) => void): SafeEventBuilder<T>
  
  // Handler creation
  createHandler(): EventHandler
}
```

**Usage Examples**:

**Basic Builder Usage**:
```typescript
import { safe } from 'guardz-event';

const handler = safe()
  .postMessage()
  .guard(isUserMessage)
  .identifier('user-message')
  .createHandler();

window.addEventListener('message', handler);
```

**Complex Builder Usage**:
```typescript
const secureHandler = safe()
  .postMessage()
  .guard(isUserMessage)
  .allowedOrigins(['https://trusted-domain.com'])
  .allowedSources(['trusted-iframe'])
  .tolerance(true)
  .onError((error, context) => {
    console.warn('Validation warning:', error);
  })
  .createHandler();

window.addEventListener('message', secureHandler);
```

**Multiple Handlers**:
```typescript
const messageHandler = safe()
  .postMessage()
  .guard(isUserMessage)
  .allowedOrigins(['https://api.example.com'])
  .createHandler();

const wsHandler = safe()
  .webSocket()
  .guard(isStockData)
  .tolerance(true)
  .createHandler();

const domHandler = safe()
  .domEvent('click')
  .guard(isClickData)
  .createHandler();

// Usage
window.addEventListener('message', messageHandler);
ws.addEventListener('message', wsHandler);
button.addEventListener('click', domHandler);
```

### Pattern 4: Context API

**Purpose**: Provide shared configuration across multiple event handlers.

**Design Goals**:
- Reduce configuration duplication
- Centralized security policies
- Consistent validation rules
- Easy maintenance

**Core Interface**:
```typescript
interface SafeEventContext {
  domEvent<T>(
    eventType: string,
    config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }
  ): (event: Event) => EventResult<T>;
  
  postMessage<T>(
    config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }
  ): (event: MessageEvent) => EventResult<T>;
  
  webSocket<T>(
    config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }
  ): (event: MessageEvent) => EventResult<T>;
  
  eventSource<T>(
    config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }
  ): (event: MessageEvent) => EventResult<T>;
  
  customEvent<T>(
    eventType: string,
    config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }
  ): (event: CustomEvent) => EventResult<T>;
  
  storageEvent<T>(
    config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }
  ): (event: StorageEvent) => EventResult<T>;
}
```

**Usage Examples**:

**Basic Context Usage**:
```typescript
import { createSafeEventContext } from 'guardz-event';

const eventContext = createSafeEventContext({
  allowedOrigins: ['https://trusted-domain.com'],
  defaultTolerance: true
});

const messageHandler = eventContext.postMessage({ guard: isUserMessage });
const wsHandler = eventContext.webSocket({ guard: isStockData });
const domHandler = eventContext.domEvent('click', { guard: isClickData });

// Usage
window.addEventListener('message', messageHandler);
ws.addEventListener('message', wsHandler);
button.addEventListener('click', domHandler);
```

**Advanced Context Usage**:
```typescript
const secureContext = createSafeEventContext({
  allowedOrigins: ['https://api.example.com', 'https://cdn.example.com'],
  allowedSources: ['trusted-iframe', 'main-window'],
  defaultTolerance: false,
  onError: (error, context) => {
    console.error('Event error:', error);
    // Send to monitoring service
    monitoringService.trackError(error, context);
  }
});

const handlers = {
  userMessage: secureContext.postMessage({ guard: isUserMessage }),
  stockUpdate: secureContext.webSocket({ guard: isStockData, tolerance: true }),
  userClick: secureContext.domEvent('click', { guard: isClickData }),
  storageChange: secureContext.storageEvent({ guard: isStorageData })
};

// Register all handlers
Object.entries(handlers).forEach(([name, handler]) => {
  console.log(`Registering ${name} handler`);
  // Register based on handler type
});
```

## API Design Patterns

### 1. Factory Pattern

**Purpose**: Create event handlers with consistent configuration.

**Implementation**:
```typescript
// Factory function for creating handlers
function createSecureHandler<T>(
  guard: TypeGuardFn<T>,
  options: Partial<SafeEventConfig<T>> = {}
) {
  return safePostMessageListener(guard, {
    allowedOrigins: ['https://trusted-domain.com'],
    tolerance: false,
    ...options,
    onSuccess: (data) => {
      console.log('Secure message received:', data);
      // Additional processing
    }
  });
}

// Usage
const userHandler = createSecureHandler(isUserMessage);
const stockHandler = createSecureHandler(isStockData, { tolerance: true });
```

### 2. Decorator Pattern

**Purpose**: Add functionality to existing handlers.

**Implementation**:
```typescript
// Decorator function for adding logging
function withLogging<T>(
  handler: (event: MessageEvent) => void,
  logger: Console
) {
  return (event: MessageEvent) => {
    logger.log('Event received:', event.type);
    const startTime = performance.now();
    
    try {
      handler(event);
      logger.log('Event processed successfully');
    } catch (error) {
      logger.error('Event processing failed:', error);
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      logger.log(`Event processing took ${duration.toFixed(2)}ms`);
    }
  };
}

// Usage
const baseHandler = safePostMessageListener(isUserMessage, config);
const loggedHandler = withLogging(baseHandler, console);
```

### 3. Strategy Pattern

**Purpose**: Switch between different validation strategies.

**Implementation**:
```typescript
// Validation strategies
const validationStrategies = {
  strict: (data: any) => isStrictUserMessage(data),
  lenient: (data: any) => isLenientUserMessage(data),
  tolerant: (data: any) => isTolerantUserMessage(data)
};

// Strategy selector
function createHandlerWithStrategy(
  strategy: keyof typeof validationStrategies,
  config: Partial<SafeEventConfig<any>>
) {
  const guard = validationStrategies[strategy];
  return safePostMessageListener(guard, {
    tolerance: strategy === 'tolerant',
    ...config
  });
}

// Usage
const strictHandler = createHandlerWithStrategy('strict', {});
const lenientHandler = createHandlerWithStrategy('lenient', {});
const tolerantHandler = createHandlerWithStrategy('tolerant', {});
```

## Error Handling Design

### 1. Error Types

**Purpose**: Provide comprehensive error information.

**Error Hierarchy**:
```typescript
// Base error interface
interface BaseError {
  code: string;
  message: string;
}

// Security errors
interface SecurityError extends BaseError {
  code: 'SECURITY_ERROR';
  source: string;
}

// Validation errors
interface ValidationError extends BaseError {
  code: 'VALIDATION_ERROR';
  identifier: string;
}

// Context errors
interface ErrorContext {
  type: 'validation' | 'security' | 'timeout' | 'unknown';
  eventType: string;
  origin?: string;
  source?: string;
  originalError?: unknown;
  identifier?: string;
}
```

### 2. Error Handling Strategies

**Purpose**: Provide flexible error handling options.

**Strategies**:
```typescript
// 1. Callback-based error handling (Ergonomic API)
const handler = safePostMessageListener(
  isUserMessage,
  {
    onSuccess: (data) => console.log('Success:', data),
    onTypeMismatch: (error) => console.warn('Type error:', error),
    onSecurityViolation: (origin, message) => console.error('Security:', message),
    onError: (error, context) => console.error('Other error:', error)
  }
);

// 2. Result-based error handling (Legacy API)
const handler = safePostMessage({ guard: isUserMessage });
const result = handler(event);

if (result.status === Status.SUCCESS) {
  console.log('Success:', result.data);
} else {
  console.error('Error:', result.message);
}

// 3. Exception-based error handling
try {
  const result = handler(event);
  if (result.status === Status.ERROR) {
    throw new Error(result.message);
  }
} catch (error) {
  console.error('Exception:', error);
}
```

## Type Safety Design

### 1. Generic Type Parameters

**Purpose**: Provide type safety throughout the API.

**Implementation**:
```typescript
// Generic type parameters for maximum type safety
function safePostMessageListener<T>(
  guard: TypeGuardFn<T>,
  config: ErgonomicEventListenerConfig<T> & {
    onSuccess: (data: T) => void;
  }
): (event: MessageEvent) => void

// Type inference works automatically
const handler = safePostMessageListener(
  isUserMessage, // T is inferred as UserMessage
  {
    onSuccess: (data) => {
      // data is fully typed as UserMessage
      console.log(data.id, data.name, data.email);
    }
  }
);
```

### 2. Type Guards Integration

**Purpose**: Integrate seamlessly with guardz type guards.

**Implementation**:
```typescript
import { isType, isString, isNumber, isBoolean } from 'guardz';

// Type guard definition
const isUserMessage = isType<UserMessage>({
  id: isNumber,
  name: isString,
  email: isString,
  isActive: isBoolean
});

// Automatic type inference
const handler = safePostMessageListener(isUserMessage, {
  onSuccess: (data) => {
    // data is automatically typed as UserMessage
    console.log(data.id, data.name, data.email, data.isActive);
  }
});
```

### 3. Discriminated Unions

**Purpose**: Provide type-safe result handling.

**Implementation**:
```typescript
// Discriminated union for results
type EventResult<T> = 
  | { status: Status.SUCCESS; data: T }
  | { status: Status.ERROR; code: number; message: string };

// Type-safe result handling
const result = handler(event);

if (result.status === Status.SUCCESS) {
  // TypeScript knows result.data is T
  console.log(result.data);
} else {
  // TypeScript knows result has code and message
  console.error(result.code, result.message);
}
```

## Configuration Design

### 1. Configuration Interfaces

**Purpose**: Provide flexible and type-safe configuration.

**Core Interfaces**:
```typescript
// Base configuration interface
interface BaseConfig {
  tolerance?: boolean;
  identifier?: string;
  validateEvent?: boolean;
  timeout?: number;
}

// Security configuration
interface SecurityConfig {
  allowedOrigins?: string[];
  allowedSources?: string[];
}

// Error handling configuration
interface ErrorConfig {
  onError?: (error: string, context: ErrorContext) => void;
}

// Combined configuration
interface SafeEventConfig<T> extends BaseConfig, SecurityConfig, ErrorConfig {
  guard: TypeGuardFn<T>;
}
```

### 2. Configuration Validation

**Purpose**: Validate configuration at runtime.

**Implementation**:
```typescript
// Configuration validator
function validateConfig<T>(config: SafeEventConfig<T>): void {
  if (!config.guard || typeof config.guard !== 'function') {
    throw new Error('Guard function is required');
  }
  
  if (config.timeout && (typeof config.timeout !== 'number' || config.timeout < 0)) {
    throw new Error('Timeout must be a positive number');
  }
  
  if (config.allowedOrigins && !Array.isArray(config.allowedOrigins)) {
    throw new Error('Allowed origins must be an array');
  }
  
  if (config.allowedSources && !Array.isArray(config.allowedSources)) {
    throw new Error('Allowed sources must be an array');
  }
}

// Usage in handlers
function safePostMessage<T>(config: SafeEventConfig<T>) {
  validateConfig(config);
  // ... implementation
}
```

### 3. Default Configuration

**Purpose**: Provide sensible defaults while allowing customization.

**Implementation**:
```typescript
// Default configuration
const DEFAULT_CONFIG: Partial<SafeEventConfig<any>> = {
  tolerance: false,
  validateEvent: true,
  timeout: 5000,
  identifier: 'event'
};

// Configuration merger
function mergeConfig<T>(
  userConfig: SafeEventConfig<T>,
  defaults: Partial<SafeEventConfig<T>> = DEFAULT_CONFIG
): SafeEventConfig<T> {
  return {
    ...defaults,
    ...userConfig,
    // Deep merge for arrays
    allowedOrigins: userConfig.allowedOrigins || defaults.allowedOrigins,
    allowedSources: userConfig.allowedSources || defaults.allowedSources
  };
}
```

## API Evolution and Backward Compatibility

### 1. Versioning Strategy

**Purpose**: Maintain backward compatibility while evolving the API.

**Strategy**:
- Semantic versioning (MAJOR.MINOR.PATCH)
- Deprecation warnings for breaking changes
- Migration guides for major versions
- Long-term support for stable APIs

### 2. Deprecation Process

**Purpose**: Gracefully deprecate old APIs.

**Process**:
```typescript
// 1. Add deprecation warning
function deprecatedFunction() {
  console.warn('deprecatedFunction is deprecated. Use newFunction instead.');
  return newFunction();
}

// 2. Provide migration path
function newFunction() {
  // New implementation
}

// 3. Maintain backward compatibility
export { deprecatedFunction, newFunction };
```

### 3. Migration Support

**Purpose**: Help users migrate to new APIs.

**Support**:
- Migration guides
- Code examples
- Automated migration tools
- Community support

## Conclusion

The API design of Guardz Event provides multiple patterns to accommodate different use cases while maintaining consistency, type safety, and excellent developer experience. The design principles ensure that the library is both powerful and easy to use, with comprehensive error handling and flexible configuration options.

The API evolution strategy ensures that users can confidently adopt the library knowing that their code will continue to work as the library evolves, with clear migration paths for new features and improvements. 