/// <reference types="jest" />
import {
  safe,
  SafeEventBuilder,
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

const isMouseEventData = (
  data: unknown
): data is { clientX: number; clientY: number; button: number } => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).clientX === 'number' &&
    typeof (data as any).clientY === 'number' &&
    typeof (data as any).button === 'number'
  );
};

describe('Fluent API Builder', () => {
  describe('safe() function', () => {
    it('should create a new SafeEventBuilder instance', () => {
      const builder = safe();
      expect(builder).toBeInstanceOf(SafeEventBuilder);
    });
  });

  describe('SafeEventBuilder', () => {
    describe('postMessage()', () => {
      it('should set event type to postMessage', () => {
        const builder = safe().postMessage();
        expect((builder as any).eventType).toBe('postmessage');
      });

      it('should return the builder for chaining', () => {
        const builder = safe().postMessage();
        expect(builder).toBeInstanceOf(SafeEventBuilder);
      });
    });

    describe('webSocket()', () => {
      it('should set event type to webSocket', () => {
        const builder = safe().webSocket();
        expect((builder as any).eventType).toBe('websocket');
      });

      it('should return the builder for chaining', () => {
        const builder = safe().webSocket();
        expect(builder).toBeInstanceOf(SafeEventBuilder);
      });
    });

    describe('domEvent()', () => {
      it('should set event type to domEvent with custom type', () => {
        const builder = safe().domEvent('click');
        expect((builder as any).eventType).toBe('click');
      });

      it('should return the builder for chaining', () => {
        const builder = safe().domEvent('click');
        expect(builder).toBeInstanceOf(SafeEventBuilder);
      });
    });

    describe('eventSource()', () => {
      it('should set event type to eventSource', () => {
        const builder = safe().eventSource();
        expect((builder as any).eventType).toBe('eventsource');
      });

      it('should return the builder for chaining', () => {
        const builder = safe().eventSource();
        expect(builder).toBeInstanceOf(SafeEventBuilder);
      });
    });

    describe('customEvent()', () => {
      it('should set event type to customEvent with custom type', () => {
        const builder = safe().customEvent('stock-update');
        expect((builder as any).eventType).toBe('stock-update');
      });

      it('should return the builder for chaining', () => {
        const builder = safe().customEvent('stock-update');
        expect(builder).toBeInstanceOf(SafeEventBuilder);
      });
    });

    describe('storageEvent()', () => {
      it('should set event type to storageEvent', () => {
        const builder = safe().storageEvent();
        expect((builder as any).eventType).toBe('storage');
      });

      it('should return the builder for chaining', () => {
        const builder = safe().storageEvent();
        expect(builder).toBeInstanceOf(SafeEventBuilder);
      });
    });

    describe('guard()', () => {
      it('should set the guard function', () => {
        const builder = safe().guard(isUserMessage);
        expect((builder as any).config.guard).toBe(isUserMessage);
      });

      it('should return the builder for chaining', () => {
        const builder = safe().guard(isUserMessage);
        expect(builder).toBeInstanceOf(SafeEventBuilder);
      });
    });

    describe('tolerance()', () => {
      it('should enable tolerance mode', () => {
        const builder = safe().tolerance(true);
        expect((builder as any).config.tolerance).toBe(true);
      });

      it('should enable tolerance mode by default', () => {
        const builder = safe().tolerance();
        expect((builder as any).config.tolerance).toBe(true);
      });

      it('should return the builder for chaining', () => {
        const builder = safe().tolerance(true);
        expect(builder).toBeInstanceOf(SafeEventBuilder);
      });
    });

    describe('identifier()', () => {
      it('should set the identifier', () => {
        const builder = safe().identifier('test-id');
        expect((builder as any).config.identifier).toBe('test-id');
      });

      it('should return the builder for chaining', () => {
        const builder = safe().identifier('test-id');
        expect(builder).toBeInstanceOf(SafeEventBuilder);
      });
    });

    describe('timeout()', () => {
      it('should set the timeout', () => {
        const builder = safe().timeout(5000);
        expect((builder as any).config.timeout).toBe(5000);
      });

      it('should return the builder for chaining', () => {
        const builder = safe().timeout(5000);
        expect(builder).toBeInstanceOf(SafeEventBuilder);
      });
    });

    describe('allowedOrigins()', () => {
      it('should set allowed origins', () => {
        const origins = ['https://trusted-domain.com'];
        const builder = safe().allowedOrigins(origins);
        expect((builder as any).config.allowedOrigins).toBe(origins);
      });

      it('should return the builder for chaining', () => {
        const builder = safe().allowedOrigins(['https://trusted-domain.com']);
        expect(builder).toBeInstanceOf(SafeEventBuilder);
      });
    });

    describe('allowedSources()', () => {
      it('should set allowed sources', () => {
        const sources = ['trusted-source'];
        const builder = safe().allowedSources(sources);
        expect((builder as any).config.allowedSources).toBe(sources);
      });

      it('should return the builder for chaining', () => {
        const builder = safe().allowedSources(['trusted-source']);
        expect(builder).toBeInstanceOf(SafeEventBuilder);
      });
    });

    describe('onError()', () => {
      it('should set the error callback', () => {
        const onError = jest.fn();
        const builder = safe().onError(onError);
        expect((builder as any).config.onError).toBe(onError);
      });

      it('should return the builder for chaining', () => {
        const onError = jest.fn();
        const builder = safe().onError(onError);
        expect(builder).toBeInstanceOf(SafeEventBuilder);
      });
    });

    describe('createHandler()', () => {
      it('should create a PostMessage handler', () => {
        const handler = safe()
          .postMessage()
          .guard(isUserMessage)
          .allowedOrigins(['https://trusted-domain.com'])
          .createHandler() as (event: MessageEvent) => any;

        expect(typeof handler).toBe('function');

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
      });

      it('should create a WebSocket handler', () => {
        const handler = safe()
          .webSocket()
          .guard(isStockUpdate)
          .createHandler() as (event: MessageEvent) => any;

        expect(typeof handler).toBe('function');

        const validEvent = new MessageEvent('message', {
          data: { symbol: 'AAPL', price: 150.25, change: 2.5 },
        });

        const result = handler(validEvent);
        expect(result.status).toBe(Status.SUCCESS);
      });

      it('should create a DOM event handler', () => {
        const handler = safe()
          .domEvent('click')
          .guard(isMouseEventData)
          .createHandler() as (event: Event) => any;

        expect(typeof handler).toBe('function');

        const validEvent = new MouseEvent('click', {
          clientX: 100,
          clientY: 200,
          button: 0,
        });

        const result = handler(validEvent);
        expect(result.status).toBe(Status.SUCCESS);
      });

      it('should create an EventSource handler', () => {
        const handler = safe()
          .eventSource()
          .guard(isStockUpdate)
          .createHandler() as (event: MessageEvent) => any;

        expect(typeof handler).toBe('function');

        const validEvent = new MessageEvent('message', {
          data: { symbol: 'AAPL', price: 150.25, change: 2.5 },
        });

        const result = handler(validEvent);
        expect(result.status).toBe(Status.SUCCESS);
      });

      it('should create a CustomEvent handler', () => {
        const handler = safe()
          .customEvent('stock-update')
          .guard(isStockUpdate)
          .createHandler() as (event: CustomEvent) => any;

        expect(typeof handler).toBe('function');

        const validEvent = new CustomEvent('stock-update', {
          detail: { symbol: 'AAPL', price: 150.25, change: 2.5 },
        });

        const result = handler(validEvent);
        expect(result.status).toBe(Status.SUCCESS);
      });

      it('should create a StorageEvent handler', () => {
        const handler = safe()
          .storageEvent()
          .guard((data: unknown): data is { key: string; url: string } => {
            return (
              typeof data === 'object' &&
              data !== null &&
              typeof (data as any).key === 'string' &&
              typeof (data as any).url === 'string'
            );
          })
          .createHandler() as (event: StorageEvent) => any;

        expect(typeof handler).toBe('function');

        const validEvent = new StorageEvent('storage', {
          key: 'user_preferences',
          oldValue: 'old_value',
          newValue: 'new_value',
          url: 'https://example.com',
        });

        const result = handler(validEvent);
        expect(result.status).toBe(Status.SUCCESS);
      });

      it('should handle security violations in PostMessage', () => {
        const handler = safe()
          .postMessage()
          .guard(isUserMessage)
          .allowedOrigins(['https://trusted-domain.com'])
          .createHandler() as (event: MessageEvent) => any;

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
        }
      });

      it('should handle validation errors', () => {
        const handler = safe()
          .postMessage()
          .guard(isUserMessage)
          .allowedOrigins(['https://trusted-domain.com'])
          .createHandler() as (event: MessageEvent) => any;

        const invalidEvent = new MessageEvent('message', {
          origin: 'https://trusted-domain.com',
          data: {
            id: 'not-a-number',
            name: 'John',
            email: 'john@example.com',
            isActive: true,
          },
        });

        const result = handler(invalidEvent);
        expect(result.status).toBe(Status.ERROR);
        if (result.status === Status.ERROR) {
          expect(result.code).toBe(500);
        }
      });
    });
  });

  describe('Complex chaining', () => {
    it('should support full configuration chain', () => {
      const onError = jest.fn();
      const handler = safe()
        .postMessage()
        .guard(isUserMessage)
        .tolerance(true)
        .identifier('user-message-handler')
        .timeout(3000)
        .allowedOrigins(['https://trusted-domain.com'])
        .allowedSources(['trusted-source'])
        .onError(onError)
        .createHandler() as (event: MessageEvent) => any;

      expect(typeof handler).toBe('function');

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
        value: { 'trusted-source': true },
        writable: false,
        configurable: false,
      });

      const result = handler(validEvent);
      expect(result.status).toBe(Status.SUCCESS);
    });

    it('should handle null events gracefully', () => {
      const handler = safe()
        .postMessage()
        .guard(isUserMessage)
        .createHandler() as (event: MessageEvent) => any;

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
