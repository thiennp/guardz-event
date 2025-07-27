# Guardz Event - Safe Event Handling Library

A modern, type-safe event handling library that provides multiple ergonomic APIs for handling browser events with validation, security checks, and error handling. Built on top of [guardz 1.11.3](https://www.npmjs.com/package/guardz) for robust runtime type validation.

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

Create type guards for your data structures using Guardz 1.11.3's enhanced type validation:

### Basic Type Guards

```typescript
import { isString, isNumber, isBoolean, isObject } from 'guardz';

// Simple object validation
const isUserData = (data: unknown): data is { id: number; name: string } => {
  return isObject(data) && 
         isNumber((data as any).id) && 
         isString((data as any).name);
};

// Complex validation with nested objects
const isOrderData = (data: unknown): data is {
  id: string;
  items: Array<{ productId: string; quantity: number }>;
  total: number;
} => {
  if (!isObject(data)) return false;
  const order = data as any;
  
  return isString(order.id) &&
         Array.isArray(order.items) &&
         order.items.every((item: any) => 
           isString(item.productId) && 
           isNumber(item.quantity)
         ) &&
         isNumber(order.total);
};
```

### Advanced Type Guards (New in Guardz 1.11.3)

```typescript
import { isSchema, isShape, isObjectWith, toNumber, toDate } from 'guardz';

// Schema-based validation
const userSchema = {
  id: isNumber,
  name: isString,
  email: isString,
  isActive: isBoolean
};

const isUser = isSchema(userSchema);

// Shape-based validation with transformations
const isOrderWithTransform = isShape({
  id: isString,
  amount: toNumber,  // Automatically converts string to number
  createdAt: toDate, // Automatically converts string to Date
  items: isArrayWithEachItem(isObjectWith({
    productId: isString,
    quantity: isNumber
  }))
});

// Object with specific properties
const isApiResponse = isObjectWith({
  success: isBoolean,
  data: isObject,
  message: isString
});
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

## 🆕 What's New in Guardz 1.11.3

This version includes several new features and improvements:

### New Type Guards
- **`isSchema`** - Schema-based validation for complex objects
- **`isShape`** - Shape-based validation with automatic data transformation
- **`isObjectWith`** - Validate objects with specific properties
- **`isNestedType`** - Handle nested type validation
- **`isIndexSignature`** - Validate objects with index signatures

### New Utility Functions
- **`toNumber`** - Convert and validate numbers from strings
- **`toDate`** - Convert and validate Date objects from strings
- **`toBoolean`** - Convert and validate booleans from various types

### Enhanced Validation
- Better error messages and debugging information
- Improved performance for complex validations
- More flexible type checking options

## 📦 Installation

```bash
npm install guardz-event guardz@^1.11.3
# or
yarn add guardz-event guardz@^1.11.3
```

**Note**: This library requires `guardz` version 1.11.3 or higher as a peer dependency for runtime type validation.

## 📦 Bundle Size

The library is designed to be tree-shakeable. Only the APIs you use will be included in your bundle:

- **Core API only**: ~2KB gzipped
- **All APIs**: ~5KB gzipped
- **With React hooks**: ~6KB gzipped

## 🎯 Use Cases

### 1. **PostMessage Communication with Data Transformation**
```typescript
import { onMessage } from 'guardz-event';
import { isShape, toNumber, toDate } from 'guardz';

// Handle messages with automatic data transformation
const isOrderMessage = isShape({
  orderId: isString,
  amount: toNumber,      // Converts string to number
  timestamp: toDate,     // Converts string to Date
  items: isArrayWithEachItem(isObjectWith({
    productId: isString,
    quantity: toNumber
  }))
});

window.addEventListener('message', onMessage(isOrderMessage, {
  onSuccess: (data) => {
    // data.amount is now a number, data.timestamp is a Date
    console.log(`Order ${data.orderId}: $${data.amount} at ${data.timestamp}`);
  }
}));
```

### 2. **API Response Validation**
```typescript
import { onMessage } from 'guardz-event';
import { isSchema, isObjectWith } from 'guardz';

const apiResponseSchema = {
  success: isBoolean,
  data: isObject,
  message: isString
};

const isApiResponse = isSchema(apiResponseSchema);

window.addEventListener('message', onMessage(isApiResponse, {
  onSuccess: (response) => {
    if (response.success) {
      handleApiData(response.data);
    } else {
      showError(response.message);
    }
  }
}));
```

```typescript
import { onClick } from 'guardz-event';
import { isShape, isEmail, toNumber } from 'guardz';

// Enhanced form validation with automatic type conversion
const isFormData = isShape({
  email: isEmail,           // Validates email format
  name: isString,
  age: toNumber,            // Converts string to number
  preferences: isObjectWith({
    newsletter: isBoolean,
    notifications: isBoolean
  })
});

form.addEventListener('submit', onClick(isFormData, {
  onSuccess: (data) => {
    // data.age is now a number, data.email is validated
    submitForm(data);
  },
  onTypeMismatch: (error) => showValidationError(error)
}));
```

### 4. **Custom Events with Schema Validation**
```typescript
import { onCustom } from 'guardz-event';
import { isSchema } from 'guardz';

const userActionSchema = {
  action: isString,
  payload: isObject,
  timestamp: toDate
};

const isUserAction = isSchema(userActionSchema);

document.addEventListener('user-action', onCustom('user-action', isUserAction, {
  onSuccess: (data) => {
    // data.timestamp is now a Date object
    handleUserAction(data.action, data.payload, data.timestamp);
  }
}));
```

### 5. **Storage Events with Enhanced Validation**
```typescript
import { onStorage } from 'guardz-event';
import { isShape, toNumber, toBoolean } from 'guardz';

const isStorageData = isShape({
  key: isString,
  value: isString,
  oldValue: isString,
  timestamp: toNumber
});

window.addEventListener('storage', onStorage(isStorageData, {
  onSuccess: (data) => {
    // data.timestamp is now a number
    handleStorageChange(data.key, data.value, data.oldValue, data.timestamp);
  }
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