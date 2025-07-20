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

// ... (all other event data interfaces, as in event-types.ts) 