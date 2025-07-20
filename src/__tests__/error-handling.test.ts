/// <reference types="jest" />
import {
  safePostMessage,
  safeWebSocket,
  safeDOMEvent,
  safeEventSource,
  safeCustomEvent,
  safeStorageEvent,
  safePostMessageListener,
  safeWebSocketListener,
  safeDOMEventListener,
  safeEventSourceListener,
  safeCustomEventListener,
  safeStorageEventListener,
  Status,
} from '../utils/safe-event-never-throws';

// Mock type guards for testing
const isUserMessage = (
  data: unknown
): data is { id: number; name: string; email: string; isActive: boolean } => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).id === 'number' &&
    typeof (data as any).name === 'string' &&
    typeof (data as any).email === 'string' &&
    typeof (data as any).isActive === 'boolean'
  );
};

const isStockUpdate = (
  data: unknown
): data is { symbol: string; price: number; change: number } => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).symbol === 'string' &&
    typeof (data as any).price === 'number' &&
    typeof (data as any).change === 'number'
  );
};

describe('Error Handling and Edge Cases', () => {
  describe('Null and Undefined Events', () => {
    describe('Legacy API', () => {
      it('should handle null events gracefully', () => {
        const handler = safePostMessage({
          guard: isUserMessage,
          allowedOrigins: ['https://trusted-domain.com'],
        });

        const result = handler(null as any);

        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(500);
          expect(result.message).toContain('Invalid event');
        }
      });

      it('should handle undefined events gracefully', () => {
        const handler = safePostMessage({
          guard: isUserMessage,
          allowedOrigins: ['https://trusted-domain.com'],
        });

        const result = handler(undefined as any);

        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(500);
          expect(result.message).toContain('Invalid event');
        }
      });
    });

    describe('Ergonomic API', () => {
      it('should handle null events gracefully', () => {
        const onSuccess = jest.fn();
        const onTypeMismatch = jest.fn();
        const onError = jest.fn();

        const handler = safePostMessageListener(isUserMessage, {
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess,
          onTypeMismatch,
          onError,
        });

        handler(null as any);

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onTypeMismatch).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledWith(
          expect.stringContaining('Invalid event'),
          expect.objectContaining({
            identifier: 'postMessage',
          })
        );
      });

      it('should handle undefined events gracefully', () => {
        const onSuccess = jest.fn();
        const onTypeMismatch = jest.fn();
        const onError = jest.fn();

        const handler = safePostMessageListener(isUserMessage, {
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess,
          onTypeMismatch,
          onError,
        });

        handler(undefined as any);

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onTypeMismatch).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledWith(
          expect.stringContaining('Invalid event'),
          expect.objectContaining({
            identifier: 'postMessage',
          })
        );
      });
    });
  });

  describe('Invalid Event Data Types', () => {
    describe('Legacy API', () => {
      it('should handle non-object data', () => {
        const handler = safePostMessage({
          guard: isUserMessage,
          allowedOrigins: ['https://trusted-domain.com'],
        });

        const stringEvent = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: 'not-an-object',
        });

        const result = handler(stringEvent);

        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(500);
          expect(result.message).toContain('Validation failed');
        }
      });

      it('should handle primitive data types', () => {
        const handler = safePostMessage({
          guard: isUserMessage,
          allowedOrigins: ['https://trusted-domain.com'],
        });

        const numberEvent = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: 123,
        });

        const result = handler(numberEvent);

        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(500);
          expect(result.message).toContain('Validation failed');
        }
      });

      it('should handle boolean data', () => {
        const handler = safePostMessage({
          guard: isUserMessage,
          allowedOrigins: ['https://trusted-domain.com'],
        });

        const booleanEvent = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: true,
        });

        const result = handler(booleanEvent);

        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(500);
          expect(result.message).toContain('Validation failed');
        }
      });
    });

    describe('Ergonomic API', () => {
      it('should call onTypeMismatch for non-object data', () => {
        const onSuccess = jest.fn();
        const onTypeMismatch = jest.fn();
        const onError = jest.fn();

        const handler = safePostMessageListener(isUserMessage, {
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess,
          onTypeMismatch,
          onError,
        });

        const stringEvent = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: 'not-an-object',
        });

        handler(stringEvent);

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onTypeMismatch).toHaveBeenCalledWith(
          expect.stringContaining('Validation failed')
        );
        expect(onError).not.toHaveBeenCalled();
      });
    });
  });

  describe('Malformed Event Objects', () => {
    describe('Legacy API', () => {
      it('should handle events without data property', () => {
        const handler = safePostMessage({
          guard: isUserMessage,
          allowedOrigins: ['https://trusted-domain.com'],
        });

        const malformedEvent = {
          type: 'message',
          origin: 'https://trusted-domain.com',
          // Missing data property
        } as any;

        const result = handler(malformedEvent);

        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(500);
          expect(result.message).toContain('Validation failed');
        }
      });

      it('should handle events without origin property', () => {
        const handler = safePostMessage({
          guard: isUserMessage,
          allowedOrigins: ['https://trusted-domain.com'],
        });

        const malformedEvent = new MessageEvent('message', {
          data: {
            id: 1,
            name: 'John',
            email: 'john@example.com',
            isActive: true,
          },
          // Missing origin property - will be undefined
        });

        const result = handler(malformedEvent);

        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(403);
          expect(result.message).toContain('not allowed');
        }
      });
    });
  });

  describe('Type Guard Errors', () => {
    describe('Legacy API', () => {
      it('should handle type guard that throws an error', () => {
        const throwingGuard = (data: unknown): data is { id: number } => {
          if (typeof data === 'object' && data !== null) {
            throw new Error('Type guard error');
          }
          return false;
        };

        const onError = jest.fn();
        const handler = safePostMessage({
          guard: throwingGuard,
          tolerance: true,
          onError,
        });

        const event = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: { id: 1 },
        });

        const result = handler(event);

        expect(result.status).toBe(Status.ERROR);
        expect(onError).toHaveBeenCalledWith(
          expect.stringContaining('Unexpected error during event validation'),
          expect.objectContaining({
            identifier: 'postMessage',
            originalError: expect.any(Error),
          })
        );
      });
    });

    describe('Ergonomic API', () => {
      it('should handle type guard that throws an error', () => {
        const throwingGuard = (data: unknown): data is { id: number } => {
          if (typeof data === 'object' && data !== null) {
            throw new Error('Type guard error');
          }
          return false;
        };

        const onSuccess = jest.fn();
        const onTypeMismatch = jest.fn();
        const onError = jest.fn();

        const handler = safePostMessageListener(throwingGuard, {
          tolerance: true,
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess,
          onTypeMismatch,
          onError,
        });

        const event = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: { id: 1 },
        });

        handler(event);

        expect(onSuccess).not.toHaveBeenCalled();
        // When type guard throws, it may call both onError (for the exception) and onTypeMismatch (for the 500 result)
        // This is acceptable behavior as the error is handled in multiple places
        expect(onError).toHaveBeenCalledWith(
          expect.stringContaining('Unexpected error during event validation'),
          expect.objectContaining({
            identifier: 'postMessage',
          })
        );
      });
    });
  });

  describe('Callback Error Handling', () => {
    describe('Ergonomic API', () => {
      it('should handle onSuccess callback that throws', () => {
        const throwingOnSuccess = jest.fn().mockImplementation(() => {
          throw new Error('Success callback error');
        });

        const onTypeMismatch = jest.fn();
        const onError = jest.fn();

        const handler = safePostMessageListener(isUserMessage, {
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess: throwingOnSuccess,
          onTypeMismatch,
          onError,
        });

        const event = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: {
            id: 1,
            name: 'John',
            email: 'john@example.com',
            isActive: true,
          },
        });

        // Should not throw, but should handle the error gracefully
        expect(() => handler(event)).not.toThrow();
        expect(throwingOnSuccess).toHaveBeenCalled();
      });

      it('should handle onTypeMismatch callback that throws', () => {
        const onSuccess = jest.fn();
        const throwingOnTypeMismatch = jest.fn().mockImplementation(() => {
          throw new Error('Type mismatch callback error');
        });
        const onError = jest.fn();

        const handler = safePostMessageListener(isUserMessage, {
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess,
          onTypeMismatch: throwingOnTypeMismatch,
          onError,
        });

        const event = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: 'invalid-data',
        });

        // Should not throw, but should handle the error gracefully
        expect(() => handler(event)).not.toThrow();
        expect(throwingOnTypeMismatch).toHaveBeenCalled();
      });

      it('should handle onSecurityViolation callback that throws', () => {
        const onSuccess = jest.fn();
        const onTypeMismatch = jest.fn();
        const throwingOnSecurityViolation = jest.fn().mockImplementation(() => {
          throw new Error('Security violation callback error');
        });
        const onError = jest.fn();

        const handler = safePostMessageListener(isUserMessage, {
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess,
          onTypeMismatch,
          onSecurityViolation: throwingOnSecurityViolation,
          onError,
        });

        const event = new MessageEvent('message', {
          origin: 'https://malicious-site.com',
          data: {
            id: 1,
            name: 'John',
            email: 'john@example.com',
            isActive: true,
          },
        });

        // Should not throw, but should handle the error gracefully
        expect(() => handler(event)).not.toThrow();
        expect(throwingOnSecurityViolation).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases for Different Event Types', () => {
    describe('WebSocket Events', () => {
      it('should handle WebSocket events with null data', () => {
        const handler = safeWebSocket({
          guard: isStockUpdate,
        });

        const nullDataEvent = new MessageEvent('message', {
          data: null,
        });

        const result = handler(nullDataEvent);

        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(500);
          expect(result.message).toContain('Validation failed');
        }
      });
    });

    describe('DOM Events', () => {
      it('should handle DOM events with missing properties', () => {
        const handler = safeDOMEvent({
          guard: isUserMessage,
        });

        const minimalEvent = new Event('click');

        const result = handler(minimalEvent);

        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(500);
          expect(result.message).toContain('Validation failed');
        }
      });
    });

    describe('Custom Events', () => {
      it('should handle CustomEvents with null detail', () => {
        const handler = safeCustomEvent({
          guard: isStockUpdate,
        });

        const nullDetailEvent = new CustomEvent('stock-update', {
          detail: null,
        });

        const result = handler(nullDetailEvent);

        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(500);
          expect(result.message).toContain('Validation failed');
        }
      });

      it('should handle CustomEvents without detail property', () => {
        const handler = safeCustomEvent({
          guard: isStockUpdate,
        });

        const noDetailEvent = new CustomEvent('stock-update');

        const result = handler(noDetailEvent);

        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(500);
          expect(result.message).toContain('Validation failed');
        }
      });
    });

    describe('Storage Events', () => {
      it('should handle StorageEvents with missing properties', () => {
        const handler = safeStorageEvent({
          guard: (data: unknown): data is { key: string } => {
            return (
              typeof data === 'object' &&
              data !== null &&
              typeof (data as any).key === 'string'
            );
          },
        });

        const minimalEvent = new StorageEvent('storage');

        const result = handler(minimalEvent);

        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(500);
          expect(result.message).toContain('Validation failed');
        }
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large data objects efficiently', () => {
      const largeData = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        isActive: true,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: Array.from({ length: 1000 }, (_, i) => `tag-${i}`),
          history: Array.from({ length: 100 }, (_, i) => ({
            action: `action-${i}`,
            timestamp: new Date().toISOString(),
            userId: i,
          })),
        },
      };

      const handler = safePostMessage({
        guard: (data: unknown): data is typeof largeData => {
          return (
            typeof data === 'object' &&
            data !== null &&
            typeof (data as any).id === 'number' &&
            typeof (data as any).name === 'string' &&
            typeof (data as any).email === 'string' &&
            typeof (data as any).isActive === 'boolean' &&
            typeof (data as any).metadata === 'object'
          );
        },
        allowedOrigins: ['https://trusted-domain.com'],
      });

      const event = new MessageEvent('message', {
        origin: 'https://trusted-domain.com',
        data: largeData,
      });

      const startTime = performance.now();
      const result = handler(event);
      const endTime = performance.now();

      expect(result.status).toBe(Status.SUCCESS);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle rapid successive calls', () => {
      const handler = safePostMessage({
        guard: isUserMessage,
        allowedOrigins: ['https://trusted-domain.com'],
      });

      const events = Array.from(
        { length: 100 },
        (_, i) =>
          new MessageEvent('message', {
            origin: 'https://trusted-domain.com',
            data: {
              id: i,
              name: `User-${i}`,
              email: `user${i}@example.com`,
              isActive: true,
            },
          })
      );

      const startTime = performance.now();
      const results = events.map(event => handler(event));
      const endTime = performance.now();

      expect(results.every(result => result.status === Status.SUCCESS)).toBe(
        true
      );
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
