import { guardWithTolerance } from 'guardz';
import type { TypeGuardFn } from 'guardz';
import { Status } from '../../domain/event/Status';
import type { EventResult, SafeEventConfig, ErrorContext } from '../../utils/safe-event-never-throws';

/**
 * Configuration for EventSource event listeners
 */
export interface EventSourceListenerConfig<T> {
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
 * Safe EventSource event listener with callback-based API
 * Usage: eventSource.addEventListener('message', safeEventSourceListener(isSSEData, { onSuccess: handleSSEData }));
 */
export function safeEventSourceListener<T>(
  guard: TypeGuardFn<T>,
  config: EventSourceListenerConfig<T> & {
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
 * Execute EventSource validation with the given configuration
 */
function executeEventSourceValidation<T>(event: MessageEvent, config: SafeEventConfig<T>): EventResult<T> {
  try {
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

    // Extract data from EventSource message
    const data = event.data;
    
    // Validate event structure
    if (config.validateEvent && (typeof data === 'undefined' || data === null)) {
      const errorMessage = 'EventSource event has no data';
      if (config.onError) {
        config.onError(errorMessage, {
          type: 'validation',
          eventType: 'message'
        });
      }
      return {
        status: Status.ERROR,
        code: 400,
        message: errorMessage
      };
    }

    // Type validation
    const validationResult = config.tolerance 
      ? guardWithTolerance(data, config.guard, { 
          identifier: config.identifier || 'EventSource data',
          callbackOnError: (error) => {
            if (config.onError) {
              config.onError(error, {
                type: 'validation',
                eventType: 'message'
              });
            }
          }
        })
      : config.guard(data);

    if (!validationResult) {
      const errorMessage = `EventSource data validation failed: ${config.identifier || 'EventSource data'}`;
      if (config.onError) {
        config.onError(errorMessage, {
          type: 'validation',
          eventType: 'message'
        });
      }
      return {
        status: Status.ERROR,
        code: 500,
        message: errorMessage
      };
    }

    return {
      status: Status.SUCCESS,
      data: data as T
    };

  } catch (error) {
    const errorMessage = `EventSource validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    if (config.onError) {
      config.onError(errorMessage, {
        type: 'unknown',
        eventType: 'message',
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