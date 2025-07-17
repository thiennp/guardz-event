/// <reference types="jest" />
import { 
  safePostMessage, 
  safeWebSocket, 
  safeDOMEvent,
  safeEventSource,
  safeCustomEvent,
  safeStorageEvent,
  Status 
} from '../utils/safe-event-never-throws';

// Mock type guards for testing
const isUserMessage = (data: unknown): data is { id: number; name: string; email: string; isActive: boolean } => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).id === 'number' &&
         typeof (data as any).name === 'string' &&
         typeof (data as any).email === 'string' &&
         typeof (data as any).isActive === 'boolean';
};

const isStockUpdate = (data: unknown): data is { symbol: string; price: number; change: number } => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).symbol === 'string' &&
         typeof (data as any).price === 'number' &&
         typeof (data as any).change === 'number';
};

const isClickData = (data: unknown): data is { clientX: number; clientY: number; button: number } => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).clientX === 'number' &&
         typeof (data as any).clientY === 'number' &&
         typeof (data as any).button === 'number';
};

describe('Legacy API', () => {
  describe('safePostMessage', () => {
    it('should return success result for valid message', () => {
      const handler = safePostMessage({ 
        guard: isUserMessage,
        allowedOrigins: ['https://trusted-domain.com']
      });

      const validEvent = new MessageEvent('message', {
        origin: 'https://trusted-domain.com',
        data: { id: 1, name: 'John', email: 'john@example.com', isActive: true }
      });

      const result = handler(validEvent);

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual({ id: 1, name: 'John', email: 'john@example.com', isActive: true });
      }
    });

    it('should return error result for untrusted origin', () => {
      const handler = safePostMessage({ 
        guard: isUserMessage,
        allowedOrigins: ['https://trusted-domain.com']
      });

      const maliciousEvent = new MessageEvent('message', {
        origin: 'https://malicious-site.com',
        data: { id: 1, name: 'Hacker', email: 'hack@evil.com', isActive: true }
      });

      const result = handler(maliciousEvent);

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.code).toBe(403);
        expect(result.message).toContain('not allowed');
      }
    });

    it('should return error result for invalid data', () => {
      const handler = safePostMessage({ 
        guard: isUserMessage,
        allowedOrigins: ['https://trusted-domain.com']
      });

      const invalidEvent = new MessageEvent('message', {
        origin: 'https://trusted-domain.com',
        data: { id: 'not-a-number', name: 'John', email: 'john@example.com', isActive: true }
      });

      const result = handler(invalidEvent);

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.code).toBe(500);
        expect(result.message).toContain('Validation failed');
      }
    });
  });

  describe('safeWebSocket', () => {
    it('should return success result for valid WebSocket message', () => {
      const handler = safeWebSocket({ 
        guard: isStockUpdate
      });

      const validEvent = new MessageEvent('message', {
        data: { symbol: 'AAPL', price: 150.25, change: 2.5 }
      });

      const result = handler(validEvent);

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual({ symbol: 'AAPL', price: 150.25, change: 2.5 });
      }
    });

    it('should return error result for invalid WebSocket data', () => {
      const handler = safeWebSocket({ 
        guard: isStockUpdate
      });

      const invalidEvent = new MessageEvent('message', {
        data: { symbol: 'AAPL', price: 'not-a-number', change: 2.5 }
      });

      const result = handler(invalidEvent);

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.code).toBe(500);
        expect(result.message).toContain('Validation failed');
      }
    });
  });

  describe('safeDOMEvent', () => {
    it('should return success result for valid DOM event', () => {
      const handler = safeDOMEvent({ 
        guard: isClickData
      });

      const validEvent = new MouseEvent('click', {
        clientX: 100,
        clientY: 200,
        button: 0
      });

      const result = handler(validEvent);

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual({ clientX: 100, clientY: 200, button: 0 });
      }
    });

    it('should return error result for invalid DOM event data', () => {
      const handler = safeDOMEvent({ 
        guard: isClickData
      });

      const invalidEvent = new Event('click');

      const result = handler(invalidEvent);

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.code).toBe(500);
        expect(result.message).toContain('Validation failed');
      }
    });
  });

  describe('safeEventSource', () => {
    it('should return success result for valid EventSource message', () => {
      const handler = safeEventSource({ 
        guard: isStockUpdate
      });

      const validEvent = new MessageEvent('message', {
        data: { symbol: 'AAPL', price: 150.25, change: 2.5 }
      });

      const result = handler(validEvent);

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual({ symbol: 'AAPL', price: 150.25, change: 2.5 });
      }
    });
  });

  describe('safeCustomEvent', () => {
    it('should return success result for valid custom event', () => {
      const handler = safeCustomEvent({ 
        guard: isStockUpdate
      });

      const validEvent = new CustomEvent('stock-update', {
        detail: { symbol: 'AAPL', price: 150.25, change: 2.5 }
      });

      const result = handler(validEvent);

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual({ symbol: 'AAPL', price: 150.25, change: 2.5 });
      }
    });
  });

  describe('safeStorageEvent', () => {
    it('should return success result for valid storage event', () => {
      const handler = safeStorageEvent({ 
        guard: (data: unknown): data is { key: string; oldValue: string | null; newValue: string | null; url: string } => {
          return typeof data === 'object' && data !== null &&
                 typeof (data as any).key === 'string' &&
                 typeof (data as any).url === 'string';
        }
      });

      const validEvent = new StorageEvent('storage', {
        key: 'user_preferences',
        oldValue: 'old_value',
        newValue: 'new_value',
        url: 'https://example.com'
      });

      const result = handler(validEvent);

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual({ 
          key: 'user_preferences', 
          oldValue: 'old_value', 
          newValue: 'new_value', 
          url: 'https://example.com' 
        });
      }
    });
  });

  describe('Tolerance Mode', () => {
    it('should handle tolerance mode correctly', () => {
      const onError = jest.fn();
      const handler = safeWebSocket({ 
        guard: isStockUpdate,
        tolerance: true,
        onError
      });

      const partialEvent = new MessageEvent('message', {
        data: { symbol: 'AAPL', price: 150.25, change: 'not-a-number' }
      });

      const result = handler(partialEvent);

      // In tolerance mode, it should still return success but with warnings
      expect(result.status).toBe(Status.SUCCESS);
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle null events gracefully', () => {
      const handler = safePostMessage({ 
        guard: isUserMessage,
        allowedOrigins: ['https://trusted-domain.com']
      });

      const nullEvent = null as any;

      const result = handler(nullEvent);

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.code).toBe(500);
        expect(result.message).toContain('Invalid event');
      }
    });
  });
}); 