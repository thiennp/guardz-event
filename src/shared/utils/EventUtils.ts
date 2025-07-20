import type { ErrorContext } from '../../utils/safe-event-never-throws';

/**
 * Utility functions for event handling
 */
export class EventUtils {
  /**
   * Create a standardized error context
   */
  static createErrorContext(
    type: ErrorContext['type'],
    eventType: string,
    options: Partial<Omit<ErrorContext, 'type' | 'eventType'>> = {}
  ): ErrorContext {
    return {
      type,
      eventType,
      ...options
    };
  }

  /**
   * Check if an event is null or undefined
   */
  static isNullEvent(event: unknown): event is null | undefined {
    return event === null || event === undefined;
  }

  /**
   * Check if data is null or undefined
   */
  static isNullData(data: unknown): data is null | undefined {
    return data === null || data === undefined;
  }

  /**
   * Extract event type safely
   */
  static getEventType(event: Event | MessageEvent | CustomEvent | StorageEvent): string {
    if (event && typeof event === 'object' && 'type' in event) {
      return event.type || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Extract origin safely from MessageEvent
   */
  static getOrigin(event: MessageEvent): string | undefined {
    if (event && typeof event === 'object' && 'origin' in event) {
      return event.origin;
    }
    return undefined;
  }

  /**
   * Validate security origins
   */
  static validateOrigin(
    origin: string | undefined,
    allowedOrigins: string[] | undefined
  ): { isValid: boolean; error?: string } {
    if (!allowedOrigins || allowedOrigins.length === 0) {
      return { isValid: true };
    }

    if (!origin) {
      return { 
        isValid: false, 
        error: 'Origin is required but not provided' 
      };
    }

    if (!allowedOrigins.includes(origin)) {
      return { 
        isValid: false, 
        error: `Origin not allowed: ${origin}` 
      };
    }

    return { isValid: true };
  }

  /**
   * Create a standardized error message
   */
  static createErrorMessage(
    baseMessage: string,
    identifier?: string,
    details?: string
  ): string {
    let message = baseMessage;
    if (identifier) {
      message += `: ${identifier}`;
    }
    if (details) {
      message += ` (${details})`;
    }
    return message;
  }

  /**
   * Safely extract error message from unknown error
   */
  static extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error';
  }
} 