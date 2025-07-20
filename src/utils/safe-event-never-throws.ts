import { guardWithTolerance } from 'guardz';
import type { TypeGuardFn, TypeGuardFnConfig } from 'guardz';
import { Status } from '../types/status-types';

export { Status };

// Local type definitions
interface SecurityError {
  code: 'SECURITY_ERROR';
  message: string;
  origin: string;
}

export type EventResult<T> = 
  | { status: Status.SUCCESS; data: T }
  | { status: Status.ERROR; code: number; message: string };

/**
 * Configuration for safe event handling that never throws
 */
export interface SafeEventConfig<T> {
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

/**
 * Configuration for ergonomic event listeners
 */
export interface SafeEventListenerConfig<T> {
  /** Type guard function to validate event data */
  guard: TypeGuardFn<T>;
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
}

/**
 * Configuration for ergonomic event listeners (without guard parameter)
 */
export interface ErgonomicEventListenerConfig<T> {
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
}

export interface ErrorContext {
  type: 'validation' | 'security' | 'timeout' | 'unknown';
  eventType: string;
  origin?: string;
  source?: string;
  originalError?: unknown;
}

// ===============================
// Ergonomic Event Listeners (New API)
// ===============================

/**
 * Safe PostMessage event listener with callback-based API
 * Usage: window.addEventListener('message', safePostMessageListener(isUserMessage, { tolerance: true, onTypeMismatch: console.warn }));
 */
export function safePostMessageListener<T>(
  guard: TypeGuardFn<T>,
  config: ErgonomicEventListenerConfig<T> & {
    onSuccess: (data: T) => void;
    onError?: (result: { status: Status.ERROR; code: number; message: string }) => void;
  }
) {
  return (event: MessageEvent): void => {
    // Handle null/undefined events
    if (!event) {
      if (config.onError) {
        config.onError('Invalid event: Event is null or undefined', {
          type: 'unknown',
          eventType: 'message'
        });
      }
      return;
    }

    // Check for security violations first
    if (config.allowedOrigins && !config.allowedOrigins.includes(event.origin)) {
      const errorMessage = `PostMessage origin not allowed: ${event.origin}`;
      if (config.onSecurityViolation) {
        config.onSecurityViolation(event.origin, errorMessage);
      } else if (config.onError) {
        config.onError(errorMessage, {
          type: 'security',
          eventType: 'message',
          origin: event.origin
        });
      }
      return;
    }

    const result = executePostMessageValidation(event, {
      guard,
      tolerance: config.tolerance,
      allowedOrigins: config.allowedOrigins,
      allowedSources: config.allowedSources,
      onError: (error, context) => {
        // In tolerance mode, call onTypeMismatch for validation errors
        if (config.tolerance && context.type === 'validation' && config.onTypeMismatch) {
          config.onTypeMismatch(error);
        } else if (config.onError) {
          config.onError(error, context);
        }
      }
    });

    if (result.status === Status.SUCCESS) {
      config.onSuccess(result.data);
    } else {
      if (result.code === 500 && config.onTypeMismatch) {
        config.onTypeMismatch(result.message);
      } else if (config.onError) {
        config.onError(result);
      }
    }
  };
}

/**
 * Safe WebSocket event listener with callback-based API
 * Usage: ws.addEventListener('message', safeWebSocketListener(isWSData, { onSuccess: handleWSData }));
 */
export function safeWebSocketListener<T>(
  guard: TypeGuardFn<T>,
  config: ErgonomicEventListenerConfig<T> & {
    onSuccess: (data: T) => void;
    onError?: (result: { status: Status.ERROR; code: number; message: string }) => void;
  }
) {
  return (event: MessageEvent): void => {
    const result = executeWebSocketValidation(event, {
      guard,
      tolerance: config.tolerance,
      allowedOrigins: config.allowedOrigins,
      allowedSources: config.allowedSources,
      onError: (error, context) => {
        // In tolerance mode, call onTypeMismatch for validation errors
        if (config.tolerance && context.type === 'validation' && config.onTypeMismatch) {
          config.onTypeMismatch(error);
        } else if (config.onError) {
          config.onError(error, context);
        }
      }
    });

    if (result.status === Status.SUCCESS) {
      config.onSuccess(result.data);
    } else {
      if (result.code === 500 && config.onTypeMismatch) {
        config.onTypeMismatch(result.message);
      } else if (config.onError) {
        config.onError(result);
      }
    }
  };
}

/**
 * Safe DOM event listener with callback-based API
 * Usage: element.addEventListener('click', safeDOMEventListener(isClickData, { onSuccess: handleClick }));
 */
export function safeDOMEventListener<T>(
  guard: TypeGuardFn<T>,
  config: ErgonomicEventListenerConfig<T> & {
    onSuccess: (data: T) => void;
    onError?: (result: { status: Status.ERROR; code: number; message: string }) => void;
  }
) {
  return (event: Event): void => {
    const result = executeEventValidation(event, {
      guard,
      tolerance: config.tolerance,
      allowedOrigins: config.allowedOrigins,
      allowedSources: config.allowedSources,
      onError: config.onError
    });

    if (result.status === Status.SUCCESS) {
      config.onSuccess(result.data);
    } else {
      if (result.code === 500 && config.onTypeMismatch) {
        config.onTypeMismatch(result.message);
      } else if (config.onError) {
        config.onError(result);
      }
    }
  };
}

/**
 * Safe EventSource event listener with callback-based API
 * Usage: eventSource.addEventListener('message', safeEventSourceListener(isSSEData, { onSuccess: handleSSEData }));
 */
export function safeEventSourceListener<T>(
  guard: TypeGuardFn<T>,
  config: ErgonomicEventListenerConfig<T> & {
    onSuccess: (data: T) => void;
    onError?: (result: { status: Status.ERROR; code: number; message: string }) => void;
  }
) {
  return (event: MessageEvent): void => {
    const result = executeEventSourceValidation(event, {
      guard,
      tolerance: config.tolerance,
      allowedOrigins: config.allowedOrigins,
      allowedSources: config.allowedSources,
      onError: config.onError
    });

    if (result.status === Status.SUCCESS) {
      config.onSuccess(result.data);
    } else {
      if (result.code === 500 && config.onTypeMismatch) {
        config.onTypeMismatch(result.message);
      } else if (config.onError) {
        config.onError(result);
      }
    }
  };
}

/**
 * Safe Custom event listener with callback-based API
 * Usage: element.addEventListener('custom-event', safeCustomEventListener(isCustomData, { onSuccess: handleCustomData }));
 */
export function safeCustomEventListener<T>(
  guard: TypeGuardFn<T>,
  config: ErgonomicEventListenerConfig<T> & {
    onSuccess: (data: T) => void;
    onError?: (result: { status: Status.ERROR; code: number; message: string }) => void;
  }
) {
  return (event: CustomEvent): void => {
    const result = executeCustomEventValidation(event, {
      guard,
      tolerance: config.tolerance,
      allowedOrigins: config.allowedOrigins,
      allowedSources: config.allowedSources,
      onError: config.onError
    });

    if (result.status === Status.SUCCESS) {
      config.onSuccess(result.data);
    } else {
      if (result.code === 500 && config.onTypeMismatch) {
        config.onTypeMismatch(result.message);
      } else if (config.onError) {
        config.onError(result);
      }
    }
  };
}

/**
 * Safe Storage event listener with callback-based API
 * Usage: window.addEventListener('storage', safeStorageEventListener(isStorageData, { onSuccess: handleStorageData }));
 */
export function safeStorageEventListener<T>(
  guard: TypeGuardFn<T>,
  config: ErgonomicEventListenerConfig<T> & {
    onSuccess: (data: T) => void;
    onError?: (result: { status: Status.ERROR; code: number; message: string }) => void;
  }
) {
  return (event: StorageEvent): void => {
    const result = executeStorageEventValidation(event, {
      guard,
      tolerance: config.tolerance,
      allowedOrigins: config.allowedOrigins,
      allowedSources: config.allowedSources,
      onError: config.onError
    });

    if (result.status === Status.SUCCESS) {
      config.onSuccess(result.data);
    } else {
      if (result.code === 500 && config.onTypeMismatch) {
        config.onTypeMismatch(result.message);
      } else if (config.onError) {
        config.onError(result);
      }
    }
  };
}

// ===============================
// Pattern 1: Curried Functions (Original API - Kept for backward compatibility)
// ===============================

/**
 * Safe DOM event listener
 * Usage: const safeClickHandler = safeDOMEvent({ guard: isClickData });
 *        element.addEventListener('click', safeClickHandler);
 */
export function safeDOMEvent<T>(config: SafeEventConfig<T>) {
  return (event: Event): EventResult<T> => {
    return executeEventValidation(event, config);
  };
}

/**
 * Safe PostMessage handler
 * Usage: const safeMessageHandler = safePostMessage({ guard: isMessageData });
 *        window.addEventListener('message', safeMessageHandler);
 */
export function safePostMessage<T>(config: SafeEventConfig<T>) {
  return (event: MessageEvent): EventResult<T> => {
    return executePostMessageValidation(event, config);
  };
}

/**
 * Safe WebSocket message handler
 * Usage: const safeWSHandler = safeWebSocket({ guard: isWSData });
 *        ws.addEventListener('message', safeWSHandler);
 */
export function safeWebSocket<T>(config: SafeEventConfig<T>) {
  return (event: MessageEvent): EventResult<T> => {
    return executeWebSocketValidation(event, config);
  };
}

/**
 * Safe EventSource message handler
 * Usage: const safeSSEHandler = safeEventSource({ guard: isSSEData });
 *        eventSource.addEventListener('message', safeSSEHandler);
 */
export function safeEventSource<T>(config: SafeEventConfig<T>) {
  return (event: MessageEvent): EventResult<T> => {
    return executeEventSourceValidation(event, config);
  };
}

/**
 * Safe Custom Event handler
 * Usage: const safeCustomHandler = safeCustomEvent({ guard: isCustomData });
 *        element.addEventListener('custom-event', safeCustomHandler);
 */
export function safeCustomEvent<T>(config: SafeEventConfig<T>) {
  return (event: CustomEvent): EventResult<T> => {
    return executeCustomEventValidation(event, config);
  };
}

/**
 * Safe Storage Event handler
 * Usage: const safeStorageHandler = safeStorageEvent({ guard: isStorageData });
 *        window.addEventListener('storage', safeStorageHandler);
 */
export function safeStorageEvent<T>(config: SafeEventConfig<T>) {
  return (event: StorageEvent): EventResult<T> => {
    return executeStorageEventValidation(event, config);
  };
}

// ===============================
// Pattern 2: Configuration-first
// ===============================

/**
 * Generic safe event handler
 * Usage: const result = await safeEvent({ event, guard: isEventData });
 */
export async function safeEvent<T>(
  eventConfig: { event: Event } & SafeEventConfig<T>
): Promise<EventResult<T>> {
  const { event, guard, tolerance, identifier, onError, validateEvent, timeout, allowedOrigins, allowedSources } = eventConfig;
  
  return executeEventValidation(event, {
    guard,
    tolerance,
    identifier,
    onError,
    validateEvent,
    timeout,
    allowedOrigins,
    allowedSources
  });
}

// ===============================
// Pattern 3: Fluent API Builder
// ===============================

export class SafeEventBuilder<T = unknown> {
  private config: Partial<SafeEventConfig<T>> = {};
  private eventType: string = '';

  domEvent(eventType: string): SafeEventBuilder<T> {
    this.eventType = eventType;
    return this;
  }

  postMessage(): SafeEventBuilder<T> {
    this.eventType = 'postmessage';
    return this;
  }

  webSocket(): SafeEventBuilder<T> {
    this.eventType = 'websocket';
    return this;
  }

  eventSource(): SafeEventBuilder<T> {
    this.eventType = 'eventsource';
    return this;
  }

  customEvent(eventType: string): SafeEventBuilder<T> {
    this.eventType = eventType;
    return this;
  }

  storageEvent(): SafeEventBuilder<T> {
    this.eventType = 'storage';
    return this;
  }

  guard<U>(guardFn: TypeGuardFn<U>): SafeEventBuilder<U> {
    const newBuilder = this as any as SafeEventBuilder<U>;
    newBuilder.config.guard = guardFn;
    return newBuilder;
  }

  tolerance(enabled: boolean = true): SafeEventBuilder<T> {
    this.config.tolerance = enabled;
    return this;
  }

  identifier(id: string): SafeEventBuilder<T> {
    this.config.identifier = id;
    return this;
  }

  timeout(ms: number): SafeEventBuilder<T> {
    this.config.timeout = ms;
    return this;
  }

  allowedOrigins(origins: string[]): SafeEventBuilder<T> {
    this.config.allowedOrigins = origins;
    return this;
  }

  allowedSources(sources: string[]): SafeEventBuilder<T> {
    this.config.allowedSources = sources;
    return this;
  }

  onError(callback: (error: string, context: ErrorContext) => void): SafeEventBuilder<T> {
    this.config.onError = callback;
    return this;
  }

  /**
   * Create a handler with the correct event type for the selected event source.
   */
  createHandler():
    | ((event: MessageEvent) => EventResult<T>)
    | ((event: StorageEvent) => EventResult<T>)
    | ((event: CustomEvent) => EventResult<T>)
    | ((event: Event) => EventResult<T>) {
    if (!this.config.guard) {
      throw new Error('Guard function is required. Use .guard() method to set it.');
    }
    switch (this.eventType) {
      case 'postmessage':
        return safePostMessage(this.config as SafeEventConfig<T>);
      case 'websocket':
        return safeWebSocket(this.config as SafeEventConfig<T>);
      case 'eventsource':
        return safeEventSource(this.config as SafeEventConfig<T>);
      case 'storage':
        return safeStorageEvent(this.config as SafeEventConfig<T>);
      default:
        return safeDOMEvent(this.config as SafeEventConfig<T>);
    }
  }
}

export function safe(): SafeEventBuilder {
  return new SafeEventBuilder();
}

// ===============================
// Pattern 4: Context API
// ===============================

export interface SafeEventContextConfig {
  defaultTolerance?: boolean;
  allowedOrigins?: string[];
  allowedSources?: string[];
  defaultTimeout?: number;
  onError?: (error: string, context: ErrorContext) => void;
}

export interface SafeEventContext {
  domEvent<T>(eventType: string, config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }): (event: Event) => EventResult<T>;
  postMessage<T>(config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }): (event: MessageEvent) => EventResult<T>;
  webSocket<T>(config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }): (event: MessageEvent) => EventResult<T>;
  eventSource<T>(config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }): (event: MessageEvent) => EventResult<T>;
  customEvent<T>(eventType: string, config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }): (event: CustomEvent) => EventResult<T>;
  storageEvent<T>(config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }): (event: StorageEvent) => EventResult<T>;
}

export function createSafeEventContext(contextConfig: SafeEventContextConfig = {}): SafeEventContext {
  const {
    defaultTolerance = false,
    allowedOrigins = [],
    allowedSources = [],
    defaultTimeout,
    onError
  } = contextConfig;

  const createConfig = <T>(config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }): SafeEventConfig<T> => ({
    tolerance: defaultTolerance,
    allowedOrigins,
    allowedSources,
    timeout: defaultTimeout,
    onError,
    ...config
  });

  return {
    domEvent: <T>(eventType: string, config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }) => {
      return safeDOMEvent(createConfig(config));
    },
    postMessage: <T>(config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }) => {
      return safePostMessage(createConfig(config));
    },
    webSocket: <T>(config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }) => {
      return safeWebSocket(createConfig(config));
    },
    eventSource: <T>(config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }) => {
      return safeEventSource(createConfig(config));
    },
    customEvent: <T>(eventType: string, config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }) => {
      return safeCustomEvent(createConfig(config));
    },
    storageEvent: <T>(config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }) => {
      return safeStorageEvent(createConfig(config));
    }
  };
}

// ===============================
// Core Execution Functions
// ===============================

function executeEventValidation<T>(event: Event, config: SafeEventConfig<T>): EventResult<T> {
  try {
    // Handle null/undefined events
    if (!event) {
      return {
        status: Status.ERROR,
        code: 500,
        message: 'Invalid event: Event is null or undefined'
      };
    }

    // Security validation
    if (config.allowedOrigins && event instanceof MessageEvent) {
      if (!config.allowedOrigins.includes(event.origin)) {
        const error: SecurityError = {
          code: 'SECURITY_ERROR',
          message: `Origin not allowed: ${event.origin}`,
          origin: event.origin
        };
        
        if (config.onError) {
          config.onError(error.message, {
            type: 'security',
            eventType: event.type,
            origin: event.origin
          });
        }
        
        return {
          status: Status.ERROR,
          code: 403,
          message: error.message
        };
      }
    }

    // Extract data based on event type
    let data: any;
    
    if (event instanceof MessageEvent) {
      data = event.data;
    } else if (event instanceof CustomEvent) {
      data = event.detail;
    } else if (event instanceof StorageEvent) {
      data = {
        key: event.key,
        newValue: event.newValue,
        oldValue: event.oldValue,
        url: event.url
      };
    } else {
      // DOM Event - extract specific properties based on event type
      if (event instanceof MouseEvent) {
        data = {
          clientX: event.clientX,
          clientY: event.clientY,
          button: event.button
        };
      } else {
        data = {
          type: event.type,
          target: event.target,
          currentTarget: event.currentTarget,
          eventPhase: event.eventPhase,
          bubbles: event.bubbles,
          cancelable: event.cancelable,
          defaultPrevented: event.defaultPrevented,
          composed: event.composed,
          timeStamp: event.timeStamp,
          isTrusted: event.isTrusted
        };
      }
    }

    // Validate data
    if (config.tolerance) {
      const result = guardWithTolerance(data, config.guard);
      const isValid = config.guard(result);
      
      if (isValid) {
        return {
          status: Status.SUCCESS,
          data: result
        };
      } else {
        // In tolerance mode, still return success but with error callback
        const errorMessage = `Validation failed: Data does not match expected type`;
        if (config.onError) {
          config.onError(errorMessage, {
            type: 'validation',
            eventType: event.type,
            originalError: errorMessage
          });
        }
        return {
          status: Status.SUCCESS,
          data: result
        };
      }
    } else {
      if (config.guard(data)) {
        return {
          status: Status.SUCCESS,
          data
        };
      } else {
        return {
          status: Status.ERROR,
          code: 500,
          message: `Validation failed: Data does not match expected type`
        };
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (config.onError) {
      config.onError(errorMessage, {
        type: 'unknown',
        eventType: event.type,
        originalError: error
      });
    }
    
    return {
      status: Status.ERROR,
      code: 500,
      message: errorMessage
    };
  }
}

function executePostMessageValidation<T>(event: MessageEvent, config: SafeEventConfig<T>): EventResult<T> {
  // Handle null/undefined events
  if (!event) {
    return {
      status: Status.ERROR,
      code: 500,
      message: 'Invalid event: Event is null or undefined'
    };
  }

  // Additional security checks for PostMessage
  if (config.allowedOrigins && !config.allowedOrigins.includes(event.origin)) {
    const error: SecurityError = {
      code: 'SECURITY_ERROR',
      message: `PostMessage origin not allowed: ${event.origin}`,
      origin: event.origin
    };
    
    if (config.onError) {
      config.onError(error.message, {
        type: 'security',
        eventType: 'message',
        origin: event.origin
      });
    }
    
    return {
      status: Status.ERROR,
      code: 403,
      message: error.message
    };
  }

  return executeEventValidation(event, config);
}

function executeWebSocketValidation<T>(event: MessageEvent, config: SafeEventConfig<T>): EventResult<T> {
  // WebSocket specific validation
  if (event.target instanceof WebSocket) {
    const ws = event.target;
    if (ws.readyState !== WebSocket.OPEN) {
      return {
        status: Status.ERROR,
        code: 500,
        message: `WebSocket not in OPEN state: ${ws.readyState}`
      };
    }
  }

  return executeEventValidation(event, config);
}

function executeEventSourceValidation<T>(event: MessageEvent, config: SafeEventConfig<T>): EventResult<T> {
  // EventSource specific validation
  if (event.target instanceof EventSource) {
    const es = event.target;
    if (es.readyState === EventSource.CLOSED) {
      return {
        status: Status.ERROR,
        code: 500,
        message: 'EventSource is closed'
      };
    }
  }

  return executeEventValidation(event, config);
}

function executeCustomEventValidation<T>(event: CustomEvent, config: SafeEventConfig<T>): EventResult<T> {
  return executeEventValidation(event, config);
}

function executeStorageEventValidation<T>(event: StorageEvent, config: SafeEventConfig<T>): EventResult<T> {
  return executeEventValidation(event, config);
}

// ===============================
// Utility Types and Functions
// ===============================

export type InferEventDataType<T> = T extends TypeGuardFn<infer U> ? U : never;

export function createTypedSafeDOMEvent<T>(guard: TypeGuardFn<T>) {
  return safeDOMEvent({ guard });
}

export function createTypedSafePostMessage<T>(guard: TypeGuardFn<T>) {
  return safePostMessage({ guard });
}

export function createTypedSafeWebSocket<T>(guard: TypeGuardFn<T>) {
  return safeWebSocket({ guard });
}

export function createTypedSafeEventSource<T>(guard: TypeGuardFn<T>) {
  return safeEventSource({ guard });
}

export function createTypedSafeCustomEvent<T>(guard: TypeGuardFn<T>) {
  return safeCustomEvent({ guard });
}

export function createTypedSafeStorageEvent<T>(guard: TypeGuardFn<T>) {
  return safeStorageEvent({ guard });
} 