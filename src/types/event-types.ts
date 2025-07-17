// ===============================
// DOM Event Types
// ===============================
export interface DOMEventData {
  type: string;
  target: EventTarget | null;
  currentTarget: EventTarget | null;
  eventPhase: number;
  bubbles: boolean;
  cancelable: boolean;
  defaultPrevented: boolean;
  composed: boolean;
  timeStamp: number;
  isTrusted: boolean;
}

export interface MouseEventData extends DOMEventData {
  clientX: number;
  clientY: number;
  screenX: number;
  screenY: number;
  button: number;
  buttons: number;
  relatedTarget: EventTarget | null;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

export interface KeyboardEventData extends DOMEventData {
  key: string;
  code: string;
  keyCode: number;
  which: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  repeat: boolean;
  isComposing: boolean;
}

// ===============================
// PostMessage Types
// ===============================
export interface PostMessageData {
  origin: string;
  source: Window | MessagePort | ServiceWorker | null;
  data: any;
  ports?: MessagePort[];
}

export interface PostMessageEvent {
  type: 'postmessage';
  message: PostMessageData;
  timestamp: number;
}

// ===============================
// WebSocket Types
// ===============================
export interface WebSocketData {
  data: string | ArrayBuffer | Blob;
  type: string;
  target: WebSocket;
  readyState: number;
  url: string;
  protocol: string;
  extensions: string;
}

export interface WebSocketEvent {
  type: 'websocket';
  message: WebSocketData;
  timestamp: number;
}

// ===============================
// EventSource/Server-Sent Events Types
// ===============================
export interface EventSourceData {
  data: string;
  type: string;
  lastEventId: string;
  origin: string;
  target: EventSource;
}

export interface EventSourceEvent {
  type: 'eventsource';
  message: EventSourceData;
  timestamp: number;
}

// ===============================
// Custom Event Types
// ===============================
export interface CustomEventData {
  detail: any;
  type: string;
  target: EventTarget | null;
  bubbles: boolean;
  cancelable: boolean;
}

// ===============================
// Storage Event Types
// ===============================
export interface StorageEventData {
  key: string | null;
  newValue: string | null;
  oldValue: string | null;
  storageArea: Storage;
  url: string;
}

// ===============================
// Broadcast Channel Types
// ===============================
export interface BroadcastChannelData {
  data: any;
  origin: string;
  source: string;
}

// ===============================
// Service Worker Message Types
// ===============================
export interface ServiceWorkerMessageData {
  data: any;
  origin: string;
  source: ServiceWorker | null;
  ports?: MessagePort[];
}

// ===============================
// Intersection Observer Types
// ===============================
export interface IntersectionObserverData {
  isIntersecting: boolean;
  intersectionRatio: number;
  boundingClientRect: DOMRectReadOnly;
  rootBounds: DOMRectReadOnly | null;
  target: Element;
  time: number;
}

// ===============================
// Resize Observer Types
// ===============================
export interface ResizeObserverData {
  contentRect: DOMRectReadOnly;
  borderBoxSize: ResizeObserverSize[];
  contentBoxSize: ResizeObserverSize[];
  devicePixelContentBoxSize: ResizeObserverSize[];
  target: Element;
}

// ===============================
// Mutation Observer Types
// ===============================
export interface MutationObserverData {
  type: 'childList' | 'attributes' | 'characterData';
  target: Node;
  addedNodes: NodeList;
  removedNodes: NodeList;
  previousSibling: Node | null;
  nextSibling: Node | null;
  attributeName: string | null;
  attributeNamespace: string | null;
  oldValue: string | null;
}

// ===============================
// Performance Observer Types
// ===============================
export interface PerformanceObserverData {
  entries: PerformanceEntry[];
  observer: PerformanceObserver;
}

// ===============================
// Error Event Types
// ===============================
export interface ErrorEventData {
  message: string;
  filename: string;
  lineno: number;
  colno: number;
  error: Error | null;
}

// ===============================
// Fetch Event Types
// ===============================
export interface FetchEventData {
  request: Request;
  clientId: string;
  resultingClientId: string;
  preloadResponse: Promise<Response>;
  isReload: boolean;
}

// ===============================
// Push Event Types
// ===============================
export interface PushEventData {
  data: PushMessageData | null;
}

export interface PushMessageData {
  arrayBuffer(): ArrayBuffer;
  blob(): Blob;
  json(): any;
  text(): string;
}

// ===============================
// Notification Event Types
// ===============================
export interface NotificationEventData {
  notification: Notification;
  action: string;
  reply: string;
}

// ===============================
// Payment Request Types
// ===============================
export interface PaymentRequestData {
  methodName: string;
  details: PaymentDetailsUpdate;
  shippingAddress?: AddressInit;
  shippingOption?: string;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
}

// ===============================
// Geolocation Types
// ===============================
export interface GeolocationData {
  coords: GeolocationCoordinates;
  timestamp: number;
}

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
}

// ===============================
// Device Orientation Types
// ===============================
export interface DeviceOrientationData {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  absolute: boolean;
}

// ===============================
// Device Motion Types
// ===============================
export interface DeviceMotionData {
  acceleration: DeviceAcceleration | null;
  accelerationIncludingGravity: DeviceAcceleration | null;
  rotationRate: DeviceRotationRate | null;
  interval: number;
}

export interface DeviceAcceleration {
  x: number | null;
  y: number | null;
  z: number | null;
}

export interface DeviceRotationRate {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

// ===============================
// Clipboard Types
// ===============================
export interface ClipboardData {
  clipboardData: DataTransfer | null;
  type: 'copy' | 'cut' | 'paste';
}

// ===============================
// Drag and Drop Types
// ===============================
export interface DragEventData {
  dataTransfer: DataTransfer | null;
  screenX: number;
  screenY: number;
  clientX: number;
  clientY: number;
  button: number;
  buttons: number;
  relatedTarget: EventTarget | null;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

// ===============================
// Form Event Types
// ===============================
export interface FormEventData {
  target: HTMLFormElement | null;
  submitter: HTMLElement | null;
}

// ===============================
// Input Event Types
// ===============================
export interface InputEventData {
  data: string | null;
  inputType: string;
  isComposing: boolean;
  target: HTMLInputElement | HTMLTextAreaElement | null;
}

// ===============================
// Focus Event Types
// ===============================
export interface FocusEventData {
  relatedTarget: EventTarget | null;
  target: EventTarget | null;
}

// ===============================
// Touch Event Types
// ===============================
export interface TouchEventData {
  touches: TouchList;
  targetTouches: TouchList;
  changedTouches: TouchList;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

// ===============================
// Wheel Event Types
// ===============================
export interface WheelEventData {
  deltaX: number;
  deltaY: number;
  deltaZ: number;
  deltaMode: number;
  target: EventTarget | null;
}

// ===============================
// Media Event Types
// ===============================
export interface MediaEventData {
  target: HTMLMediaElement | null;
  currentTime: number;
  duration: number;
  paused: boolean;
  ended: boolean;
  readyState: number;
  networkState: number;
}

// ===============================
// Gamepad Event Types
// ===============================
export interface GamepadEventData {
  gamepad: Gamepad;
}

// ===============================
// Battery Event Types
// ===============================
export interface BatteryEventData {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

// ===============================
// Network Information Types
// ===============================
export interface NetworkInformationData {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

// ===============================
// Generic Event Wrapper
// ===============================
export type EventData = 
  | { type: 'dom'; data: DOMEventData }
  | { type: 'mouse'; data: MouseEventData }
  | { type: 'keyboard'; data: KeyboardEventData }
  | { type: 'postmessage'; data: PostMessageData }
  | { type: 'websocket'; data: WebSocketData }
  | { type: 'eventsource'; data: EventSourceData }
  | { type: 'custom'; data: CustomEventData }
  | { type: 'storage'; data: StorageEventData }
  | { type: 'broadcast'; data: BroadcastChannelData }
  | { type: 'serviceworker'; data: ServiceWorkerMessageData }
  | { type: 'intersection'; data: IntersectionObserverData }
  | { type: 'resize'; data: ResizeObserverData }
  | { type: 'mutation'; data: MutationObserverData }
  | { type: 'performance'; data: PerformanceObserverData }
  | { type: 'error'; data: ErrorEventData }
  | { type: 'fetch'; data: FetchEventData }
  | { type: 'push'; data: PushEventData }
  | { type: 'notification'; data: NotificationEventData }
  | { type: 'payment'; data: PaymentRequestData }
  | { type: 'geolocation'; data: GeolocationData }
  | { type: 'orientation'; data: DeviceOrientationData }
  | { type: 'motion'; data: DeviceMotionData }
  | { type: 'clipboard'; data: ClipboardData }
  | { type: 'drag'; data: DragEventData }
  | { type: 'form'; data: FormEventData }
  | { type: 'input'; data: InputEventData }
  | { type: 'focus'; data: FocusEventData }
  | { type: 'touch'; data: TouchEventData }
  | { type: 'wheel'; data: WheelEventData }
  | { type: 'media'; data: MediaEventData }
  | { type: 'gamepad'; data: GamepadEventData }
  | { type: 'battery'; data: BatteryEventData }
  | { type: 'network'; data: NetworkInformationData };

// ===============================
// Error Categories
// ===============================
export interface ValidationError {
  readonly code: 'VALIDATION_ERROR';
  readonly message: string;
  readonly field?: string;
  readonly value?: any;
}

export interface SecurityError {
  readonly code: 'SECURITY_ERROR';
  readonly message: string;
  readonly origin?: string;
  readonly source?: string;
}

export interface NetworkError {
  readonly code: 'NETWORK_ERROR';
  readonly message: string;
  readonly url?: string;
}

export interface TimeoutError {
  readonly code: 'TIMEOUT_ERROR';
  readonly message: string;
  readonly timeout?: number;
}

export interface UnknownError {
  readonly code: 'UNKNOWN_ERROR';
  readonly message: string;
  readonly originalError?: unknown;
}

export type EventError = ValidationError | SecurityError | NetworkError | TimeoutError | UnknownError; 