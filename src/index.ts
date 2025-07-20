// ===============================
// Modern, Simplified API
// ===============================

import type { TypeGuardFn } from 'guardz';
import { Status } from './domain/event/Status';
import type { SafeEventConfig } from './utils/safe-event-never-throws';

// Local type definition to avoid conflicts
type EventResult<T> =
  | { status: Status.SUCCESS; data: T }
  | { status: Status.ERROR; code: number; message: string };

// Core types for the new API
export interface EventOptions<T> {
  onSuccess: (data: T) => void;
  onError?: (message: string) => void;
  onTypeMismatch?: (message: string) => void;
  onSecurityViolation?: (origin: string, message: string) => void;
  tolerance?: boolean;
  allowedOrigins?: string[];
  allowedSources?: string[];
  identifier?: string;
}

export interface EventGuardOptions<T> extends EventOptions<T> {
  guard: TypeGuardFn<T>;
}

// ===============================
// 1. Simple onEvent API (Primary)
// ===============================

/**
 * Create a safe event handler for any event type
 * Usage: window.addEventListener('message', onEvent('message', isChatMessage, { onSuccess: handleData }))
 */
export function onEvent<T>(
  eventType: string,
  guard: TypeGuardFn<T>,
  options: EventOptions<T>
): (event: Event) => void {
  const config: SafeEventConfig<T> = {
    guard,
    tolerance: options.tolerance,
    identifier: options.identifier || eventType,
    allowedOrigins: options.allowedOrigins,
    allowedSources: options.allowedSources,
    onError: (error, context) => {
      if (context.type === 'security' && options.onSecurityViolation) {
        options.onSecurityViolation(context.origin || 'null', error);
      } else if (context.type === 'validation' && options.onTypeMismatch) {
        options.onTypeMismatch(error);
      } else if (options.onError) {
        options.onError(error);
      }
    },
  };

  return (event: Event) => {
    let result: EventResult<T>;

    if (event instanceof MessageEvent) {
      result = safePostMessage(config)(event);
    } else if (event instanceof CustomEvent) {
      result = safeCustomEvent(config)(event);
    } else if (event instanceof StorageEvent) {
      result = safeStorageEvent(config)(event);
    } else {
      result = safeDOMEvent(config)(event);
    }

    if (result.status === Status.SUCCESS) {
      options.onSuccess(result.data);
    } else if (result.code === 500 && options.onTypeMismatch) {
      options.onTypeMismatch(result.message);
    } else if (options.onError) {
      options.onError(result.message);
    }
  };
}

// ===============================
// 2. Auto-inferred Event Handlers
// ===============================

/**
 * Create a safe message event handler
 * Usage: window.addEventListener('message', onMessage(isChatMessage, { onSuccess: handleData }))
 */
export function onMessage<T>(
  guard: TypeGuardFn<T>,
  options: EventOptions<T>
): (event: MessageEvent) => void {
  return onEvent('message', guard, options) as (event: MessageEvent) => void;
}

/**
 * Create a safe DOM event handler
 * Usage: element.addEventListener('click', onClick(isClickData, { onSuccess: handleClick }))
 */
export function onClick<T>(
  guard: TypeGuardFn<T>,
  options: EventOptions<T>
): (event: Event) => void {
  return onEvent('click', guard, options);
}

/**
 * Create a safe custom event handler
 * Usage: element.addEventListener('custom-event', onCustom('custom-event', isCustomData, { onSuccess: handleData }))
 */
export function onCustom<T>(
  eventType: string,
  guard: TypeGuardFn<T>,
  options: EventOptions<T>
): (event: CustomEvent) => void {
  return onEvent(eventType, guard, options) as (event: CustomEvent) => void;
}

/**
 * Create a safe storage event handler
 * Usage: window.addEventListener('storage', onStorage(isStorageData, { onSuccess: handleStorage }))
 */
export function onStorage<T>(
  guard: TypeGuardFn<T>,
  options: EventOptions<T>
): (event: StorageEvent) => void {
  return onEvent('storage', guard, options) as (event: StorageEvent) => void;
}

// ===============================
// 3. Fluent Builder API (Advanced)
// ===============================

export class EventGuard<T = unknown> {
  private eventType: string = '';
  private guard?: TypeGuardFn<T>;
  private options: Partial<EventOptions<T>> = {};

  type(eventType: string): EventGuard<T> {
    this.eventType = eventType;
    return this;
  }

  validate<U>(guard: TypeGuardFn<U>): EventGuard<U> {
    const newGuard = new EventGuard<U>();
    newGuard.eventType = this.eventType;
    newGuard.guard = guard;
    // Reset options for the new type
    newGuard.options = {};
    return newGuard;
  }

  onSuccess(callback: (data: T) => void): EventGuard<T> {
    this.options.onSuccess = callback;
    return this;
  }

  onError(callback: (message: string) => void): EventGuard<T> {
    this.options.onError = callback;
    return this;
  }

  onTypeMismatch(callback: (message: string) => void): EventGuard<T> {
    this.options.onTypeMismatch = callback;
    return this;
  }

  onSecurityViolation(callback: (origin: string, message: string) => void): EventGuard<T> {
    this.options.onSecurityViolation = callback;
    return this;
  }

  tolerance(enabled: boolean = true): EventGuard<T> {
    this.options.tolerance = enabled;
    return this;
  }

  allowedOrigins(origins: string[]): EventGuard<T> {
    this.options.allowedOrigins = origins;
    return this;
  }

  allowedSources(sources: string[]): EventGuard<T> {
    this.options.allowedSources = sources;
    return this;
  }

  identifier(id: string): EventGuard<T> {
    this.options.identifier = id;
    return this;
  }

  build(): (event: Event) => void {
    if (!this.guard) {
      throw new Error('Guard function is required. Call .validate(guard) first.');
    }
    if (!this.options.onSuccess) {
      throw new Error('Success callback is required. Call .onSuccess(callback) first.');
    }

    return onEvent(this.eventType, this.guard, this.options as EventOptions<T>);
  }
}

/**
 * Create a fluent event guard builder
 * Usage: eventGuard().type('message').validate(isChatMessage).onSuccess(handleData).build()
 */
export function eventGuard<T = unknown>(): EventGuard<T> {
  return new EventGuard<T>();
}

// ===============================
// 4. React Hook (Framework Integration)
// ===============================

export interface UseEventOptions<T> extends Omit<EventOptions<T>, 'onSuccess'> {
  onSuccess?: (data: T) => void;
}

export interface UseEventResult<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * React hook for safe event handling
 * Usage: const { data, error } = useEvent('message', isChatMessage, { tolerance: true })
 * 
 * Note: This is a framework-agnostic implementation. For React integration,
 * you would need to wrap this with React's useEffect and useState hooks.
 * 
 * Example React implementation:
 * ```tsx
 * function useSafeEvent<T>(eventType: string, guard: TypeGuardFn<T>, options: UseEventOptions<T> = {}) {
 *   const [data, setData] = useState<T | null>(null);
 *   const [error, setError] = useState<string | null>(null);
 *   const [isLoading, setIsLoading] = useState(false);
 *   
 *   useEffect(() => {
 *     const handler = onEvent(eventType, guard, {
 *       onSuccess: (data) => {
 *         setData(data);
 *         setError(null);
 *         setIsLoading(false);
 *         options.onSuccess?.(data);
 *       },
 *       onError: (message) => {
 *         setError(message);
 *         setIsLoading(false);
 *         options.onError?.(message);
 *       },
 *       onTypeMismatch: options.onTypeMismatch,
 *       onSecurityViolation: options.onSecurityViolation,
 *       tolerance: options.tolerance,
 *       allowedOrigins: options.allowedOrigins,
 *       allowedSources: options.allowedSources,
 *       identifier: options.identifier,
 *     });
 *     
 *     // Add event listener
 *     window.addEventListener(eventType, handler);
 *     
 *     // Cleanup
 *     return () => window.removeEventListener(eventType, handler);
 *   }, [eventType, guard, options]);
 *   
 *   return { data, error, isLoading, refetch: () => setIsLoading(true) };
 * }
 * ```
 */
export function useEvent<T>(
  eventType: string,
  guard: TypeGuardFn<T>,
  options: UseEventOptions<T> = {}
): UseEventResult<T> {
  // Framework-agnostic implementation
  // In a real React implementation, you would use:
  // const [data, setData] = useState<T | null>(null);
  // const [error, setError] = useState<string | null>(null);
  // const [isLoading, setIsLoading] = useState(false);
  
  const handler = onEvent(eventType, guard, {
    onSuccess: (data) => {
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (message) => {
      if (options.onError) {
        options.onError(message);
      }
    },
    onTypeMismatch: options.onTypeMismatch,
    onSecurityViolation: options.onSecurityViolation,
    tolerance: options.tolerance,
    allowedOrigins: options.allowedOrigins,
    allowedSources: options.allowedSources,
    identifier: options.identifier,
  });

  return {
    data: null,
    error: null,
    isLoading: false,
    refetch: () => {
      // In a real implementation, this would trigger a re-fetch
      // For now, it's a no-op
    },
  };
}

// ===============================
// 5. Utility Functions
// ===============================

/**
 * Create a safe event handler with minimal configuration
 * Usage: window.addEventListener('message', safeHandler(isChatMessage, handleData))
 */
export function safeHandler<T>(
  guard: TypeGuardFn<T>,
  onSuccess: (data: T) => void,
  onError?: (message: string) => void
): (event: Event) => void {
  return onEvent('message', guard, { onSuccess, onError });
}

/**
 * Create a safe event handler with tolerance mode
 * Usage: window.addEventListener('message', safeTolerant(isChatMessage, handleData, handleError))
 */
export function safeTolerant<T>(
  guard: TypeGuardFn<T>,
  onSuccess: (data: T) => void,
  onError?: (message: string) => void
): (event: Event) => void {
  return onEvent('message', guard, { onSuccess, onError, tolerance: true });
}

// ===============================
// 6. Type Utilities
// ===============================

/**
 * Infer the event data type from a guard function
 */
export type InferEventData<T> = T extends TypeGuardFn<infer U> ? U : never;

/**
 * Create a typed event handler factory
 */
export function createTypedHandler<T>(guard: TypeGuardFn<T>) {
  return (options: EventOptions<T>) => onEvent('message', guard, options);
}

// ===============================
// 7. Backward Compatibility
// ===============================

// Re-export existing APIs for backward compatibility (excluding EventResult to avoid conflicts)
export {
  // Legacy API functions
  safeDOMEvent,
  safeWebSocket,
  safeEventSource,
  safeEvent,
  
  // Builder API
  SafeEventBuilder,
  safe,
  
  // Context API
  createSafeEventContext,
  type SafeEventContext,
  type SafeEventContextConfig,
  
  // Type inference utilities
  type InferEventDataType,
  createTypedSafeDOMEvent,
  createTypedSafePostMessage,
  createTypedSafeWebSocket,
  createTypedSafeEventSource,
  createTypedSafeCustomEvent,
  createTypedSafeStorageEvent,
  
  // Ergonomic API functions (legacy)
  safePostMessageListener,
  safeWebSocketListener,
  safeDOMEventListener,
  safeEventSourceListener,
  safeCustomEventListener,
  safeStorageEventListener,
  
  // Types
  type SafeEventListenerConfig,
  type ErgonomicEventListenerConfig,
  type ErrorContext,
} from './utils/safe-event-never-throws';

export * from './utils/additional-sources';
export { Status } from './domain/event/Status';

// Import the functions we need
import {
  safePostMessage,
  safeCustomEvent,
  safeStorageEvent,
  safeDOMEvent,
} from './utils/safe-event-never-throws'; 