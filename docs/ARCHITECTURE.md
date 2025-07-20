# Guardz Event Architecture Documentation

## Overview

Guardz Event is a type-safe event handling library built with a clean architecture approach, providing runtime validation for unsafe data from various event sources. The library follows Domain-Driven Design (DDD) principles and implements multiple API patterns to accommodate different use cases.

## Architecture Principles

### 1. Clean Architecture
The library follows Clean Architecture principles with clear separation of concerns:

- **Domain Layer**: Core business logic and types
- **Application Layer**: Use cases and event handlers
- **Infrastructure Layer**: External integrations and utilities
- **Shared Layer**: Common utilities and types

### 2. Type Safety First
- Full TypeScript support with runtime validation
- Generic type parameters for maximum flexibility
- Discriminated unions for type-safe results

### 3. Error Handling
- Graceful error handling without crashes
- Comprehensive error types and messages
- Tolerance mode for partial data validation

### 4. Security by Design
- Origin and source validation
- Security-first approach to event handling
- Clear separation of trusted and untrusted data

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Public API Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Ergonomic API  │  Legacy API  │  Builder API  │ Context API │
├─────────────────────────────────────────────────────────────┤
│                 Application Layer                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │PostMessage  │ │WebSocket    │ │DOM Events   │            │
│  │Listeners    │ │Listeners    │ │Listeners    │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│                   Domain Layer                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │Event Types  │ │Status       │ │Validation   │            │
│  │             │ │Enums        │ │Rules        │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│                Infrastructure Layer                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │Safe Event   │ │Additional   │ │Guardz       │            │
│  │Core         │ │Sources      │ │Integration  │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## Layer Details

### 1. Public API Layer

The public API layer provides multiple interfaces for different use cases:

#### Ergonomic API (Recommended)
```typescript
// Callback-based, no manual result handling
const handler = safePostMessageListener(
  isUserMessage,
  {
    onSuccess: (data) => console.log(data),
    onTypeMismatch: (error) => console.warn(error),
    onSecurityViolation: (origin, message) => console.error(message)
  }
);
```

#### Legacy API
```typescript
// Result-based, manual handling
const handler = safePostMessage({ guard: isUserMessage });
const result = handler(event);
if (result.status === Status.SUCCESS) {
  // Handle success
}
```

#### Builder API
```typescript
// Fluent interface
const handler = safe()
  .postMessage()
  .guard(isUserMessage)
  .allowedOrigins(['https://trusted.com'])
  .createHandler();
```

#### Context API
```typescript
// Shared configuration
const context = createSafeEventContext({
  allowedOrigins: ['https://trusted.com']
});
const handler = context.postMessage({ guard: isUserMessage });
```

### 2. Application Layer

The application layer contains event-specific handlers and use cases:

#### Event Listeners
- **PostMessageListener**: Cross-origin communication
- **WebSocketListener**: Real-time bidirectional communication
- **DOMEventListener**: DOM event handling
- **EventSourceListener**: Server-sent events
- **CustomEventListener**: Application-specific events
- **StorageEventListener**: Storage change events

#### Handler Responsibilities
1. **Event Validation**: Validate event structure and data
2. **Security Validation**: Check origins and sources
3. **Type Validation**: Runtime type checking with guardz
4. **Error Handling**: Graceful error management
5. **Result Processing**: Return type-safe results

### 3. Domain Layer

The domain layer contains core business logic and types:

#### Event Types
```typescript
// Core event result type
type EventResult<T> = 
  | { status: Status.SUCCESS; data: T }
  | { status: Status.ERROR; code: number; message: string };

// Status enumeration
enum Status {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
```

#### Validation Rules
- Type guard functions for runtime validation
- Security validation rules for origins and sources
- Tolerance mode rules for partial data

### 4. Infrastructure Layer

The infrastructure layer handles external integrations and utilities:

#### Safe Event Core (`safe-event-never-throws.ts`)
- Core validation logic
- Error handling mechanisms
- Security validation
- Tolerance mode implementation

#### Additional Sources (`additional-sources.ts`)
- Observer-based event sources
- Device API integrations
- Service Worker and Broadcast Channel support
- Payment and system API support

#### Guardz Integration
- Runtime type validation
- Type guard generation
- Performance optimizations

## Data Flow

### 1. Event Processing Flow

```
Event Source → Event Listener → Validation → Result → Callback
     ↓              ↓              ↓         ↓         ↓
  MessageEvent → PostMessage → Type Check → Success → onSuccess
     ↓              ↓              ↓         ↓         ↓
  WebSocket → WebSocket → Security → Error → onTypeMismatch
     ↓              ↓              ↓         ↓         ↓
  DOM Event → DOM Event → Tolerance → Result → onError
```

### 2. Validation Pipeline

```
1. Event Structure Validation
   ↓
2. Security Validation (Origin/Source)
   ↓
3. Type Validation (guardz)
   ↓
4. Tolerance Mode Processing
   ↓
5. Result Generation
```

### 3. Error Handling Flow

```
Error Occurs → Error Classification → Error Context → Callback
     ↓              ↓                    ↓            ↓
Validation → Type Error → Validation Context → onTypeMismatch
     ↓              ↓                    ↓            ↓
Security → Security Error → Security Context → onSecurityViolation
     ↓              ↓                    ↓            ↓
Unknown → Unknown Error → Error Context → onError
```

## Security Architecture

### 1. Origin Validation
```typescript
// Validate message origins for PostMessage
if (config.allowedOrigins && !config.allowedOrigins.includes(event.origin)) {
  // Security violation
}
```

### 2. Source Validation
```typescript
// Validate message sources for additional security
if (config.allowedSources && !isValidSource(event.source)) {
  // Security violation
}
```

### 3. Type Validation
```typescript
// Runtime type checking with guardz
if (!config.guard(event.data)) {
  // Type mismatch
}
```

## Performance Considerations

### 1. Synchronous Validation
- All validation is synchronous for minimal latency
- No async operations in the critical path
- Immediate error reporting

### 2. Memory Management
- Minimal object creation
- Efficient error context objects
- Garbage collection friendly

### 3. Bundle Size
- Tree-shakable exports
- Minimal dependencies
- Efficient code splitting

## Extensibility

### 1. Adding New Event Sources
```typescript
// 1. Create event listener in application layer
export function safeNewEventSource<T>(config: SafeEventConfig<T>) {
  return (event: NewEventType): EventResult<T> => {
    // Implementation
  };
}

// 2. Add to public API
export { safeNewEventSource } from './application/listeners/NewEventSourceListener';

// 3. Add to builder API
newEventSource(): SafeEventBuilder<T> {
  this.eventType = 'newEventSource';
  return this;
}
```

### 2. Custom Validation Rules
```typescript
// Extend validation with custom rules
const customConfig = {
  ...baseConfig,
  customValidation: (data: any) => boolean,
  customErrorHandler: (error: CustomError) => void
};
```

### 3. Plugin System
```typescript
// Future: Plugin system for custom integrations
const plugin = {
  name: 'custom-plugin',
  validate: (data: any) => boolean,
  transform: (data: any) => any
};
```

## Testing Strategy

### 1. Unit Tests
- Individual function testing
- Mock event objects
- Error scenario coverage

### 2. Integration Tests
- End-to-end event handling
- Real browser APIs
- Cross-origin scenarios

### 3. Performance Tests
- Validation performance
- Memory usage
- Bundle size analysis

## Deployment Architecture

### 1. Build Process
```
TypeScript → Compilation → Bundle → Distribution
     ↓           ↓           ↓          ↓
Source Code → JavaScript → Optimized → NPM Package
```

### 2. Distribution
- CommonJS and ES modules
- TypeScript declarations
- Source maps for debugging

### 3. Versioning
- Semantic versioning
- Guardz ecosystem alignment
- Backward compatibility

## Monitoring and Observability

### 1. Error Tracking
- Comprehensive error types
- Error context information
- Stack trace preservation

### 2. Performance Monitoring
- Validation timing
- Memory usage tracking
- Bundle size monitoring

### 3. Security Monitoring
- Security violation tracking
- Origin validation failures
- Source validation failures

## Future Architecture Considerations

### 1. Micro-frontend Support
- Cross-frame communication
- Shared validation rules
- Centralized security policies

### 2. Server-Side Rendering
- Isomorphic validation
- Universal type guards
- Shared security rules

### 3. Real-time Collaboration
- Multi-user event handling
- Conflict resolution
- Synchronization strategies

## Conclusion

The Guardz Event architecture provides a robust, type-safe, and secure foundation for event handling in modern web applications. The clean separation of concerns, comprehensive error handling, and multiple API patterns make it suitable for a wide range of use cases while maintaining high performance and security standards. 