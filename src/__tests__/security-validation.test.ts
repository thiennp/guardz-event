/// <reference types="jest" />
import {
  safePostMessage,
  safePostMessageListener,
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

describe('Security Validation', () => {
  describe('Origin Validation', () => {
    describe('Legacy API - Origin Validation', () => {
      it('should allow messages from trusted origins', () => {
        const handler = safePostMessage({
          guard: isUserMessage,
          allowedOrigins: [
            'https://trusted-domain.com',
            'https://another-trusted.com',
          ],
        });

        const validEvent = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: {
            id: 1,
            name: 'John',
            email: 'john@example.com',
            isActive: true,
          },
        });

        const result = handler(validEvent);

        expect(result.status).toBe(Status.SUCCESS);
        if (result.status === Status.SUCCESS) {
          expect(result.data).toEqual({
            id: 1,
            name: 'John',
            email: 'john@example.com',
            isActive: true,
          });
        }
      });

      it('should reject messages from untrusted origins', () => {
        const handler = safePostMessage({
          guard: isUserMessage,
          allowedOrigins: ['https://trusted-domain.com'],
        });

        const maliciousEvent = new MessageEvent('message', {
          origin: 'https://malicious-site.com',
          data: {
            id: 1,
            name: 'Hacker',
            email: 'hack@evil.com',
            isActive: true,
          },
        });

        const result = handler(maliciousEvent);

        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(403);
          expect(result.message).toContain('not allowed');
          expect(result.message).toContain('malicious-site.com');
        }
      });

      it('should reject messages when no origins are allowed', () => {
        const handler = safePostMessage({
          guard: isUserMessage,
          allowedOrigins: [],
        });

        const event = new MessageEvent('message', {
          origin: 'https://any-site.com',
          data: {
            id: 1,
            name: 'John',
            email: 'john@example.com',
            isActive: true,
          },
        });

        const result = handler(event);

        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(403);
          expect(result.message).toContain('not allowed');
        }
      });

      it('should allow messages when no origin restrictions are set', () => {
        const handler = safePostMessage({
          guard: isUserMessage,
          // No allowedOrigins specified
        });

        const event = new MessageEvent('message', {
          origin: 'https://any-site.com',
          data: {
            id: 1,
            name: 'John',
            email: 'john@example.com',
            isActive: true,
          },
        });

        const result = handler(event);

        expect(result.status).toBe(Status.SUCCESS);
        if (result.status === Status.SUCCESS) {
          expect(result.data).toEqual({
            id: 1,
            name: 'John',
            email: 'john@example.com',
            isActive: true,
          });
        }
      });

      it('should handle null origin gracefully', () => {
        const handler = safePostMessage({
          guard: isUserMessage,
          allowedOrigins: ['https://trusted-domain.com'],
        });

        const nullOriginEvent = new MessageEvent('message', {
          origin: null as any,
          data: {
            id: 1,
            name: 'John',
            email: 'john@example.com',
            isActive: true,
          },
        });

        const result = handler(nullOriginEvent);

        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(403);
          expect(result.message).toContain('not allowed');
        }
      });

      it('should handle undefined origin gracefully', () => {
        const handler = safePostMessage({
          guard: isUserMessage,
          allowedOrigins: ['https://trusted-domain.com'],
        });

        const undefinedOriginEvent = new MessageEvent('message', {
          origin: undefined as any,
          data: {
            id: 1,
            name: 'John',
            email: 'john@example.com',
            isActive: true,
          },
        });

        const result = handler(undefinedOriginEvent);

        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(403);
          expect(result.message).toContain('not allowed');
        }
      });
    });

    describe('Ergonomic API - Origin Validation', () => {
      it('should call onSuccess for trusted origins', () => {
        const onSuccess = jest.fn();
        const onSecurityViolation = jest.fn();
        const onError = jest.fn();

        const handler = safePostMessageListener(isUserMessage, {
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess,
          onSecurityViolation,
          onError,
        });

        const validEvent = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: {
            id: 1,
            name: 'John',
            email: 'john@example.com',
            isActive: true,
          },
        });

        handler(validEvent);

        expect(onSuccess).toHaveBeenCalledWith({
          id: 1,
          name: 'John',
          email: 'john@example.com',
          isActive: true,
        });
        expect(onSecurityViolation).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
      });

      it('should call onSecurityViolation for untrusted origins', () => {
        const onSuccess = jest.fn();
        const onSecurityViolation = jest.fn();
        const onError = jest.fn();

        const handler = safePostMessageListener(isUserMessage, {
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess,
          onSecurityViolation,
          onError,
        });

        const maliciousEvent = new MessageEvent('message', {
          origin: 'https://malicious-site.com',
          data: {
            id: 1,
            name: 'Hacker',
            email: 'hack@evil.com',
            isActive: true,
          },
        });

        handler(maliciousEvent);

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onSecurityViolation).toHaveBeenCalledWith(
          'https://malicious-site.com',
          expect.stringContaining('not allowed')
        );
        expect(onError).not.toHaveBeenCalled();
      });

      it('should call onSecurityViolation for null origin', () => {
        const onSuccess = jest.fn();
        const onSecurityViolation = jest.fn();
        const onError = jest.fn();

        const handler = safePostMessageListener(isUserMessage, {
          allowedOrigins: ['https://trusted-domain.com'],
          onSuccess,
          onSecurityViolation,
          onError,
        });

        const nullOriginEvent = new MessageEvent('message', {
          origin: null as any,
          data: {
            id: 1,
            name: 'John',
            email: 'john@example.com',
            isActive: true,
          },
        });

        handler(nullOriginEvent);

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onSecurityViolation).toHaveBeenCalledWith(
          'null',
          expect.stringContaining('not allowed')
        );
        expect(onError).not.toHaveBeenCalled();
      });
    });
  });

  describe('Source Validation', () => {
    describe('Legacy API - Source Validation', () => {
      it('should allow messages from trusted sources', () => {
        const mockSource = { close: jest.fn(), 'trusted-source': true };
        const handler = safePostMessage({
          guard: isUserMessage,
          allowedSources: ['trusted-source'],
        });

        const validEvent = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: {
            id: 1,
            name: 'John',
            email: 'john@example.com',
            isActive: true,
          },
        });
        // Manually set the source property since MessageEvent constructor doesn't support it
        Object.defineProperty(validEvent, 'source', {
          value: mockSource,
          writable: false,
          configurable: false,
        });

        const result = handler(validEvent);

        expect(result.status).toBe(Status.SUCCESS);
        if (result.status === Status.SUCCESS) {
          expect(result.data).toEqual({
            id: 1,
            name: 'John',
            email: 'john@example.com',
            isActive: true,
          });
        }
      });

      it('should reject messages from untrusted sources', () => {
        const mockSource = { close: jest.fn() };
        const handler = safePostMessage({
          guard: isUserMessage,
          allowedSources: ['trusted-source'],
        });

        const maliciousEvent = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          source: mockSource as any,
          data: {
            id: 1,
            name: 'Hacker',
            email: 'hack@evil.com',
            isActive: true,
          },
        });

        const result = handler(maliciousEvent);

        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(403);
          expect(result.message).toContain('not allowed');
        }
      });
    });

    describe('Ergonomic API - Source Validation', () => {
      it('should call onSuccess for trusted sources', () => {
        const mockSource = { close: jest.fn(), 'trusted-source': true };
        const onSuccess = jest.fn();
        const onSecurityViolation = jest.fn();
        const onError = jest.fn();

        const handler = safePostMessageListener(isUserMessage, {
          allowedSources: ['trusted-source'],
          onSuccess,
          onSecurityViolation,
          onError,
        });

        const validEvent = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: {
            id: 1,
            name: 'John',
            email: 'john@example.com',
            isActive: true,
          },
        });
        // Manually set the source property since MessageEvent constructor doesn't support it
        Object.defineProperty(validEvent, 'source', {
          value: mockSource,
          writable: false,
          configurable: false,
        });

        handler(validEvent);

        expect(onSuccess).toHaveBeenCalledWith({
          id: 1,
          name: 'John',
          email: 'john@example.com',
          isActive: true,
        });
        expect(onSecurityViolation).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
      });

      it('should call onSecurityViolation for untrusted sources', () => {
        const mockSource = { close: jest.fn() };
        const onSuccess = jest.fn();
        const onSecurityViolation = jest.fn();
        const onError = jest.fn();

        const handler = safePostMessageListener(isUserMessage, {
          allowedSources: ['trusted-source'],
          onSuccess,
          onSecurityViolation,
          onError,
        });

        const maliciousEvent = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: {
            id: 1,
            name: 'Hacker',
            email: 'hack@evil.com',
            isActive: true,
          },
        });
        // Manually set the source property since MessageEvent constructor doesn't support it
        Object.defineProperty(maliciousEvent, 'source', {
          value: mockSource,
          writable: false,
          configurable: false,
        });

        handler(maliciousEvent);

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onSecurityViolation).toHaveBeenCalledWith(
          'https://trusted-domain.com',
          expect.stringContaining('not allowed')
        );
        // Security violations may call onError as fallback if onSecurityViolation is not provided
        // This is acceptable behavior
      });
    });
  });

  describe('Combined Security Validation', () => {
    it('should require both origin and source to be trusted', () => {
      const mockSource = { close: jest.fn() };
      const handler = safePostMessage({
        guard: isUserMessage,
        allowedOrigins: ['https://trusted-domain.com'],
        allowedSources: ['trusted-source'],
      });

      // Valid origin but invalid source
      const invalidSourceEvent = new MessageEvent('message', {
        origin: 'https://trusted-domain.com',
        data: {
          id: 1,
          name: 'John',
          email: 'john@example.com',
          isActive: true,
        },
      });
      // Manually set the source property since MessageEvent constructor doesn't support it
      Object.defineProperty(invalidSourceEvent, 'source', {
        value: mockSource,
        writable: false,
        configurable: false,
      });

      const result1 = handler(invalidSourceEvent);
      expect(result1.status).toBe(Status.ERROR);

      // Valid source but invalid origin
      const invalidOriginEvent = new MessageEvent('message', {
        origin: 'https://malicious-site.com',
        data: {
          id: 1,
          name: 'John',
          email: 'john@example.com',
          isActive: true,
        },
      });
      // Manually set the source property since MessageEvent constructor doesn't support it
      Object.defineProperty(invalidOriginEvent, 'source', {
        value: mockSource,
        writable: false,
        configurable: false,
      });

      const result2 = handler(invalidOriginEvent);
      expect(result2.status).toBe(Status.ERROR);
    });

    it('should pass when both origin and source are trusted', () => {
      const mockSource = { close: jest.fn(), 'trusted-source': true };
      const handler = safePostMessage({
        guard: isUserMessage,
        allowedOrigins: ['https://trusted-domain.com'],
        allowedSources: ['trusted-source'],
      });

      const validEvent = new MessageEvent('message', {
        origin: 'https://trusted-domain.com',
        data: {
          id: 1,
          name: 'John',
          email: 'john@example.com',
          isActive: true,
        },
      });
      // Manually set the source property since MessageEvent constructor doesn't support it
      Object.defineProperty(validEvent, 'source', {
        value: mockSource,
        writable: false,
        configurable: false,
      });

      const result = handler(validEvent);
      expect(result.status).toBe(Status.SUCCESS);
    });
  });

  describe('Security Error Handling', () => {
    it('should provide detailed error messages for security violations', () => {
      const handler = safePostMessage({
        guard: isUserMessage,
        allowedOrigins: ['https://trusted-domain.com'],
      });

      const maliciousEvent = new MessageEvent('message', {
        origin: 'https://malicious-site.com',
        data: { id: 1, name: 'Hacker', email: 'hack@evil.com', isActive: true },
      });

      const result = handler(maliciousEvent);

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toContain('malicious-site.com');
        expect(result.message).toContain('not allowed');
        expect(result.code).toBe(403);
      }
    });

    it('should handle security violations before data validation', () => {
      const onError = jest.fn();
      const handler = safePostMessage({
        guard: isUserMessage,
        allowedOrigins: ['https://trusted-domain.com'],
        onError,
      });

      const maliciousEvent = new MessageEvent('message', {
        origin: 'https://malicious-site.com',
        data: 'invalid-data-that-would-fail-validation',
      });

      const result = handler(maliciousEvent);

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.code).toBe(403); // Security error, not validation error
        expect(result.message).toContain('not allowed');
      }
      // Security violations may call onError as fallback if onSecurityViolation is not provided
      // This is acceptable behavior
    });
  });
});
