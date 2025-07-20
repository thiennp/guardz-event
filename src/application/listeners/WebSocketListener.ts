import { guardWithTolerance } from 'guardz';
import type { TypeGuardFn } from 'guardz';
import { Status } from '../../domain/event/Status';
import type { EventResult, SafeEventConfig, ErrorContext } from '../../utils/safe-event-never-throws';

/**
 * Configuration for WebSocket event listeners
 */
export interface WebSocketListenerConfig<T> {
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
 * Safe WebSocket event listener with callback-based API
 * Usage: ws.addEventListener('message', safeWebSocketListener(isWSData, { onSuccess: handleWSData }));
 */
export function safeWebSocketListener<T>(
  guard: TypeGuardFn<T>,
  config: WebSocketListenerConfig<T> & {
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
 * Execute WebSocket validation with the given configuration
 */
function executeWebSocketValidation<T>(event: MessageEvent, config: SafeEventConfig<T>): EventResult<T> {
  try {
    // Extract data from WebSocket message
    const data = event.data;
    
    // Validate event structure
    if (config.validateEvent && (typeof data === 'undefined' || data === null)) {
      const errorMessage = 'WebSocket event has no data';
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
          identifier: config.identifier || 'WebSocket data',
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
      const errorMessage = `WebSocket data validation failed: ${config.identifier || 'WebSocket data'}`;
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
    const errorMessage = `WebSocket validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
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