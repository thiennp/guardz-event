// ===============================
// Ergonomic API Examples for Guardz Event
// ===============================
//
// This file demonstrates the new ergonomic callback-based API for safe event handling.
// The ergonomic API provides a cleaner, more intuitive interface compared to the legacy result-based API.

import { 
  safePostMessageListener, 
  safeWebSocketListener, 
  safeDOMEventListener,
  safeEventSourceListener,
  safeCustomEventListener,
  safeStorageEventListener
} from '../src/utils/safe-event-never-throws';

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

interface SSEData {
  event: string;
  data: string;
  id?: string;
}

interface CustomEventData {
  action: string;
  payload: unknown;
  timestamp: number;
}

interface StorageData {
  key: string;
  oldValue: string | null;
  newValue: string | null;
  url: string;
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

const isSSEData = (data: unknown): data is SSEData => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).event === 'string' &&
         typeof (data as any).data === 'string';
};

const isCustomEventData = (data: unknown): data is CustomEventData => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).action === 'string' &&
         typeof (data as any).timestamp === 'number';
};

const isStorageData = (data: unknown): data is StorageData => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).key === 'string' &&
         typeof (data as any).url === 'string';
};

// ===============================
// Example 1: PostMessage with Security Validation
// ===============================

function postMessageExample() {
  console.log('=== PostMessage with Security Validation ===');
  
  const safeMessageHandler = safePostMessageListener(
    isUserMessage,
    {
      allowedOrigins: ['https://trusted-domain.com', 'https://api.example.com'],
      tolerance: false,
      onSuccess: (data: UserMessage) => {
        console.log('✅ Secure message received:', data);
        console.log('   User ID:', data.id);
        console.log('   User Name:', data.name);
        console.log('   User Email:', data.email);
        console.log('   Is Active:', data.isActive);
        
        // Handle the validated data
        if (data.isActive) {
          console.log('   Action: User is active - proceed with login');
        } else {
          console.log('   Action: User is inactive - proceed with logout');
        }
      },
      onTypeMismatch: (errorMessage: string) => {
        console.warn('⚠️  Type validation failed:', errorMessage);
        // Log for debugging, send to analytics
      },
      onSecurityViolation: (origin: string, message: string) => {
        console.error('🚫 Security violation from', origin, ':', message);
        // Block the origin, log to security monitoring
      },
      onError: (result) => {
        console.error('❌ Unexpected error:', result.message);
        // Handle unexpected errors
      }
    }
  );

  // Direct assignment - no manual result handling!
  // window.addEventListener('message', safeMessageHandler);
  
  console.log('✅ PostMessage handler configured with security validation');
}

// ===============================
// Example 2: WebSocket with Tolerance Mode
// ===============================

function webSocketExample() {
  console.log('\n=== WebSocket with Tolerance Mode ===');
  
  const safeWSHandler = safeWebSocketListener(
    isStockUpdate,
    {
      tolerance: true, // Allow partial data for real-time updates
      onSuccess: (data: StockUpdate) => {
        console.log('✅ Stock update received:', data);
        console.log('   Symbol:', data.symbol);
        console.log('   Price:', data.price);
        console.log('   Change:', data.change);
        console.log('   Volume:', data.volume);
        console.log('   Timestamp:', new Date(data.timestamp).toISOString());
        
        // Update UI with validated data
        updateStockDisplay(data);
      },
      onTypeMismatch: (errorMessage: string) => {
        console.warn('⚠️  WebSocket validation warning:', errorMessage);
        // Log warning but don't break functionality
        // Some fields may have been coerced or defaulted
      },
      onError: (result) => {
        console.error('❌ WebSocket error:', result.message);
        // Handle WebSocket-specific errors
      }
    }
  );

  // Direct assignment - no manual result handling!
  // ws.addEventListener('message', safeWSHandler);
  
  console.log('✅ WebSocket handler configured with tolerance mode');
}

// ===============================
// Example 3: DOM Events with Detailed Validation
// ===============================

function domEventExample() {
  console.log('\n=== DOM Events with Detailed Validation ===');
  
  const safeClickHandler = safeDOMEventListener(
    isClickData,
    {
      tolerance: false, // Strict validation for user interactions
      onSuccess: (data: ClickData) => {
        console.log('✅ Click event processed:', data);
        console.log('   Position:', data.clientX, data.clientY);
        console.log('   Button:', data.button);
        console.log('   Modifiers:');
        console.log('     Ctrl:', data.ctrlKey);
        console.log('     Alt:', data.altKey);
        console.log('     Shift:', data.shiftKey);
        console.log('     Meta:', data.metaKey);
        
        // Handle the validated click data
        handleUserClick(data);
      },
      onTypeMismatch: (errorMessage: string) => {
        console.warn('⚠️  Click data validation failed:', errorMessage);
        // Log for debugging, but don't break user interaction
      },
      onError: (result) => {
        console.error('❌ Click event error:', result.message);
        // Handle unexpected click errors
      }
    }
  );

  // Direct assignment - no manual result handling!
  // button.addEventListener('click', safeClickHandler);
  
  console.log('✅ DOM event handler configured with detailed validation');
}

// ===============================
// Example 4: EventSource (Server-Sent Events)
// ===============================

function eventSourceExample() {
  console.log('\n=== EventSource (Server-Sent Events) ===');
  
  const safeSSEHandler = safeEventSourceListener(
    isSSEData,
    {
      tolerance: true, // Allow partial SSE data
      onSuccess: (data: SSEData) => {
        console.log('✅ SSE event received:', data);
        console.log('   Event Type:', data.event);
        console.log('   Data:', data.data);
        if (data.id) {
          console.log('   Event ID:', data.id);
        }
        
        // Handle different SSE event types
        switch (data.event) {
          case 'notification':
            handleNotification(data.data);
            break;
          case 'update':
            handleUpdate(data.data);
            break;
          default:
            console.log('   Unknown event type:', data.event);
        }
      },
      onTypeMismatch: (errorMessage: string) => {
        console.warn('⚠️  SSE validation warning:', errorMessage);
        // Log warning but continue processing
      },
      onError: (result) => {
        console.error('❌ SSE error:', result.message);
        // Handle SSE-specific errors
      }
    }
  );

  // Direct assignment - no manual result handling!
  // eventSource.addEventListener('message', safeSSEHandler);
  
  console.log('✅ EventSource handler configured');
}

// ===============================
// Example 5: Custom Events
// ===============================

function customEventExample() {
  console.log('\n=== Custom Events ===');
  
  const safeCustomHandler = safeCustomEventListener(
    isCustomEventData,
    {
      tolerance: false, // Strict validation for custom events
      onSuccess: (data: CustomEventData) => {
        console.log('✅ Custom event received:', data);
        console.log('   Action:', data.action);
        console.log('   Payload:', data.payload);
        console.log('   Timestamp:', new Date(data.timestamp).toISOString());
        
        // Handle different custom actions
        switch (data.action) {
          case 'user_action':
            handleUserAction(data.payload);
            break;
          case 'system_event':
            handleSystemEvent(data.payload);
            break;
          default:
            console.log('   Unknown action:', data.action);
        }
      },
      onTypeMismatch: (errorMessage: string) => {
        console.warn('⚠️  Custom event validation failed:', errorMessage);
        // Log for debugging
      },
      onError: (result) => {
        console.error('❌ Custom event error:', result.message);
        // Handle custom event errors
      }
    }
  );

  // Direct assignment - no manual result handling!
  // element.addEventListener('custom-event', safeCustomHandler);
  
  console.log('✅ Custom event handler configured');
}

// ===============================
// Example 6: Storage Events
// ===============================

function storageEventExample() {
  console.log('\n=== Storage Events ===');
  
  const safeStorageHandler = safeStorageEventListener(
    isStorageData,
    {
      tolerance: false, // Strict validation for storage events
      onSuccess: (data: StorageData) => {
        console.log('✅ Storage event received:', data);
        console.log('   Key:', data.key);
        console.log('   Old Value:', data.oldValue);
        console.log('   New Value:', data.newValue);
        console.log('   URL:', data.url);
        
        // Handle storage changes
        if (data.key === 'user_preferences') {
          handleUserPreferencesChange(data.oldValue, data.newValue);
        } else if (data.key === 'session_data') {
          handleSessionDataChange(data.oldValue, data.newValue);
        }
      },
      onTypeMismatch: (errorMessage: string) => {
        console.warn('⚠️  Storage event validation failed:', errorMessage);
        // Log for debugging
      },
      onError: (result) => {
        console.error('❌ Storage event error:', result.message);
        // Handle storage event errors
      }
    }
  );

  // Direct assignment - no manual result handling!
  // window.addEventListener('storage', safeStorageHandler);
  
  console.log('✅ Storage event handler configured');
}

// ===============================
// Example 7: Real-world Application Pattern
// ===============================

function realWorldApplicationExample() {
  console.log('\n=== Real-world Application Pattern ===');
  
  // Define business logic handlers
  const handleUserAuthentication = (userData: UserMessage) => {
    if (userData.isActive) {
      console.log('🔐 User authenticated:', userData.name);
      // Update UI, store session, redirect, etc.
    } else {
      console.log('🚪 User logged out:', userData.name);
      // Clear session, update UI, redirect to login, etc.
    }
  };
  
  const handleSecurityThreat = (origin: string, message: string) => {
    console.error('🚨 Security threat detected!');
    console.error('   Origin:', origin);
    console.error('   Message:', message);
    // Block origin, log to security monitoring, alert admin, etc.
  };
  
  const handleDataValidationError = (errorMessage: string) => {
    console.warn('⚠️  Data validation error:', errorMessage);
    // Log to analytics, send to monitoring service, etc.
  };
  
  const handleUnexpectedError = (result: any) => {
    console.error('❌ Unexpected error:', result.message);
    // Log to error tracking service, show user-friendly message, etc.
  };
  
  // Configure comprehensive event handlers
  const authMessageHandler = safePostMessageListener(
    isUserMessage,
    {
      allowedOrigins: ['https://auth.example.com', 'https://api.example.com'],
      tolerance: false, // Strict validation for authentication
      onSuccess: handleUserAuthentication,
      onSecurityViolation: handleSecurityThreat,
      onTypeMismatch: handleDataValidationError,
      onError: handleUnexpectedError
    }
  );
  
  const realTimeDataHandler = safeWebSocketListener(
    isStockUpdate,
    {
      tolerance: true, // Allow partial data for real-time updates
      onSuccess: (data: StockUpdate) => {
        console.log('📈 Real-time stock update:', data.symbol, data.price);
        updateStockChart(data);
      },
      onTypeMismatch: (errorMessage: string) => {
        console.warn('⚠️  Real-time data warning:', errorMessage);
        // Continue with partial data
      },
      onError: handleUnexpectedError
    }
  );
  
  const userInteractionHandler = safeDOMEventListener(
    isClickData,
    {
      tolerance: false, // Strict validation for user interactions
      onSuccess: (data: ClickData) => {
        console.log('🖱️  User interaction:', data.clientX, data.clientY);
        trackUserInteraction(data);
      },
      onTypeMismatch: handleDataValidationError,
      onError: handleUnexpectedError
    }
  );
  
  // Set up event listeners
  // window.addEventListener('message', authMessageHandler);
  // ws.addEventListener('message', realTimeDataHandler);
  // document.addEventListener('click', userInteractionHandler);
  
  console.log('✅ Real-world application handlers configured');
  console.log('   - Authentication messages with security validation');
  console.log('   - Real-time data with tolerance mode');
  console.log('   - User interactions with strict validation');
}

// ===============================
// Mock Business Logic Functions
// ===============================

function updateStockDisplay(data: StockUpdate) {
  console.log('   📊 Updating stock display for', data.symbol);
}

function handleUserClick(data: ClickData) {
  console.log('   🖱️  Processing user click at', data.clientX, data.clientY);
}

function handleNotification(data: string) {
  console.log('   📢 Processing notification:', data);
}

function handleUpdate(data: string) {
  console.log('   🔄 Processing update:', data);
}

function handleUserAction(payload: unknown) {
  console.log('   👤 Processing user action:', payload);
}

function handleSystemEvent(payload: unknown) {
  console.log('   ⚙️  Processing system event:', payload);
}

function handleUserPreferencesChange(oldValue: string | null, newValue: string | null) {
  console.log('   ⚙️  User preferences changed:', { oldValue, newValue });
}

function handleSessionDataChange(oldValue: string | null, newValue: string | null) {
  console.log('   🔐 Session data changed:', { oldValue, newValue });
}

function updateStockChart(data: StockUpdate) {
  console.log('   📈 Updating stock chart for', data.symbol);
}

function trackUserInteraction(data: ClickData) {
  console.log('   📊 Tracking user interaction at', data.clientX, data.clientY);
}

// ===============================
// Run All Examples
// ===============================

function runErgonomicExamples() {
  console.log('🚀 Guardz Event - Ergonomic API Examples\n');
  
  postMessageExample();
  webSocketExample();
  domEventExample();
  eventSourceExample();
  customEventExample();
  storageEventExample();
  realWorldApplicationExample();
  
  console.log('\n✅ All ergonomic API examples completed!');
  console.log('\nKey Benefits of the Ergonomic API:');
  console.log('1. ✅ Clean callback-based interface');
  console.log('2. ✅ Direct event listener assignment');
  console.log('3. ✅ Granular error handling (security vs validation)');
  console.log('4. ✅ Type-safe success callbacks');
  console.log('5. ✅ Tolerance mode for graceful degradation');
  console.log('6. ✅ No manual result handling required');
  console.log('7. ✅ Intuitive and developer-friendly');
}

export {
  postMessageExample,
  webSocketExample,
  domEventExample,
  eventSourceExample,
  customEventExample,
  storageEventExample,
  realWorldApplicationExample,
  runErgonomicExamples,
};

// Run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runErgonomicExamples();
} 