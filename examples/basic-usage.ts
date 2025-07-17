// ===============================
// Basic Usage Examples for Guardz Event
// ===============================
// 
// This file demonstrates the ergonomic API patterns for safe event handling.
// Note: This is a documentation example - actual usage requires the guardz library.

import { 
  // New Ergonomic API (Recommended)
  safePostMessageListener, 
  safeWebSocketListener, 
  safeDOMEventListener,
  safeEventSourceListener,
  
  // Legacy API (for comparison)
  safePostMessage, 
  safeWebSocket, 
  safeDOMEvent
} from '../src/utils/safe-event-never-throws';
import { Status } from '../src/types/status-types';

// ===============================
// Mock Type Guards (for documentation purposes)
// ===============================

// In real usage, you would import these from 'guardz':
// import { isType, isString, isNumber, isBoolean, isArray } from 'guardz';

interface UserMessage {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

interface StockUpdate {
  symbol: string;
  price: number;
  change: number;
  volume: number[];
  timestamp: number;
}

interface ClickData {
  clientX: number;
  clientY: number;
  button: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

// Mock type guards (replace with real guardz imports)
const isUserMessage = (data: unknown): data is UserMessage => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).id === 'number' &&
         typeof (data as any).name === 'string' &&
         typeof (data as any).email === 'string' &&
         typeof (data as any).isActive === 'boolean';
};

const isStockUpdate = (data: unknown): data is StockUpdate => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).symbol === 'string' &&
         typeof (data as any).price === 'number' &&
         typeof (data as any).change === 'number' &&
         Array.isArray((data as any).volume) &&
         typeof (data as any).timestamp === 'number';
};

const isClickData = (data: unknown): data is ClickData => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).clientX === 'number' &&
         typeof (data as any).clientY === 'number' &&
         typeof (data as any).button === 'number' &&
         typeof (data as any).altKey === 'boolean' &&
         typeof (data as any).ctrlKey === 'boolean' &&
         typeof (data as any).shiftKey === 'boolean' &&
         typeof (data as any).metaKey === 'boolean';
};

// ===============================
// Example 1: Ergonomic PostMessage Handler (Recommended)
// ===============================

function ergonomicPostMessageExample() {
  console.log('=== Ergonomic PostMessage Example (Recommended) ===');
  
  // Create the safe event listener with callbacks
  const safeMessageHandler = safePostMessageListener(
    isUserMessage,
    {
      allowedOrigins: ['https://trusted-domain.com', 'https://api.example.com'],
      tolerance: false,
      onSuccess: (data: UserMessage) => {
        console.log('✅ Valid message received:', data);
        console.log('   User ID:', data.id);
        console.log('   User Name:', data.name);
        console.log('   User Email:', data.email);
        console.log('   Is Active:', data.isActive);
      },
      onTypeMismatch: (errorMessage: string) => {
        console.warn('⚠️  Type mismatch:', errorMessage);
      },
      onSecurityViolation: (origin: string, message: string) => {
        console.error('🚫 Security violation from', origin, ':', message);
      },
      onError: (result) => {
        console.error('❌ Unexpected error:', result.message);
      }
    }
  );

  // Direct usage - no manual result handling!
  // window.addEventListener('message', safeMessageHandler);
  
  console.log('✅ Ergonomic PostMessage handler configured');
}

// ===============================
// Example 2: Ergonomic WebSocket Handler (Recommended)
// ===============================

function ergonomicWebSocketExample() {
  console.log('\n=== Ergonomic WebSocket Example (Recommended) ===');
  
  const safeWSHandler = safeWebSocketListener(
    isStockUpdate,
    {
      tolerance: true,
      onSuccess: (data: StockUpdate) => {
        console.log('✅ Stock update received:', data);
        console.log('   Symbol:', data.symbol);
        console.log('   Price:', data.price);
        console.log('   Change:', data.change);
        console.log('   Volume:', data.volume);
        console.log('   Timestamp:', new Date(data.timestamp).toISOString());
      },
      onTypeMismatch: (errorMessage: string) => {
        console.warn('⚠️  WebSocket validation warning:', errorMessage);
      },
      onError: (result) => {
        console.error('❌ WebSocket error:', result.message);
      }
    }
  );

  // Direct usage - no manual result handling!
  // ws.addEventListener('message', safeWSHandler);
  
  console.log('✅ Ergonomic WebSocket handler configured');
}

// ===============================
// Example 3: Ergonomic DOM Event Handler (Recommended)
// ===============================

function ergonomicDOMEventExample() {
  console.log('\n=== Ergonomic DOM Event Example (Recommended) ===');
  
  const safeClickHandler = safeDOMEventListener(
    isClickData,
    {
      tolerance: false,
      onSuccess: (data: ClickData) => {
        console.log('✅ Click event processed:', data);
        console.log('   Position:', data.clientX, data.clientY);
        console.log('   Button:', data.button);
        console.log('   Ctrl pressed:', data.ctrlKey);
        console.log('   Alt pressed:', data.altKey);
        console.log('   Shift pressed:', data.shiftKey);
        console.log('   Meta pressed:', data.metaKey);
      },
      onTypeMismatch: (errorMessage: string) => {
        console.warn('⚠️  Click data validation failed:', errorMessage);
      },
      onError: (result) => {
        console.error('❌ Click event error:', result.message);
      }
    }
  );

  // Direct usage - no manual result handling!
  // button.addEventListener('click', safeClickHandler);
  
  console.log('✅ Ergonomic DOM event handler configured');
}

// ===============================
// Example 4: Legacy API Comparison
// ===============================

function legacyAPIComparison() {
  console.log('\n=== Legacy API Comparison ===');
  
  // LEGACY API (verbose, requires manual result handling)
  console.log('LEGACY API:');
  const legacyHandler = safePostMessage({ 
    guard: isUserMessage,
    allowedOrigins: ['https://trusted-domain.com']
  });

  // Usage requires manual result handling:
  // window.addEventListener('message', (event) => {
  //   const result = legacyHandler(event);
  //   if (result.status === Status.SUCCESS) {
  //     console.log('✅ Legacy API - Valid message:', result.data);
  //   } else {
  //     console.log('❌ Legacy API - Error:', result.message);
  //   }
  // });

  // NEW ERGONOMIC API (clean, callback-based)
  console.log('\nERGONOMIC API:');
  const ergonomicHandler = safePostMessageListener(
    isUserMessage,
    {
      allowedOrigins: ['https://trusted-domain.com'],
      onSuccess: (data) => {
        console.log('✅ Ergonomic API - Valid message:', data);
      },
      onTypeMismatch: (error) => {
        console.warn('⚠️  Ergonomic API - Type error:', error);
      },
      onSecurityViolation: (origin, message) => {
        console.error('🚫 Ergonomic API - Security:', message);
      }
    }
  );

  // Direct assignment - no manual result handling!
  // window.addEventListener('message', ergonomicHandler);
  
  console.log('\n✅ Comparison completed - Ergonomic API is much cleaner!');
}

// ===============================
// Example 5: Error Handling Examples
// ===============================

function errorHandlingExamples() {
  console.log('\n=== Error Handling Examples ===');
  
  // Security error example
  const securityHandler = safePostMessageListener(
    isUserMessage,
    {
      allowedOrigins: ['https://trusted-domain.com'],
      onSuccess: (data) => {
        console.log('✅ Success:', data);
      },
      onSecurityViolation: (origin, message) => {
        console.error('🚫 Security violation blocked:', message);
      },
      onTypeMismatch: (error) => {
        console.warn('⚠️  Type mismatch:', error);
      }
    }
  );

  // Validation error example
  const validationHandler = safePostMessageListener(
    isUserMessage,
    {
      allowedOrigins: ['https://trusted-domain.com'],
      onSuccess: (data) => {
        console.log('✅ Success:', data);
      },
      onSecurityViolation: (origin, message) => {
        console.error('🚫 Security violation:', message);
      },
      onTypeMismatch: (error) => {
        console.warn('⚠️  Validation failed:', error);
      }
    }
  );

  console.log('✅ Error handling examples configured');
}

// ===============================
// Example 6: Tolerance Mode Example
// ===============================

function toleranceModeExample() {
  console.log('\n=== Tolerance Mode Example ===');
  
  const tolerantHandler = safeWebSocketListener(
    isStockUpdate,
    {
      tolerance: true,
      onSuccess: (data) => {
        console.log('✅ Data processed with tolerance:', data);
        console.log('   Note: Some fields may have been coerced or defaulted');
      },
      onTypeMismatch: (errorMessage) => {
        console.warn('⚠️  Tolerance mode warning:', errorMessage);
      },
      onError: (result) => {
        console.error('❌ Even tolerance mode failed:', result.message);
      }
    }
  );

  console.log('✅ Tolerance mode example configured');
}

// ===============================
// Example 7: Real-world Usage Pattern
// ===============================

function realWorldExample() {
  console.log('\n=== Real-world Usage Pattern ===');
  
  // Define your business logic handlers
  const handleUserLogin = (userData: UserMessage) => {
    console.log('🔐 User logged in:', userData.name);
    // Update UI, store user data, etc.
  };
  
  const handleUserLogout = (userData: UserMessage) => {
    console.log('🚪 User logged out:', userData.name);
    // Clear session, update UI, etc.
  };
  
  const handleSecurityViolation = (origin: string, message: string) => {
    console.error('🚨 Security violation detected!');
    console.error('   Origin:', origin);
    console.error('   Message:', message);
    // Log to security monitoring, block origin, etc.
  };
  
  const handleValidationError = (errorMessage: string) => {
    console.warn('⚠️  Data validation failed:', errorMessage);
    // Log for debugging, send to analytics, etc.
  };
  
  // Configure the safe listener with your business logic
  const safeAuthHandler = safePostMessageListener(
    isUserMessage,
    {
      allowedOrigins: ['https://auth.example.com', 'https://api.example.com'],
      tolerance: false,
      onSuccess: (data: UserMessage) => {
        if (data.isActive) {
          handleUserLogin(data);
        } else {
          handleUserLogout(data);
        }
      },
      onSecurityViolation: handleSecurityViolation,
      onTypeMismatch: handleValidationError,
      onError: (result) => {
        console.error('❌ Unexpected auth error:', result.message);
      }
    }
  );
  
  console.log('✅ Real-world auth handler configured with business logic!');
}

// ===============================
// Run All Examples
// ===============================

function runExamples() {
  console.log('🚀 Guardz Event - Basic Usage Examples\n');
  
  ergonomicPostMessageExample();
  ergonomicWebSocketExample();
  ergonomicDOMEventExample();
  legacyAPIComparison();
  errorHandlingExamples();
  toleranceModeExample();
  realWorldExample();
  
  console.log('\n✅ All examples completed!');
  console.log('\nKey Takeaways:');
  console.log('1. ✅ Ergonomic API is much cleaner and easier to use');
  console.log('2. ✅ Direct event listener assignment - no manual result handling');
  console.log('3. ✅ Callback-based error handling with granular control');
  console.log('4. ✅ Type-safe success callbacks');
  console.log('5. ✅ Security validation built-in');
  console.log('6. ✅ Tolerance mode for graceful degradation');
  console.log('7. ✅ Legacy API still available for backward compatibility');
}

export {
  ergonomicPostMessageExample,
  ergonomicWebSocketExample,
  ergonomicDOMEventExample,
  legacyAPIComparison,
  errorHandlingExamples,
  toleranceModeExample,
  realWorldExample,
  runExamples,
};

// Run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runExamples();
} 