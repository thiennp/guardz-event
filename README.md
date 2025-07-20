# Guardz Event - Safe Event Handling Library

A modern, type-safe event handling library that provides multiple ergonomic APIs for handling browser events with validation, security checks, and error handling.

## 🚀 Quick Start

```typescript
import { onEvent, onMessage, safeHandler } from 'guardz-event';

// Type guard for your data
const isChatMessage = (data: unknown): data is { text: string; userId: string } => {
  return typeof data === 'object' && data !== null && 
         typeof (data as any).text === 'string' && 
         typeof (data as any).userId === 'string';
};

// Simple usage
window.addEventListener('message', onMessage(isChatMessage, {
  onSuccess: (data) => console.log('Received:', data.text),
  onError: (error) => console.error('Error:', error)
}));

// Or even simpler
window.addEventListener('message', safeHandler(isChatMessage, 
  (data) => console.log('Received:', data.text),
  (error) => console.error('Error:', error)
));
```

## 📚 API Overview

### 1. **Primary API: `onEvent`**

The main function for creating safe event handlers:

```typescript
import { onEvent } from 'guardz-event';

// For any event type
const handler = onEvent('message', isChatMessage, {
  onSuccess: (data) => { /* handle success */ },
  onError: (error) => { /* handle error */ },
  tolerance: true,
  allowedOrigins: ['https://trusted.com']
});

window.addEventListener('message', handler);
```

### 2. **Specialized Handlers**

Pre-configured handlers for common event types:

```typescript
import { onMessage, onClick, onCustom, onStorage } from 'guardz-event';

// Message events
window.addEventListener('message', onMessage(isChatMessage, {
  onSuccess: handleChatMessage
}));

// DOM events
element.addEventListener('click', onClick(isClickData, {
  onSuccess: handleClick
}));

// Custom events
element.addEventListener('user-action', onCustom('user-action', isUserAction, {
  onSuccess: handleUserAction
}));

// Storage events
window.addEventListener('storage', onStorage(isStorageData, {
  onSuccess: handleStorageChange
}));
```

### 3. **Fluent Builder API**

For complex configurations:

```typescript
import { eventGuard } from 'guardz-event';

const handler = eventGuard()
  .type('message')
  .validate(isChatMessage)
  .onSuccess(handleChatMessage)
  .onError(handleError)
  .tolerance(true)
  .allowedOrigins(['https://trusted.com'])
  .allowedSources(['chat-widget'])
  .build();

window.addEventListener('message', handler);
```

### 4. **Utility Functions**

Quick handlers for common use cases:

```typescript
import { safeHandler, safeTolerant } from 'guardz-event';

// Minimal configuration
window.addEventListener('message', safeHandler(isChatMessage, handleData, handleError));

// With tolerance mode
window.addEventListener('message', safeTolerant(isChatMessage, handleData, handleError));
```

### 5. **React Hook (Coming Soon)**

```typescript
import { useEvent } from 'guardz-event';

function ChatComponent() {
  const { data, error } = useEvent('message', isChatMessage, {
    tolerance: true,
    allowedOrigins: ['https://trusted.com']
  });

  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>Loading...</div>;
  
  return <div>Message: {data.text}</div>;
}
```

## 🔧 Configuration Options

All APIs support these options:

```typescript
interface EventOptions<T> {
  onSuccess: (data: T) => void;           // Required: Success callback
  onError?: (message: string) => void;    // Optional: General error handler
  onTypeMismatch?: (message: string) => void; // Optional: Type validation errors
  onSecurityViolation?: (origin: string, message: string) => void; // Optional: Security errors
  tolerance?: boolean;                    // Optional: Enable tolerance mode
  allowedOrigins?: string[];              // Optional: Security: allowed origins
  allowedSources?: string[];              // Optional: Security: allowed sources
  identifier?: string;                    // Optional: Custom identifier for errors
}
```

## 🛡️ Security Features

### Origin Validation

```typescript
window.addEventListener('message', onMessage(isChatMessage, {
  onSuccess: handleData,
  allowedOrigins: ['https://trusted-domain.com'],
  onSecurityViolation: (origin, message) => {
    console.warn(`Blocked message from ${origin}: ${message}`);
  }
}));
```

### Source Validation

```typescript
window.addEventListener('message', onMessage(isChatMessage, {
  onSuccess: handleData,
  allowedSources: ['trusted-widget'],
  onSecurityViolation: (origin, message) => {
    console.warn(`Blocked message from untrusted source: ${message}`);
  }
}));
```

## 🔄 Tolerance Mode

Tolerance mode allows partial data to pass through with warnings:

```typescript
window.addEventListener('message', onMessage(isChatMessage, {
  onSuccess: handleData,
  onTypeMismatch: (error) => console.warn('Partial data:', error),
  tolerance: true
}));
```

## 📝 Type Guards

Create type guards for your data structures:

```typescript
// Simple object validation
const isUserData = (data: unknown): data is { id: number; name: string } => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).id === 'number' &&
         typeof (data as any).name === 'string';
};

// Complex validation with nested objects
const isOrderData = (data: unknown): data is {
  id: string;
  items: Array<{ productId: string; quantity: number }>;
  total: number;
} => {
  if (typeof data !== 'object' || data === null) return false;
  const order = data as any;
  
  return typeof order.id === 'string' &&
         Array.isArray(order.items) &&
         order.items.every((item: any) => 
           typeof item.productId === 'string' && 
           typeof item.quantity === 'number'
         ) &&
         typeof order.total === 'number';
};
```

## 🔄 Migration from Legacy API

### Before (Legacy API)
```typescript
import { safePostMessageListener } from 'guardz-event';

window.addEventListener('message', safePostMessageListener(isChatMessage, {
  onSuccess: handleData,
  onTypeMismatch: handleTypeError,
  onSecurityViolation: handleSecurityError,
  onError: handleError
}));
```

### After (New API)
```typescript
import { onMessage } from 'guardz-event';

window.addEventListener('message', onMessage(isChatMessage, {
  onSuccess: handleData,
  onTypeMismatch: handleTypeError,
  onSecurityViolation: handleSecurityError,
  onError: handleError
}));
```

## 📦 Bundle Size

The library is designed to be tree-shakeable. Only the APIs you use will be included in your bundle:

- **Core API only**: ~2KB gzipped
- **All APIs**: ~5KB gzipped
- **With React hooks**: ~6KB gzipped

## 🎯 Use Cases

### 1. **PostMessage Communication**
```typescript
// Parent window
const iframe = document.querySelector('iframe');
iframe.contentWindow.postMessage({ type: 'chat', text: 'Hello' }, '*');

// Child window
window.addEventListener('message', onMessage(isChatMessage, {
  onSuccess: (data) => {
    if (data.type === 'chat') {
      displayMessage(data.text);
    }
  }
}));
```

### 2. **Form Validation**
```typescript
const isFormData = (data: unknown): data is { email: string; name: string } => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).email === 'string' &&
         typeof (data as any).name === 'string';
};

form.addEventListener('submit', onClick(isFormData, {
  onSuccess: (data) => submitForm(data),
  onTypeMismatch: (error) => showValidationError(error)
}));
```

### 3. **Custom Events**
```typescript
const isUserAction = (data: unknown): data is { action: string; payload: any } => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).action === 'string';
};

document.addEventListener('user-action', onCustom('user-action', isUserAction, {
  onSuccess: (data) => handleUserAction(data.action, data.payload)
}));
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details. 