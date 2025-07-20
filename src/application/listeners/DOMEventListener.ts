import { guardWithTolerance } from 'guardz';
import type { TypeGuardFn } from 'guardz';
import { Status } from '../../domain/event/Status';
import type { EventResult, SafeEventConfig, ErrorContext } from '../../utils/safe-event-never-throws';

/**
 * Configuration for DOM event listeners
 */
export interface DOMEventListenerConfig<T> {
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
 * Safe DOM event listener with callback-based API
 * Usage: element.addEventListener('click', safeDOMEventListener(isClickData, { onSuccess: handleClick }));
 */
export function safeDOMEventListener<T>(
  guard: TypeGuardFn<T>,
  config: DOMEventListenerConfig<T> & {
    onSuccess: (data: T) => void;
    onError?: (result: { status: Status.ERROR; code: number; message: string }) => void;
  }
) {
  return (event: Event): void => {
    const result = executeDOMEventValidation(event, {
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
 * Execute DOM event validation with the given configuration
 */
function executeDOMEventValidation<T>(event: Event, config: SafeEventConfig<T>): EventResult<T> {
  try {
    // Handle null/undefined events
    if (!event) {
      const errorMessage = 'Invalid event: Event is null or undefined';
      if (config.onError) {
        config.onError(errorMessage, {
          type: 'unknown',
          eventType: 'unknown'
        });
      }
      return {
        status: Status.ERROR,
        code: 400,
        message: errorMessage
      };
    }

    // Extract data from DOM event
    const data = event;
    
    // Validate event structure
    if (config.validateEvent && (typeof data === 'undefined' || data === null)) {
      const errorMessage = 'DOM event has no data';
      if (config.onError) {
        config.onError(errorMessage, {
          type: 'validation',
          eventType: event.type || 'unknown'
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
          identifier: config.identifier || `DOM event (${event.type || 'unknown'})`,
          callbackOnError: (error) => {
            if (config.onError) {
              config.onError(error, {
                type: 'validation',
                eventType: event.type || 'unknown'
              });
            }
          }
        })
      : config.guard(data);

    if (!validationResult) {
      const errorMessage = `DOM event validation failed: ${config.identifier || `DOM event (${event.type || 'unknown'})`}`;
      if (config.onError) {
        config.onError(errorMessage, {
          type: 'validation',
          eventType: event.type || 'unknown'
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
    const errorMessage = `DOM event validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    if (config.onError) {
      config.onError(errorMessage, {
        type: 'unknown',
        eventType: event?.type || 'unknown',
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