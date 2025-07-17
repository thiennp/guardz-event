import { 
  safePostMessageListener, 
  safeWebSocketListener, 
  safeDOMEventListener,
  safeEventSourceListener,
  safeCustomEventListener,
  safeStorageEventListener,
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

describe('Ergonomic API', () => {
  describe('safePostMessageListener', () => {
    it('should call onSuccess with validated data for valid message', () => {
      const onSuccess = jest.fn();
      const onTypeMismatch = jest.fn();
      const onSecurityViolation = jest.fn();
      const onError = jest.fn();

      const handler = safePostMessageListener(
        isUserMessage,
        {
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess,
          onTypeMismatch,
          onSecurityViolation,
          onError
        }
      );

      const validEvent = new MessageEvent('message', {
        origin: 'https://trusted-domain.com',
        data: { id: 1, name: 'John', email: 'john@example.com', isActive: true }
      });

      handler(validEvent);

      expect(onSuccess).toHaveBeenCalledWith({ id: 1, name: 'John', email: 'john@example.com', isActive: true });
      expect(onTypeMismatch).not.toHaveBeenCalled();
      expect(onSecurityViolation).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('should call onSecurityViolation for untrusted origin', () => {
      const onSuccess = jest.fn();
      const onTypeMismatch = jest.fn();
      const onSecurityViolation = jest.fn();
      const onError = jest.fn();

      const handler = safePostMessageListener(
        isUserMessage,
        {
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess,
          onTypeMismatch,
          onSecurityViolation,
          onError
        }
      );

      const maliciousEvent = new MessageEvent('message', {
        origin: 'https://malicious-site.com',
        data: { id: 1, name: 'Hacker', email: 'hack@evil.com', isActive: true }
      });

      handler(maliciousEvent);

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onTypeMismatch).not.toHaveBeenCalled();
      expect(onSecurityViolation).toHaveBeenCalledWith('https://malicious-site.com', expect.stringContaining('not allowed'));
      expect(onError).not.toHaveBeenCalled();
    });

    it('should call onTypeMismatch for invalid data', () => {
      const onSuccess = jest.fn();
      const onTypeMismatch = jest.fn();
      const onSecurityViolation = jest.fn();
      const onError = jest.fn();

      const handler = safePostMessageListener(
        isUserMessage,
        {
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess,
          onTypeMismatch,
          onSecurityViolation,
          onError
        }
      );

      const invalidEvent = new MessageEvent('message', {
        origin: 'https://trusted-domain.com',
        data: { id: 'not-a-number', name: 'John', email: 'john@example.com', isActive: true }
      });

      handler(invalidEvent);

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onTypeMismatch).toHaveBeenCalledWith(expect.stringContaining('Validation failed'));
      expect(onSecurityViolation).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('safeWebSocketListener', () => {
    it('should call onSuccess with validated data for valid WebSocket message', () => {
      const onSuccess = jest.fn();
      const onTypeMismatch = jest.fn();
      const onError = jest.fn();

      const handler = safeWebSocketListener(
        isStockUpdate,
        {
          onSuccess,
          onTypeMismatch,
          onError
        }
      );

      const validEvent = new MessageEvent('message', {
        data: { symbol: 'AAPL', price: 150.25, change: 2.5 }
      });

      handler(validEvent);

      expect(onSuccess).toHaveBeenCalledWith({ symbol: 'AAPL', price: 150.25, change: 2.5 });
      expect(onTypeMismatch).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('should call onTypeMismatch for invalid WebSocket data', () => {
      const onSuccess = jest.fn();
      const onTypeMismatch = jest.fn();
      const onError = jest.fn();

      const handler = safeWebSocketListener(
        isStockUpdate,
        {
          onSuccess,
          onTypeMismatch,
          onError
        }
      );

      const invalidEvent = new MessageEvent('message', {
        data: { symbol: 'AAPL', price: 'not-a-number', change: 2.5 }
      });

      handler(invalidEvent);

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onTypeMismatch).toHaveBeenCalledWith(expect.stringContaining('Validation failed'));
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('safeDOMEventListener', () => {
    it('should call onSuccess with validated data for valid DOM event', () => {
      const onSuccess = jest.fn();
      const onTypeMismatch = jest.fn();
      const onError = jest.fn();

      const handler = safeDOMEventListener(
        isClickData,
        {
          onSuccess,
          onTypeMismatch,
          onError
        }
      );

      const validEvent = new MouseEvent('click', {
        clientX: 100,
        clientY: 200,
        button: 0
      });

      handler(validEvent);

      expect(onSuccess).toHaveBeenCalledWith({ clientX: 100, clientY: 200, button: 0 });
      expect(onTypeMismatch).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('should call onTypeMismatch for invalid DOM event data', () => {
      const onSuccess = jest.fn();
      const onTypeMismatch = jest.fn();
      const onError = jest.fn();

      const handler = safeDOMEventListener(
        isClickData,
        {
          onSuccess,
          onTypeMismatch,
          onError
        }
      );

      // Create an event that doesn't match the expected structure
      const invalidEvent = new Event('click');

      handler(invalidEvent);

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onTypeMismatch).toHaveBeenCalledWith(expect.stringContaining('Validation failed'));
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('safeEventSourceListener', () => {
    it('should call onSuccess with validated data for valid EventSource message', () => {
      const onSuccess = jest.fn();
      const onTypeMismatch = jest.fn();
      const onError = jest.fn();

      const handler = safeEventSourceListener(
        isStockUpdate,
        {
          onSuccess,
          onTypeMismatch,
          onError
        }
      );

      const validEvent = new MessageEvent('message', {
        data: { symbol: 'AAPL', price: 150.25, change: 2.5 }
      });

      handler(validEvent);

      expect(onSuccess).toHaveBeenCalledWith({ symbol: 'AAPL', price: 150.25, change: 2.5 });
      expect(onTypeMismatch).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('safeCustomEventListener', () => {
    it('should call onSuccess with validated data for valid custom event', () => {
      const onSuccess = jest.fn();
      const onTypeMismatch = jest.fn();
      const onError = jest.fn();

      const handler = safeCustomEventListener(
        isStockUpdate,
        {
          onSuccess,
          onTypeMismatch,
          onError
        }
      );

      const validEvent = new CustomEvent('stock-update', {
        detail: { symbol: 'AAPL', price: 150.25, change: 2.5 }
      });

      handler(validEvent);

      expect(onSuccess).toHaveBeenCalledWith({ symbol: 'AAPL', price: 150.25, change: 2.5 });
      expect(onTypeMismatch).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('safeStorageEventListener', () => {
    it('should call onSuccess with validated data for valid storage event', () => {
      const onSuccess = jest.fn();
      const onTypeMismatch = jest.fn();
      const onError = jest.fn();

      const handler = safeStorageEventListener(
        (data: unknown): data is { key: string; oldValue: string | null; newValue: string | null; url: string } => {
          return typeof data === 'object' && data !== null &&
                 typeof (data as any).key === 'string' &&
                 typeof (data as any).url === 'string';
        },
        {
          onSuccess,
          onTypeMismatch,
          onError
        }
      );

      const validEvent = new StorageEvent('storage', {
        key: 'user_preferences',
        oldValue: 'old_value',
        newValue: 'new_value',
        url: 'https://example.com'
      });

      handler(validEvent);

      expect(onSuccess).toHaveBeenCalledWith({ 
        key: 'user_preferences', 
        oldValue: 'old_value', 
        newValue: 'new_value', 
        url: 'https://example.com' 
      });
      expect(onTypeMismatch).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('Tolerance Mode', () => {
    it('should handle tolerance mode correctly', () => {
      const onSuccess = jest.fn();
      const onTypeMismatch = jest.fn();
      const onError = jest.fn();

      const handler = safeWebSocketListener(
        isStockUpdate,
        {
          tolerance: true,
          onSuccess,
          onTypeMismatch,
          onError
        }
      );

      // Test with partially valid data
      const partialEvent = new MessageEvent('message', {
        data: { symbol: 'AAPL', price: 150.25, change: 'not-a-number' }
      });

      handler(partialEvent);

      // In tolerance mode, it should still call onSuccess but with warnings
      expect(onSuccess).toHaveBeenCalled();
      expect(onTypeMismatch).toHaveBeenCalledWith(expect.stringContaining('Validation failed'));
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should call onError for unexpected errors', () => {
      const onSuccess = jest.fn();
      const onTypeMismatch = jest.fn();
      const onSecurityViolation = jest.fn();
      const onError = jest.fn();

      const handler = safePostMessageListener(
        isUserMessage,
        {
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess,
          onTypeMismatch,
          onSecurityViolation,
          onError
        }
      );

      // Test with null event to trigger error
      const nullEvent = null as any;

      handler(nullEvent);

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onTypeMismatch).not.toHaveBeenCalled();
      expect(onSecurityViolation).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });
  });
}); 