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

const isPartialUserMessage = (
  data: unknown
): data is {
  id?: number;
  name?: string;
  email?: string;
  isActive?: boolean;
} => {
  return typeof data === 'object' && data !== null;
};

describe('Tolerance Mode', () => {
  describe('Legacy API - Tolerance Mode', () => {
    describe('safePostMessage with tolerance', () => {
      it('should return success for partial data in tolerance mode', () => {
        const onError = jest.fn();
        const handler = safePostMessage({
          guard: isPartialUserMessage,
          tolerance: true,
          onError,
        });

        const partialEvent = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: { id: 1, name: 'John' }, // Missing email and isActive
        });

        const result = handler(partialEvent);

        expect(result.status).toBe(Status.SUCCESS);
        if (result.status === Status.SUCCESS) {
          expect(result.data).toEqual({ id: 1, name: 'John' });
        }
        expect(onError).not.toHaveBeenCalled();
      });

      it('should call onError for invalid data in tolerance mode', () => {
        const onError = jest.fn();
        const handler = safePostMessage({
          guard: isPartialUserMessage,
          tolerance: true,
          onError,
        });

        const invalidEvent = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: 'not-an-object',
        });

        const result = handler(invalidEvent);

        expect(result.status).toBe(Status.ERROR);
        expect(onError).toHaveBeenCalledWith(
          expect.stringContaining('Validation failed'),
          expect.objectContaining({
            identifier: 'postMessage',
            originalError: expect.any(Error),
          })
        );
      });
    });

    describe('safeWebSocket with tolerance', () => {
      it('should return success for partial data in tolerance mode', () => {
        const onError = jest.fn();
        const handler = safeWebSocket({
          guard: isPartialUserMessage,
          tolerance: true,
          onError,
        });

        const partialEvent = new MessageEvent('message', {
          data: { id: 1, name: 'John' }, // Missing email and isActive
        });

        const result = handler(partialEvent);

        expect(result.status).toBe(Status.SUCCESS);
        if (result.status === Status.SUCCESS) {
          expect(result.data).toEqual({ id: 1, name: 'John' });
        }
        expect(onError).not.toHaveBeenCalled();
      });
    });

    describe('safeDOMEvent with tolerance', () => {
      it('should return success for partial data in tolerance mode', () => {
        const onError = jest.fn();
        const handler = safeDOMEvent({
          guard: isPartialUserMessage,
          tolerance: true,
          onError,
        });

        const partialEvent = new MouseEvent('click', {
          clientX: 100,
          clientY: 200,
        });

        const result = handler(partialEvent);

        expect(result.status).toBe(Status.SUCCESS);
        if (result.status === Status.SUCCESS) {
          expect(result.data).toEqual({
            clientX: 100,
            clientY: 200,
            button: 0,
          });
        }
        expect(onError).not.toHaveBeenCalled();
      });
    });
  });

  describe('Ergonomic API - Tolerance Mode', () => {
    describe('safePostMessageListener with tolerance', () => {
      it('should call onSuccess for partial data in tolerance mode', () => {
        const onSuccess = jest.fn();
        const onTypeMismatch = jest.fn();
        const onError = jest.fn();

        const handler = safePostMessageListener(isPartialUserMessage, {
          tolerance: true,
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess,
          onTypeMismatch,
          onError,
        });

        const partialEvent = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: { id: 1, name: 'John' }, // Missing email and isActive
        });

        handler(partialEvent);

        expect(onSuccess).toHaveBeenCalledWith({ id: 1, name: 'John' });
        expect(onTypeMismatch).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
      });

      it('should call onTypeMismatch for invalid data in tolerance mode', () => {
        const onSuccess = jest.fn();
        const onTypeMismatch = jest.fn();
        const onError = jest.fn();

        const handler = safePostMessageListener(isPartialUserMessage, {
          tolerance: true,
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess,
          onTypeMismatch,
          onError,
        });

        const invalidEvent = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: 'not-an-object',
        });

        handler(invalidEvent);

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onTypeMismatch).toHaveBeenCalledWith(
          expect.stringContaining('Validation failed')
        );
        expect(onError).not.toHaveBeenCalled();
      });
    });

    describe('safeWebSocketListener with tolerance', () => {
      it('should call onSuccess for partial data in tolerance mode', () => {
        const onSuccess = jest.fn();
        const onTypeMismatch = jest.fn();
        const onError = jest.fn();

        const handler = safeWebSocketListener(isPartialUserMessage, {
          tolerance: true,
          onSuccess,
          onTypeMismatch,
          onError,
        });

        const partialEvent = new MessageEvent('message', {
          data: { id: 1, name: 'John' }, // Missing email and isActive
        });

        handler(partialEvent);

        expect(onSuccess).toHaveBeenCalledWith({ id: 1, name: 'John' });
        expect(onTypeMismatch).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
      });
    });

    describe('safeDOMEventListener with tolerance', () => {
      it('should call onSuccess for partial data in tolerance mode', () => {
        const onSuccess = jest.fn();
        const onTypeMismatch = jest.fn();
        const onError = jest.fn();

        const handler = safeDOMEventListener(isPartialUserMessage, {
          tolerance: true,
          onSuccess,
          onTypeMismatch,
          onError,
        });

        const partialEvent = new MouseEvent('click', {
          clientX: 100,
          clientY: 200,
        });

        handler(partialEvent);

        expect(onSuccess).toHaveBeenCalledWith({
          clientX: 100,
          clientY: 200,
          button: 0,
        });
        expect(onTypeMismatch).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
      });
    });

    describe('safeEventSourceListener with tolerance', () => {
      it('should call onSuccess for partial data in tolerance mode', () => {
        const onSuccess = jest.fn();
        const onTypeMismatch = jest.fn();
        const onError = jest.fn();

        const handler = safeEventSourceListener(isPartialUserMessage, {
          tolerance: true,
          onSuccess,
          onTypeMismatch,
          onError,
        });

        const partialEvent = new MessageEvent('message', {
          data: { id: 1, name: 'John' }, // Missing email and isActive
        });

        handler(partialEvent);

        expect(onSuccess).toHaveBeenCalledWith({ id: 1, name: 'John' });
        expect(onTypeMismatch).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
      });
    });

    describe('safeCustomEventListener with tolerance', () => {
      it('should call onSuccess for partial data in tolerance mode', () => {
        const onSuccess = jest.fn();
        const onTypeMismatch = jest.fn();
        const onError = jest.fn();

        const handler = safeCustomEventListener(isPartialUserMessage, {
          tolerance: true,
          onSuccess,
          onTypeMismatch,
          onError,
        });

        const partialEvent = new CustomEvent('user-update', {
          detail: { id: 1, name: 'John' }, // Missing email and isActive
        });

        handler(partialEvent);

        expect(onSuccess).toHaveBeenCalledWith({ id: 1, name: 'John' });
        expect(onTypeMismatch).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
      });
    });

    describe('safeStorageEventListener with tolerance', () => {
      it('should call onSuccess for partial data in tolerance mode', () => {
        const onSuccess = jest.fn();
        const onTypeMismatch = jest.fn();
        const onError = jest.fn();

        const handler = safeStorageEventListener(isPartialUserMessage, {
          tolerance: true,
          onSuccess,
          onTypeMismatch,
          onError,
        });

        const partialEvent = new StorageEvent('storage', {
          key: 'user_preferences',
          oldValue: 'old_value',
          newValue: 'new_value',
          url: 'https://example.com',
        });

        handler(partialEvent);

        expect(onSuccess).toHaveBeenCalledWith({
          key: 'user_preferences',
          oldValue: 'old_value',
          newValue: 'new_value',
          url: 'https://example.com',
          storageArea: null,
        });
        expect(onTypeMismatch).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
      });
    });
  });

  describe('Tolerance Mode Edge Cases', () => {
    it('should handle null data in tolerance mode', () => {
      const onSuccess = jest.fn();
      const onTypeMismatch = jest.fn();
      const onError = jest.fn();

      const handler = safePostMessageListener(isPartialUserMessage, {
        tolerance: true,
        allowedOrigins: ['https://trusted-domain.com'],
        onSuccess,
        onTypeMismatch,
        onError,
      });

      const nullEvent = new MessageEvent('message', {
        origin: 'https://trusted-domain.com',
        data: null,
      });

      handler(nullEvent);

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onTypeMismatch).toHaveBeenCalledWith(
        expect.stringContaining('Validation failed')
      );
      expect(onError).not.toHaveBeenCalled();
    });

    it('should handle undefined data in tolerance mode', () => {
      const onSuccess = jest.fn();
      const onTypeMismatch = jest.fn();
      const onError = jest.fn();

      const handler = safePostMessageListener(isPartialUserMessage, {
        tolerance: true,
        allowedOrigins: ['https://trusted-domain.com'],
        onSuccess,
        onTypeMismatch,
        onError,
      });

      const undefinedEvent = new MessageEvent('message', {
        origin: 'https://trusted-domain.com',
        data: undefined,
      });

      handler(undefinedEvent);

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onTypeMismatch).toHaveBeenCalledWith(
        expect.stringContaining('Validation failed')
      );
      expect(onError).not.toHaveBeenCalled();
    });

    it('should handle empty object in tolerance mode', () => {
      const onSuccess = jest.fn();
      const onTypeMismatch = jest.fn();
      const onError = jest.fn();

      const handler = safePostMessageListener(isPartialUserMessage, {
        tolerance: true,
        allowedOrigins: ['https://trusted-domain.com'],
        onSuccess,
        onTypeMismatch,
        onError,
      });

      const emptyEvent = new MessageEvent('message', {
        origin: 'https://trusted-domain.com',
        data: {},
      });

      handler(emptyEvent);

      expect(onSuccess).toHaveBeenCalledWith({});
      expect(onTypeMismatch).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('Tolerance Mode vs Strict Mode Comparison', () => {
    it('should behave differently in tolerance vs strict mode', () => {
      const partialData = { id: 1, name: 'John' }; // Missing required fields

      // Strict mode (tolerance: false)
      const strictOnSuccess = jest.fn();
      const strictOnTypeMismatch = jest.fn();
      const strictHandler = safePostMessageListener(
        isUserMessage, // Requires all fields
        {
          tolerance: false,
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess: strictOnSuccess,
          onTypeMismatch: strictOnTypeMismatch,
          onError: jest.fn(),
        }
      );

      const strictEvent = new MessageEvent('message', {
        origin: 'https://trusted-domain.com',
        data: partialData,
      });

      strictHandler(strictEvent);

      expect(strictOnSuccess).not.toHaveBeenCalled();
      expect(strictOnTypeMismatch).toHaveBeenCalled();

      // Tolerance mode (tolerance: true)
      const toleranceOnSuccess = jest.fn();
      const toleranceOnTypeMismatch = jest.fn();
      const toleranceHandler = safePostMessageListener(
        isPartialUserMessage, // Allows partial data
        {
          tolerance: true,
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess: toleranceOnSuccess,
          onTypeMismatch: toleranceOnTypeMismatch,
          onError: jest.fn(),
        }
      );

      const toleranceEvent = new MessageEvent('message', {
        origin: 'https://trusted-domain.com',
        data: partialData,
      });

      toleranceHandler(toleranceEvent);

      expect(toleranceOnSuccess).toHaveBeenCalledWith(partialData);
      expect(toleranceOnTypeMismatch).not.toHaveBeenCalled();
    });
  });
});
