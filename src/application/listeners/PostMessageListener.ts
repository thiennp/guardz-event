import { guardWithTolerance } from 'guardz';
import type { TypeGuardFn } from 'guardz';
import { Status } from '../../domain/event/Status';
import type { SecurityError } from '../../shared/errors/ErrorTypes';
import type { EventResult, SafeEventConfig, ErrorContext } from '../../utils/safe-event-never-throws';

/**
 * Configuration for PostMessage event listeners
 */
export interface PostMessageListenerConfig<T> {
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
 * Safe PostMessage event listener with callback-based API
 * Usage: window.addEventListener('message', safePostMessageListener(isUserMessage, { tolerance: true, onTypeMismatch: console.warn }));
 */
export function safePostMessageListener<T>(
  guard: TypeGuardFn<T>,
  config: PostMessageListenerConfig<T> & {
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
 * Execute PostMessage validation with the given configuration
 */
function executePostMessageValidation<T>(event: MessageEvent, config: SafeEventConfig<T>): EventResult<T> {
  try {
    // Security validation
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

    // Extract data from PostMessage
    const data = event.data;
    
    // Validate event structure
    if (config.validateEvent && (typeof data === 'undefined' || data === null)) {
      const errorMessage = 'PostMessage event has no data';
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
          identifier: config.identifier || 'PostMessage data',
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
      const errorMessage = `PostMessage data validation failed: ${config.identifier || 'PostMessage data'}`;
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
    const errorMessage = `PostMessage validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
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