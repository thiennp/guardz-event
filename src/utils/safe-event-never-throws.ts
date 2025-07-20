import type { TypeGuardFn } from 'guardz';
import { Status } from '../domain/event/Status';

export { Status };

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
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
export interface ErgonomicEventListenerConfig<T = unknown> {
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
  identifier?: string;
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
    onError?: (result: {
      status: Status.ERROR;
      code: number;
      message: string;
    }) => void;
  }
) {
  return (event: MessageEvent): void => {
    const identifier = 'postMessage';
    // Handle null/undefined events
    if (!event) {
      if (config.onError) {
        try {
          config.onError('Invalid event: Event is null or undefined', {
            type: 'unknown',
            eventType: 'message',
            identifier: identifier,
          });
        } catch {
          // Ignore callback errors
        }
      }
      return;
    }

    // Check for security violations first
    if (
      config.allowedOrigins &&
      !config.allowedOrigins.includes(event.origin)
    ) {
      const errorMessage = `PostMessage origin not allowed: ${event.origin || 'null'}`;
      if (config.onSecurityViolation) {
        try {
          config.onSecurityViolation(event.origin || 'null', errorMessage);
        } catch {
          // Ignore callback errors
        }
      } else if (config.onError) {
        try {
          config.onError(errorMessage, {
            type: 'security',
            eventType: 'message',
            origin: event.origin || 'null',
            identifier: identifier,
          });
        } catch {
          // Ignore callback errors
        }
      }
      return;
    }

    const result = executePostMessageValidation(event, {
      guard,
      tolerance: config.tolerance,
      allowedOrigins: config.allowedOrigins,
      allowedSources: config.allowedSources,
      identifier,
      onError: (error, context) => {
        // Handle security violations
        if (context.type === 'security' && config.onSecurityViolation) {
          try {
            config.onSecurityViolation(context.origin || 'null', error);
          } catch {
            // Ignore callback errors
          }
        } else if (context.type === 'validation' && config.onTypeMismatch) {
          try {
            config.onTypeMismatch(error);
          } catch {
            // Ignore callback errors
          }
        } else if (
          config.onError &&
          context.type !== 'security' &&
          context.type !== 'validation'
        ) {
          try {
            config.onError(error, context);
          } catch {
            // Ignore callback errors
          }
        }
      },
    });

    if (result.status === Status.SUCCESS) {
      try {
        config.onSuccess(result.data);
      } catch {
        // Ignore callback errors
      }
    } else {
      // In tolerance mode, validation errors should call onTypeMismatch
      if (result.code === 500 && config.onTypeMismatch) {
        try {
          config.onTypeMismatch(result.message);
        } catch {
          // Ignore callback errors
        }
      } else if (config.onError) {
        try {
          config.onError(result);
        } catch {
          // Ignore callback errors
        }
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
    onError?: (result: {
      status: Status.ERROR;
      code: number;
      message: string;
    }) => void;
  }
) {
  return (event: MessageEvent): void => {
    const identifier = 'websocket';
    const result = executeWebSocketValidation(event, {
      guard,
      tolerance: config.tolerance,
      allowedOrigins: config.allowedOrigins,
      allowedSources: config.allowedSources,
      identifier,
      onError: (error, context) => {
        // Handle security violations
        if (context.type === 'security' && config.onSecurityViolation) {
          try {
            config.onSecurityViolation(context.origin || 'null', error);
          } catch {
            // Ignore callback errors
          }
        } else if (
          context.type === 'validation' &&
          context.type === 'validation' &&
          config.onTypeMismatch
        ) {
          try {
            config.onTypeMismatch(error);
          } catch {
            // Ignore callback errors
          }
        } else if (config.onError) {
          try {
            config.onError(error, context);
          } catch {
            // Ignore callback errors
          }
        }
      },
    });

    if (result.status === Status.SUCCESS) {
      try {
        config.onSuccess(result.data);
      } catch {
        // Ignore callback errors
      }
    } else {
      // In tolerance mode, validation errors should call onTypeMismatch
      if (result.code === 500 && config.onTypeMismatch) {
        try {
          config.onTypeMismatch(result.message);
        } catch {
          // Ignore callback errors
        }
      } else if (config.onError) {
        try {
          config.onError(result);
        } catch {
          // Ignore callback errors
        }
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
    onError?: (result: {
      status: Status.ERROR;
      code: number;
      message: string;
    }) => void;
  }
) {
  return (event: Event): void => {
    const identifier = 'dom';
    const result = executeEventValidation(event, {
      guard,
      tolerance: config.tolerance,
      allowedOrigins: config.allowedOrigins,
      allowedSources: config.allowedSources,
      identifier,
      onError: (error, context) => {
        // Handle security violations
        if (context.type === 'security' && config.onSecurityViolation) {
          try {
            config.onSecurityViolation(context.origin || 'null', error);
          } catch {
            // Ignore callback errors
          }
        } else if (
          context.type === 'validation' &&
          context.type === 'validation' &&
          config.onTypeMismatch
        ) {
          try {
            config.onTypeMismatch(error);
          } catch {
            // Ignore callback errors
          }
        } else if (config.onError) {
          try {
            config.onError(error, context);
          } catch {
            // Ignore callback errors
          }
        }
      },
    });

    if (result.status === Status.SUCCESS) {
      try {
        config.onSuccess(result.data);
      } catch {
        // Ignore callback errors
      }
    } else {
      // In tolerance mode, validation errors should call onTypeMismatch
      if (result.code === 500 && config.onTypeMismatch) {
        try {
          config.onTypeMismatch(result.message);
        } catch {
          // Ignore callback errors
        }
      } else if (config.onError) {
        try {
          config.onError(result);
        } catch {
          // Ignore callback errors
        }
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
    onError?: (result: {
      status: Status.ERROR;
      code: number;
      message: string;
    }) => void;
  }
) {
  return (event: MessageEvent): void => {
    const identifier = 'eventsource';
    const result = executeEventSourceValidation(event, {
      guard,
      tolerance: config.tolerance,
      allowedOrigins: config.allowedOrigins,
      allowedSources: config.allowedSources,
      identifier,
      onError: (error, context) => {
        // Handle security violations
        if (context.type === 'security' && config.onSecurityViolation) {
          try {
            config.onSecurityViolation(context.origin || 'null', error);
          } catch {
            // Ignore callback errors
          }
        } else if (
          context.type === 'validation' &&
          context.type === 'validation' &&
          config.onTypeMismatch
        ) {
          try {
            config.onTypeMismatch(error);
          } catch {
            // Ignore callback errors
          }
        } else if (config.onError) {
          try {
            config.onError(error, context);
          } catch {
            // Ignore callback errors
          }
        }
      },
    });

    if (result.status === Status.SUCCESS) {
      try {
        config.onSuccess(result.data);
      } catch {
        // Ignore callback errors
      }
    } else {
      // In tolerance mode, validation errors should call onTypeMismatch
      if (result.code === 500 && config.onTypeMismatch) {
        try {
          config.onTypeMismatch(result.message);
        } catch {
          // Ignore callback errors
        }
      } else if (config.onError) {
        try {
          config.onError(result);
        } catch {
          // Ignore callback errors
        }
      }
    }
  };
}

/**
 * Safe CustomEvent listener with callback-based API
 * Usage: element.addEventListener('customEvent', safeCustomEventListener(isCustomData, { onSuccess: handleCustomData }));
 */
export function safeCustomEventListener<T>(
  guard: TypeGuardFn<T>,
  config: ErgonomicEventListenerConfig<T> & {
    onSuccess: (data: T) => void;
    onError?: (result: {
      status: Status.ERROR;
      code: number;
      message: string;
    }) => void;
  }
) {
  return (event: CustomEvent): void => {
    const identifier = 'customEvent';
    const result = executeCustomEventValidation(event, {
      guard,
      tolerance: config.tolerance,
      allowedOrigins: config.allowedOrigins,
      allowedSources: config.allowedSources,
      identifier,
      onError: (error, context) => {
        // Handle security violations
        if (context.type === 'security' && config.onSecurityViolation) {
          try {
            config.onSecurityViolation(context.origin || 'null', error);
          } catch {
            // Ignore callback errors
          }
        } else if (
          context.type === 'validation' &&
          context.type === 'validation' &&
          config.onTypeMismatch
        ) {
          try {
            config.onTypeMismatch(error);
          } catch {
            // Ignore callback errors
          }
        } else if (config.onError) {
          try {
            config.onError(error, context);
          } catch {
            // Ignore callback errors
          }
        }
      },
    });

    if (result.status === Status.SUCCESS) {
      try {
        config.onSuccess(result.data);
      } catch {
        // Ignore callback errors
      }
    } else {
      // In tolerance mode, validation errors should call onTypeMismatch
      if (result.code === 500 && config.onTypeMismatch) {
        try {
          config.onTypeMismatch(result.message);
        } catch {
          // Ignore callback errors
        }
      } else if (config.onError) {
        try {
          config.onError(result);
        } catch {
          // Ignore callback errors
        }
      }
    }
  };
}

/**
 * Safe StorageEvent listener with callback-based API
 * Usage: window.addEventListener('storage', safeStorageEventListener(isStorageData, { onSuccess: handleStorageData }));
 */
export function safeStorageEventListener<T>(
  guard: TypeGuardFn<T>,
  config: ErgonomicEventListenerConfig<T> & {
    onSuccess: (data: T) => void;
    onError?: (result: {
      status: Status.ERROR;
      code: number;
      message: string;
    }) => void;
  }
) {
  return (event: StorageEvent): void => {
    const identifier = 'storage';
    const result = executeStorageEventValidation(event, {
      guard,
      tolerance: config.tolerance,
      allowedOrigins: config.allowedOrigins,
      allowedSources: config.allowedSources,
      identifier,
      onError: (error, context) => {
        // Handle security violations
        if (context.type === 'security' && config.onSecurityViolation) {
          try {
            config.onSecurityViolation(context.origin || 'null', error);
          } catch {
            // Ignore callback errors
          }
        } else if (
          context.type === 'validation' &&
          context.type === 'validation' &&
          config.onTypeMismatch
        ) {
          try {
            config.onTypeMismatch(error);
          } catch {
            // Ignore callback errors
          }
        } else if (config.onError) {
          try {
            config.onError(error, context);
          } catch {
            // Ignore callback errors
          }
        }
      },
    });

    if (result.status === Status.SUCCESS) {
      try {
        config.onSuccess(result.data);
      } catch {
        // Ignore callback errors
      }
    } else {
      // In tolerance mode, validation errors should call onTypeMismatch
      if (result.code === 500 && config.onTypeMismatch) {
        try {
          config.onTypeMismatch(result.message);
        } catch {
          // Ignore callback errors
        }
      } else if (config.onError) {
        try {
          config.onError(result);
        } catch {
          // Ignore callback errors
        }
      }
    }
  };
}

// ===============================
// Legacy API (Result-based)
// ===============================

/**
 * Safe DOM event handler (legacy API)
 */
export function safeDOMEvent<T>(config: SafeEventConfig<T>) {
  return (event: Event): EventResult<T> => {
    return executeEventValidation(event, config);
  };
}

/**
 * Safe PostMessage handler (legacy API)
 */
export function safePostMessage<T>(config: SafeEventConfig<T>) {
  return (event: MessageEvent): EventResult<T> => {
    return executePostMessageValidation(event, config);
  };
}

/**
 * Safe WebSocket handler (legacy API)
 */
export function safeWebSocket<T>(config: SafeEventConfig<T>) {
  return (event: MessageEvent): EventResult<T> => {
    return executeWebSocketValidation(event, config);
  };
}

/**
 * Safe EventSource handler (legacy API)
 */
export function safeEventSource<T>(config: SafeEventConfig<T>) {
  return (event: MessageEvent): EventResult<T> => {
    return executeEventSourceValidation(event, config);
  };
}

/**
 * Safe CustomEvent handler (legacy API)
 */
export function safeCustomEvent<T>(config: SafeEventConfig<T>) {
  return (event: CustomEvent): EventResult<T> => {
    return executeCustomEventValidation(event, config);
  };
}

/**
 * Safe StorageEvent handler (legacy API)
 */
export function safeStorageEvent<T>(config: SafeEventConfig<T>) {
  return (event: StorageEvent): EventResult<T> => {
    return executeStorageEventValidation(event, config);
  };
}

/**
 * Generic safe event handler (legacy API)
 */
export async function safeEvent<T>(
  eventConfig: { event: Event } & SafeEventConfig<T>
): Promise<EventResult<T>> {
  const { event, ...config } = eventConfig;

  if (event instanceof MessageEvent) {
    return executePostMessageValidation(event, config);
  } else if (event instanceof CustomEvent) {
    return executeCustomEventValidation(event, config);
  } else if (event instanceof StorageEvent) {
    return executeStorageEventValidation(event, config);
  } else {
    return executeEventValidation(event, config);
  }
}

// ===============================
// Builder API
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
    const newBuilder = new SafeEventBuilder<U>();
    newBuilder.config = { ...this.config, guard: guardFn };
    newBuilder.eventType = this.eventType;
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

  onError(
    callback: (error: string, context: ErrorContext) => void
  ): SafeEventBuilder<T> {
    this.config.onError = callback;
    return this;
  }

  createHandler():
    | ((event: MessageEvent) => EventResult<T>)
    | ((event: StorageEvent) => EventResult<T>)
    | ((event: CustomEvent) => EventResult<T>)
    | ((event: Event) => EventResult<T>) {
    if (!this.config.guard) {
      throw new Error('Guard function is required');
    }
    // Set identifier if not already set
    if (!this.config.identifier) {
      if (this.eventType === 'postmessage')
        this.config.identifier = 'postMessage';
      else if (this.eventType) this.config.identifier = this.eventType;
    }
    const config = this.config as SafeEventConfig<T>;

    switch (this.eventType) {
      case 'postmessage':
        return safePostMessage(config);
      case 'websocket':
        return safeWebSocket(config);
      case 'eventsource':
        return safeEventSource(config);
      case 'storage':
        return safeStorageEvent(config);
      default:
        return safeDOMEvent(config);
    }
  }
}

export function safe(): SafeEventBuilder {
  return new SafeEventBuilder();
}

// ===============================
// Context API
// ===============================

export interface SafeEventContextConfig {
  defaultTolerance?: boolean;
  allowedOrigins?: string[];
  allowedSources?: string[];
  defaultTimeout?: number;
  onError?: (error: string, context: ErrorContext) => void;
}

export interface SafeEventContext {
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

export function createSafeEventContext(
  contextConfig: SafeEventContextConfig = {}
): SafeEventContext {
  const {
    defaultTolerance = false,
    allowedOrigins,
    allowedSources,
    defaultTimeout,
    onError,
  } = contextConfig;

  const createConfig = <T>(
    config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }
  ): SafeEventConfig<T> => ({
    tolerance: defaultTolerance,
    allowedOrigins,
    allowedSources,
    timeout: defaultTimeout,
    onError,
    ...config,
  });

  return {
    domEvent: <T>(
      eventType: string,
      config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }
    ) => {
      return safeDOMEvent(createConfig(config));
    },
    postMessage: <T>(
      config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }
    ) => {
      return safePostMessage(createConfig(config));
    },
    webSocket: <T>(
      config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }
    ) => {
      return safeWebSocket(createConfig(config));
    },
    eventSource: <T>(
      config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }
    ) => {
      return safeEventSource(createConfig(config));
    },
    customEvent: <T>(
      eventType: string,
      config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }
    ) => {
      return safeCustomEvent(createConfig(config));
    },
    storageEvent: <T>(
      config: Omit<SafeEventConfig<T>, 'guard'> & { guard: TypeGuardFn<T> }
    ) => {
      return safeStorageEvent(createConfig(config));
    },
  };
}

function buildErrorContext({
  type,
  eventType,
  origin,
  source,
  originalError,
  identifier,
}: Partial<ErrorContext>): ErrorContext {
  return {
    type: type || 'unknown',
    eventType: eventType || 'unknown',
    origin,
    source,
    originalError,
    identifier,
  };
}

// ===============================
// Core Validation Functions
// ===============================

/**
 * Extract data from event objects with optimized performance
 */
function extractEventData(event: Event, tolerance: boolean = false): unknown {
  // Fast path for common event types
  if (event instanceof MessageEvent) {
    return event.data;
  }

  if (event instanceof CustomEvent) {
    return event.detail;
  }

  if (event instanceof StorageEvent) {
    const data = {
      key: event.key,
      newValue: event.newValue,
      oldValue: event.oldValue,
      url: event.url,
    };
    // Only include storageArea in tolerance mode
    if (tolerance) {
      (data as any).storageArea = event.storageArea;
    }
    return data;
  }

  if (event instanceof MouseEvent) {
    return {
      clientX: event.clientX,
      clientY: event.clientY,
      button: event.button,
    };
  }

  // Generic event data extraction
  return {
    type: event.type,
    target: event.target,
    currentTarget: event.currentTarget,
    eventPhase: event.eventPhase,
    bubbles: event.bubbles,
    cancelable: event.cancelable,
    defaultPrevented: event.defaultPrevented,
    composed: event.composed,
    timeStamp: event.timeStamp,
    isTrusted: event.isTrusted,
  };
}

/**
 * Validate message security with optimized performance
 */
function validateMessageSecurity<T>(
  event: MessageEvent,
  config: SafeEventConfig<T>
): EventResult<T> | null {
  // Origin validation
  if (config.allowedOrigins && !config.allowedOrigins.includes(event.origin)) {
    const errorMessage = `Origin not allowed: ${event.origin || 'null'}`;
    if (config.onError) {
      try {
        config.onError(
          errorMessage,
          buildErrorContext({
            type: 'security',
            eventType: 'message',
            origin: event.origin || 'null',
            identifier: config.identifier || 'postMessage',
          })
        );
      } catch {
        // Ignore callback errors
      }
    }
    return {
      status: Status.ERROR,
      code: 403,
      message: errorMessage,
    };
  }

  // Source validation
  if (config.allowedSources) {
    const source = event.source;
    const isAllowedSource = config.allowedSources.some(allowedSource => {
      if (typeof allowedSource === 'string') {
        if (typeof source === 'string') {
          return source === allowedSource;
        }
        if (source && typeof source === 'object') {
          return (
            (source as any)[allowedSource] === true ||
            (source as any).name === allowedSource ||
            (source as any).id === allowedSource
          );
        }
      }
      return false;
    });

    if (!isAllowedSource) {
      const errorMessage = `Source not allowed: ${source || 'null'}`;
      if (config.onError) {
        try {
          config.onError(
            errorMessage,
            buildErrorContext({
              type: 'security',
              eventType: 'message',
              source: String(source),
              origin: event.origin || undefined,
              identifier: config.identifier || 'postMessage',
            })
          );
        } catch {
          // Ignore callback errors
        }
      }
      return {
        status: Status.ERROR,
        code: 403,
        message: errorMessage,
      };
    }
  }

  return null; // No security violation
}

/**
 * Validate event data with optimized performance
 */
function validateEventData<T>(
  data: unknown,
  event: Event,
  config: SafeEventConfig<T>
): EventResult<T> | null {
  if (config.guard(data)) {
    return null; // Validation passed
  }

  const errorMessage = `Validation failed: ${config.identifier || (event instanceof MessageEvent ? 'postMessage' : 'event data')}`;
  const errorContext = buildErrorContext({
    type: 'validation',
    eventType: event.type,
    originalError: new Error(errorMessage),
    identifier:
      config.identifier ||
      (event instanceof MessageEvent ? 'postMessage' : 'event data'),
  });

  if (config.tolerance) {
    // In tolerance mode, check if this is completely invalid data or partial data
    if (
      typeof data === 'string' ||
      typeof data === 'number' ||
      typeof data === 'boolean' ||
      data == null
    ) {
      if (config.onError) {
        try {
          config.onError(errorMessage, errorContext);
        } catch {
          // Ignore callback errors
        }
      }
      return {
        status: Status.ERROR,
        code: 500,
        message: errorMessage,
      };
    } else {
      if (config.onError) {
        try {
          config.onError(errorMessage, errorContext);
        } catch {
          // Ignore callback errors
        }
      }
      return {
        status: Status.SUCCESS,
        data: data as T,
      };
    }
  } else {
    if (config.onError) {
      try {
        config.onError(errorMessage, errorContext);
      } catch {
        // Ignore callback errors
      }
    }
    return {
      status: Status.ERROR,
      code: 500,
      message: errorMessage,
    };
  }
}

function executeEventValidation<T>(
  event: Event,
  config: SafeEventConfig<T>
): EventResult<T> {
  try {
    // Basic event validation
    if (!event || typeof event !== 'object') {
      return {
        status: Status.ERROR,
        code: 500,
        message: 'Invalid event: Event is null, undefined, or not an object',
      };
    }

    // Extract data from event using optimized data extraction
    const data = extractEventData(event, config.tolerance);

    // Security validation with optimized performance
    if (event instanceof MessageEvent) {
      const securityResult = validateMessageSecurity(event, config);
      if (securityResult) {
        return securityResult;
      }
    }

    // Type validation with optimized performance
    const validationResult = validateEventData(data, event, config);
    if (validationResult) {
      return validationResult;
    }

    return {
      status: Status.SUCCESS,
      data: data as T,
    };
  } catch (error) {
    const errorMessage = `Unexpected error during event validation: ${error instanceof Error ? error.message : String(error)}`;
    if (config.onError) {
      try {
        config.onError(
          errorMessage,
          buildErrorContext({
            type: 'unknown',
            eventType: (event as any)?.type || 'unknown',
            originalError: error,
            identifier:
              config.identifier ||
              (event instanceof MessageEvent ? 'postMessage' : 'event data'),
          })
        );
      } catch {
        // Ignore callback errors
      }
    }
    return {
      status: Status.ERROR,
      code: 500,
      message: errorMessage,
    };
  }
}

function executePostMessageValidation<T>(
  event: MessageEvent,
  config: SafeEventConfig<T>
): EventResult<T> {
  return executeEventValidation(event, config);
}

function executeWebSocketValidation<T>(
  event: MessageEvent,
  config: SafeEventConfig<T>
): EventResult<T> {
  return executeEventValidation(event, config);
}

function executeEventSourceValidation<T>(
  event: MessageEvent,
  config: SafeEventConfig<T>
): EventResult<T> {
  return executeEventValidation(event, config);
}

function executeCustomEventValidation<T>(
  event: CustomEvent,
  config: SafeEventConfig<T>
): EventResult<T> {
  return executeEventValidation(event, config);
}

function executeStorageEventValidation<T>(
  event: StorageEvent,
  config: SafeEventConfig<T>
): EventResult<T> {
  return executeEventValidation(event, config);
}

// ===============================
// Type Utilities
// ===============================

export type InferEventDataType<T> = T extends TypeGuardFn<infer U> ? U : never;

export function createTypedSafeDOMEvent<T>(guard: TypeGuardFn<T>) {
  return (config: Omit<SafeEventConfig<T>, 'guard'>) =>
    safeDOMEvent({ ...config, guard });
}

export function createTypedSafePostMessage<T>(guard: TypeGuardFn<T>) {
  return (config: Omit<SafeEventConfig<T>, 'guard'>) =>
    safePostMessage({ ...config, guard });
}

export function createTypedSafeWebSocket<T>(guard: TypeGuardFn<T>) {
  return (config: Omit<SafeEventConfig<T>, 'guard'>) =>
    safeWebSocket({ ...config, guard });
}

export function createTypedSafeEventSource<T>(guard: TypeGuardFn<T>) {
  return (config: Omit<SafeEventConfig<T>, 'guard'>) =>
    safeEventSource({ ...config, guard });
}

export function createTypedSafeCustomEvent<T>(guard: TypeGuardFn<T>) {
  return (config: Omit<SafeEventConfig<T>, 'guard'>) =>
    safeCustomEvent({ ...config, guard });
}

export function createTypedSafeStorageEvent<T>(guard: TypeGuardFn<T>) {
  return (config: Omit<SafeEventConfig<T>, 'guard'>) =>
    safeStorageEvent({ ...config, guard });
}
