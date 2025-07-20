import { guardWithTolerance } from 'guardz';
import type { TypeGuardFn } from 'guardz';
import { Status } from '../../domain/event/Status';
import type { EventResult, SafeEventConfig, ErrorContext } from '../../utils/safe-event-never-throws';

/**
 * Configuration for CustomEvent listeners
 */
export interface CustomEventListenerConfig<T> {
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
 * Safe CustomEvent listener with callback-based API
 * Usage: element.addEventListener('custom-event', safeCustomEventListener(isCustomData, { onSuccess: handleCustomData }));
 */
export function safeCustomEventListener<T>(
  guard: TypeGuardFn<T>,
  config: CustomEventListenerConfig<T> & {
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
 * Execute CustomEvent validation with the given configuration
 */
function executeCustomEventValidation<T>(event: CustomEvent, config: SafeEventConfig<T>): EventResult<T> {
  try {
    // Extract data from CustomEvent
    const data = event.detail;
    
    // Validate event structure
    if (config.validateEvent && (typeof data === 'undefined' || data === null)) {
      const errorMessage = 'CustomEvent has no detail';
      if (config.onError) {
        config.onError(errorMessage, {
          type: 'validation',
          eventType: event.type || 'custom'
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
          identifier: config.identifier || `CustomEvent (${event.type || 'custom'})`,
          callbackOnError: (error) => {
            if (config.onError) {
              config.onError(error, {
                type: 'validation',
                eventType: event.type || 'custom'
              });
            }
          }
        })
      : config.guard(data);

    if (!validationResult) {
      const errorMessage = `CustomEvent validation failed: ${config.identifier || `CustomEvent (${event.type || 'custom'})`}`;
      if (config.onError) {
        config.onError(errorMessage, {
          type: 'validation',
          eventType: event.type || 'custom'
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
    const errorMessage = `CustomEvent validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    if (config.onError) {
      config.onError(errorMessage, {
        type: 'unknown',
        eventType: event?.type || 'custom',
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