// ===============================
// Core Type Definitions
// ===============================
export * from './types/status-types';
export * from './types/event-types';

// ===============================
// Safe Event API
// ===============================
export {
  // Core types
  EventResult,
  SafeEventConfig,
  SafeEventListenerConfig,
  ErrorContext,
  
  // New Ergonomic Event Listeners (Recommended API)
  safePostMessageListener,
  safeWebSocketListener,
  safeDOMEventListener,
  safeEventSourceListener,
  safeCustomEventListener,
  safeStorageEventListener,
  
  // Pattern 1: Curried Functions (Legacy API)
  safeDOMEvent,
  safePostMessage,
  safeWebSocket,
  safeEventSource,
  safeCustomEvent,
  safeStorageEvent,
  
  // Pattern 2: Configuration-first
  safeEvent,
  
  // Pattern 3: Fluent API Builder
  SafeEventBuilder,
  safe,
  
  // Pattern 4: Context API
  SafeEventContext,
  SafeEventContextConfig,
  createSafeEventContext,
  
  // Utility types and functions
  InferEventDataType,
  createTypedSafeDOMEvent,
  createTypedSafePostMessage,
  createTypedSafeWebSocket,
  createTypedSafeEventSource,
  createTypedSafeCustomEvent,
  createTypedSafeStorageEvent
} from './utils/safe-event-never-throws';

// ===============================
// Additional Event Sources
// ===============================
export * from './utils/additional-sources'; 