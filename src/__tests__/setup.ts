// Jest setup file for guardz-event tests

// Mock DOM environment for jsdom
Object.defineProperty(window, 'addEventListener', {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(window, 'removeEventListener', {
  value: jest.fn(),
  writable: true,
});

// Mock MessageEvent
global.MessageEvent = class MessageEvent extends Event {
  data: any;
  origin: string;
  lastEventId: string;
  ports: MessagePort[];

  constructor(type: string, init?: MessageEventInit) {
    super(type);
    this.data = init?.data;
    this.origin = init?.origin || '';
    this.lastEventId = init?.lastEventId || '';
    this.ports = init?.ports || [];
  }
} as any;

// Mock CustomEvent
global.CustomEvent = class CustomEvent extends Event {
  detail: any;

  constructor(type: string, init?: CustomEventInit) {
    super(type);
    this.detail = init?.detail;
  }
} as any;

// Mock StorageEvent
global.StorageEvent = class StorageEvent extends Event {
  key: string | null;
  oldValue: string | null;
  newValue: string | null;
  url: string;
  storageArea: Storage | null;

  constructor(type: string, init?: StorageEventInit) {
    super(type);
    this.key = init?.key || null;
    this.oldValue = init?.oldValue || null;
    this.newValue = init?.newValue || null;
    this.url = init?.url || '';
    this.storageArea = init?.storageArea || null;
  }
} as any;

// Mock WebSocket
global.WebSocket = class WebSocket extends EventTarget {
  readyState: number;
  url: string;

  constructor(url: string) {
    super();
    this.url = url;
    this.readyState = 1; // OPEN
  }

  addEventListener(type: string, listener: EventListener) {
    super.addEventListener(type, listener);
  }

  removeEventListener(type: string, listener: EventListener) {
    super.removeEventListener(type, listener);
  }
} as any;

// Mock EventSource
global.EventSource = class EventSource extends EventTarget {
  readyState: number;
  url: string;

  constructor(url: string) {
    super();
    this.url = url;
    this.readyState = 1; // OPEN
  }

  addEventListener(type: string, listener: EventListener) {
    super.addEventListener(type, listener);
  }

  removeEventListener(type: string, listener: EventListener) {
    super.removeEventListener(type, listener);
  }
} as any;
