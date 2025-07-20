import { guardWithTolerance } from 'guardz';
import type { TypeGuardFn, TypeGuardFnConfig } from 'guardz';
import type { ErrorContext } from '../../utils/safe-event-never-throws';

/**
 * Configuration for Guardz validation
 */
export interface GuardzValidationConfig {
  /** Enable tolerance mode (default: false) */
  tolerance?: boolean;
  /** Identifier for error context */
  identifier?: string;
  /** Error callback for tolerance mode */
  onError?: (error: string, context: ErrorContext) => void;
  /** Event type for context */
  eventType?: string;
}

/**
 * Guardz-specific validation service
 */
export class GuardzValidator {
  /**
   * Validate data using a type guard with optional tolerance mode
   */
  static validate<T>(
    data: unknown,
    guard: TypeGuardFn<T>,
    config: GuardzValidationConfig = {}
  ): { isValid: boolean; data?: T; error?: string } {
    try {
      if (config.tolerance) {
        const validationResult = guardWithTolerance(data, guard, {
          identifier: config.identifier || 'data',
          callbackOnError: (error) => {
            if (config.onError) {
              config.onError(error, {
                type: 'validation',
                eventType: config.eventType || 'unknown'
              });
            }
          }
        } as TypeGuardFnConfig);

        if (validationResult) {
          return { isValid: true, data: data as T };
        } else {
          return { 
            isValid: false, 
            error: `Validation failed: ${config.identifier || 'data'}` 
          };
        }
      } else {
        const validationResult = guard(data);
        if (validationResult) {
          return { isValid: true, data: data as T };
        } else {
          return { 
            isValid: false, 
            error: `Validation failed: ${config.identifier || 'data'}` 
          };
        }
      }
    } catch (error) {
      const errorMessage = `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      if (config.onError) {
        config.onError(errorMessage, {
          type: 'unknown',
          eventType: config.eventType || 'unknown',
          originalError: error
        });
      }
      return { isValid: false, error: errorMessage };
    }
  }

  /**
   * Create a validation function with pre-configured settings
   */
  static createValidator<T>(
    guard: TypeGuardFn<T>,
    defaultConfig: GuardzValidationConfig = {}
  ) {
    return (data: unknown, config: Partial<GuardzValidationConfig> = {}) => {
      return this.validate(data, guard, { ...defaultConfig, ...config });
    };
  }
} 