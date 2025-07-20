// ===============================
// Modern API Examples
// ===============================

import { 
  onEvent, 
  onMessage, 
  onClick, 
  onCustom, 
  onStorage,
  eventGuard,
  safeHandler,
  safeTolerant,
  createTypedHandler
} from 'guardz-event';

// ===============================
// Type Guards
// ===============================

// Simple type guards for examples
const isChatMessage = (data: unknown): data is { 
  text: string; 
  userId: string; 
  timestamp: number;
} => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).text === 'string' &&
         typeof (data as any).userId === 'string' &&
         typeof (data as any).timestamp === 'number';
};

const isUserData = (data: unknown): data is {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
} => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).id === 'number' &&
         typeof (data as any).name === 'string' &&
         typeof (data as any).email === 'string' &&
         typeof (data as any).isActive === 'boolean';
};

const isClickData = (data: unknown): data is {
  clientX: number;
  clientY: number;
  button: number;
} => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).clientX === 'number' &&
         typeof (data as any).clientY === 'number' &&
         typeof (data as any).button === 'number';
};

const isStorageData = (data: unknown): data is {
  key: string;
  newValue: string | null;
  oldValue: string | null;
} => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).key === 'string' &&
         ((data as any).newValue === null || typeof (data as any).newValue === 'string') &&
         ((data as any).oldValue === null || typeof (data as any).oldValue === 'string');
};

// ===============================
// 1. Primary API: onEvent
// ===============================

// Example 1: Generic event handler
const genericHandler = onEvent('message', isChatMessage, {
  onSuccess: (data) => {
    console.log('Received chat message:', data.text);
    displayMessage(data.text, data.userId);
  },
  onError: (error) => {
    console.error('Message error:', error);
  },
  tolerance: true,
  allowedOrigins: ['https://trusted-chat.com']
});

window.addEventListener('message', genericHandler);

// ===============================
// 2. Specialized Handlers
// ===============================

// Example 2: PostMessage with security
const chatHandler = onMessage(isChatMessage, {
  onSuccess: (data) => {
    console.log('Chat message from', data.userId, ':', data.text);
    addMessageToChat(data);
  },
  onTypeMismatch: (error) => {
    console.warn('Invalid message format:', error);
  },
  onSecurityViolation: (origin, message) => {
    console.error('Security violation from', origin, ':', message);
    logSecurityEvent(origin, message);
  },
  allowedOrigins: ['https://chat.example.com', 'https://api.chat.example.com']
});

window.addEventListener('message', chatHandler);

// Example 3: DOM click events
const clickHandler = onClick(isClickData, {
  onSuccess: (data) => {
    console.log('Click at', data.clientX, data.clientY);
    handleUserClick(data);
  },
  onError: (error) => {
    console.error('Click event error:', error);
  }
});

document.addEventListener('click', clickHandler);

// Example 4: Custom events
const userActionHandler = onCustom('user-action', isUserData, {
  onSuccess: (data) => {
    console.log('User action:', data.name, 'is', data.isActive ? 'active' : 'inactive');
    updateUserStatus(data);
  },
  tolerance: true,
  onTypeMismatch: (error) => {
    console.warn('Partial user data:', error);
  }
});

document.addEventListener('user-action', userActionHandler);

// Example 5: Storage events
const storageHandler = onStorage(isStorageData, {
  onSuccess: (data) => {
    console.log('Storage changed:', data.key, 'from', data.oldValue, 'to', data.newValue);
    syncStorageChange(data);
  }
});

window.addEventListener('storage', storageHandler);

// ===============================
// 3. Fluent Builder API
// ===============================

// Example 6: Complex configuration with builder
const secureChatHandler = eventGuard()
  .type('message')
  .validate(isChatMessage)
  .onSuccess((data) => {
    console.log('Secure chat message:', data.text);
    processSecureMessage(data);
  })
  .onError((error) => {
    console.error('Chat error:', error);
  })
  .onTypeMismatch((error) => {
    console.warn('Invalid chat format:', error);
  })
  .onSecurityViolation((origin, message) => {
    console.error('Security breach from', origin, ':', message);
    blockOrigin(origin);
  })
  .tolerance(true)
  .allowedOrigins(['https://secure-chat.com'])
  .allowedSources(['chat-widget', 'mobile-app'])
  .identifier('secure-chat')
  .build();

window.addEventListener('message', secureChatHandler);

// Example 7: Simple builder for DOM events
const simpleClickHandler = eventGuard()
  .type('click')
  .validate(isClickData)
  .onSuccess((data) => {
    console.log('Click detected at', data.clientX, data.clientY);
    trackUserInteraction(data);
  })
  .build();

document.addEventListener('click', simpleClickHandler);

// ===============================
// 4. Utility Functions
// ===============================

// Example 8: Minimal configuration
const minimalHandler = safeHandler(isChatMessage, 
  (data) => console.log('Simple message:', data.text),
  (error) => console.error('Simple error:', error)
);

window.addEventListener('message', minimalHandler);

// Example 9: Tolerant handler
const tolerantHandler = safeTolerant(isUserData,
  (data) => {
    console.log('User data (may be partial):', data);
    updateUserProfile(data);
  },
  (error) => console.warn('Tolerant error:', error)
);

window.addEventListener('message', tolerantHandler);

// ===============================
// 5. Type Utilities
// ===============================

// Example 10: Typed handler factory
const createChatHandler = createTypedHandler(isChatMessage);

const chatHandler1 = createChatHandler({
  onSuccess: (data) => console.log('Chat 1:', data.text),
  tolerance: true
});

const chatHandler2 = createChatHandler({
  onSuccess: (data) => console.log('Chat 2:', data.text),
  allowedOrigins: ['https://chat2.example.com']
});

window.addEventListener('message', chatHandler1);
window.addEventListener('message', chatHandler2);

// ===============================
// Real-World Use Cases
// ===============================

// Use Case 1: E-commerce Product Updates
const isProductUpdate = (data: unknown): data is {
  productId: string;
  price: number;
  stock: number;
  discount?: number;
} => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).productId === 'string' &&
         typeof (data as any).price === 'number' &&
         typeof (data as any).stock === 'number';
};

const productUpdateHandler = onMessage(isProductUpdate, {
  onSuccess: (data) => {
    updateProductDisplay(data.productId, data.price, data.stock);
    if (data.discount) {
      showDiscountBadge(data.discount);
    }
  },
  tolerance: true,
  onTypeMismatch: (error) => {
    console.warn('Partial product update:', error);
  }
});

// Use Case 2: Form Validation
const isFormSubmission = (data: unknown): data is {
  email: string;
  password: string;
  agreeToTerms: boolean;
} => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).email === 'string' &&
         typeof (data as any).password === 'string' &&
         typeof (data as any).agreeToTerms === 'boolean';
};

const formHandler = onClick(isFormSubmission, {
  onSuccess: (data) => {
    if (data.agreeToTerms) {
      submitForm(data.email, data.password);
    } else {
      showTermsError();
    }
  },
  onTypeMismatch: (error) => {
    showValidationError('Please fill all required fields');
  }
});

// Use Case 3: Analytics Events
const isAnalyticsEvent = (data: unknown): data is {
  event: string;
  properties: Record<string, any>;
  userId?: string;
} => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).event === 'string' &&
         typeof (data as any).properties === 'object';
};

const analyticsHandler = onCustom('analytics', isAnalyticsEvent, {
  onSuccess: (data) => {
    trackEvent(data.event, data.properties, data.userId);
  },
  tolerance: true, // Analytics should be resilient
  onTypeMismatch: (error) => {
    console.warn('Analytics event validation failed:', error);
    // Still try to track with partial data
  }
});

// Use Case 4: Cross-Origin Communication
const isIframeMessage = (data: unknown): data is {
  type: 'resize' | 'scroll' | 'focus';
  height?: number;
  scrollTop?: number;
} => {
  return typeof data === 'object' && data !== null &&
         typeof (data as any).type === 'string' &&
         ['resize', 'scroll', 'focus'].includes((data as any).type);
};

const iframeHandler = onMessage(isIframeMessage, {
  onSuccess: (data) => {
    switch (data.type) {
      case 'resize':
        if (data.height) resizeIframe(data.height);
        break;
      case 'scroll':
        if (data.scrollTop) syncScroll(data.scrollTop);
        break;
      case 'focus':
        focusIframe();
        break;
    }
  },
  allowedOrigins: ['https://embedded-widget.com'],
  onSecurityViolation: (origin, message) => {
    console.error('Untrusted iframe message from', origin);
  }
});

// ===============================
// Advanced Patterns
// ===============================

// Pattern 1: Event Handler Composition
const createComposedHandler = <T>(
  guard: (data: unknown) => data is T,
  handlers: Array<(data: T) => void>
) => {
  return onMessage(guard, {
    onSuccess: (data) => {
      handlers.forEach(handler => handler(data));
    }
  });
};

const composedHandler = createComposedHandler(isChatMessage, [
  (data) => console.log('Handler 1:', data.text),
  (data) => saveToDatabase(data),
  (data) => updateUI(data)
]);

// Pattern 2: Conditional Validation
const createConditionalHandler = <T>(
  guard: (data: unknown) => data is T,
  condition: (data: T) => boolean,
  onSuccess: (data: T) => void,
  onConditionFailed: (data: T) => void
) => {
  return onMessage(guard, {
    onSuccess: (data) => {
      if (condition(data)) {
        onSuccess(data);
      } else {
        onConditionFailed(data);
      }
    }
  });
};

const conditionalHandler = createConditionalHandler(
  isUserData,
  (data) => data.isActive,
  (data) => console.log('Active user:', data.name),
  (data) => console.log('Inactive user:', data.name)
);

// Pattern 3: Retry Logic
const createRetryHandler = <T>(
  guard: (data: unknown) => data is T,
  onSuccess: (data: T) => void,
  maxRetries: number = 3
) => {
  let retryCount = 0;
  
  return onMessage(guard, {
    onSuccess: (data) => {
      try {
        onSuccess(data);
        retryCount = 0; // Reset on success
      } catch (error) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.warn(`Retry ${retryCount}/${maxRetries} for message:`, data);
          // Re-process the same data
          setTimeout(() => onSuccess(data), 1000 * retryCount);
        } else {
          console.error('Max retries exceeded for message:', data);
        }
      }
    }
  });
};

const retryHandler = createRetryHandler(
  isChatMessage,
  (data) => {
    // Simulate potential failure
    if (Math.random() < 0.3) {
      throw new Error('Random failure');
    }
    console.log('Successfully processed:', data.text);
  },
  3
);

// ===============================
// Performance Optimizations
// ===============================

// Optimization 1: Debounced Handler
const createDebouncedHandler = <T>(
  guard: (data: unknown) => data is T,
  onSuccess: (data: T) => void,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;
  
  return onMessage(guard, {
    onSuccess: (data) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => onSuccess(data), delay);
    }
  });
};

const debouncedHandler = createDebouncedHandler(
  isUserData,
  (data) => {
    console.log('Debounced user update:', data.name);
    updateUserProfile(data);
  },
  500
);

// Optimization 2: Throttled Handler
const createThrottledHandler = <T>(
  guard: (data: unknown) => data is T,
  onSuccess: (data: T) => void,
  limit: number = 100
) => {
  let lastCall = 0;
  
  return onMessage(guard, {
    onSuccess: (data) => {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        onSuccess(data);
      }
    }
  });
};

const throttledHandler = createThrottledHandler(
  isClickData,
  (data) => {
    console.log('Throttled click:', data.clientX, data.clientY);
    trackClick(data);
  },
  100
);

// ===============================
// Error Handling Patterns
// ===============================

// Pattern 1: Graceful Degradation
const createGracefulHandler = <T>(
  guard: (data: unknown) => data is T,
  onSuccess: (data: T) => void,
  fallback: () => void
) => {
  return onMessage(guard, {
    onSuccess: (data) => {
      try {
        onSuccess(data);
      } catch (error) {
        console.error('Handler failed, using fallback:', error);
        fallback();
      }
    },
    onError: (error) => {
      console.error('Validation failed, using fallback:', error);
      fallback();
    }
  });
};

const gracefulHandler = createGracefulHandler(
  isChatMessage,
  (data) => {
    // Primary functionality
    displayMessage(data.text, data.userId);
    console.log('Updating chat history:', data);
  },
  () => {
    // Fallback functionality
    console.log('Generic message: New message received');
  }
);

// Pattern 2: Error Recovery
const createRecoveryHandler = <T>(
  guard: (data: unknown) => data is T,
  onSuccess: (data: T) => void,
  onRecovery: (data: Partial<T>) => void
) => {
  return onMessage(guard, {
    onSuccess: (data) => onSuccess(data),
    tolerance: true,
    onTypeMismatch: (error) => {
      console.warn('Attempting recovery for:', error);
      // Try to extract partial data and recover
      try {
        const partialData = extractPartialData(error);
        onRecovery(partialData);
      } catch {
        console.error('Recovery failed');
      }
    }
  });
};

const recoveryHandler = createRecoveryHandler(
  isUserData,
  (data) => {
    console.log('Full user data:', data);
    updateFullProfile(data);
  },
  (partialData) => {
    console.log('Partial user data:', partialData);
    updatePartialProfile(partialData);
  }
);

// ===============================
// Helper Functions (for examples)
// ===============================

function displayMessage(text: string, userId: string) {
  console.log(`[${userId}]: ${text}`);
}

function addMessageToChat(data: any) {
  console.log('Adding to chat:', data);
}

function logSecurityEvent(origin: string, message: string) {
  console.log('Security event logged:', { origin, message });
}

function handleUserClick(data: any) {
  console.log('Handling click:', data);
}

function updateUserStatus(data: any) {
  console.log('Updating user status:', data);
}

function syncStorageChange(data: any) {
  console.log('Syncing storage:', data);
}

function processSecureMessage(data: any) {
  console.log('Processing secure message:', data);
}

function blockOrigin(origin: string) {
  console.log('Blocking origin:', origin);
}

function trackUserInteraction(data: any) {
  console.log('Tracking interaction:', data);
}

function updateUserProfile(data: any) {
  console.log('Updating profile:', data);
}

function updateProductDisplay(productId: string, price: number, stock: number) {
  console.log('Updating product:', { productId, price, stock });
}

function showDiscountBadge(discount: number) {
  console.log('Showing discount:', discount);
}

function submitForm(email: string, password: string) {
  console.log('Submitting form:', { email, password });
}

function showTermsError() {
  console.log('Terms not agreed to');
}

function showValidationError(message: string) {
  console.log('Validation error:', message);
}

function trackEvent(event: string, properties: any, userId?: string) {
  console.log('Tracking event:', { event, properties, userId });
}

function resizeIframe(height: number) {
  console.log('Resizing iframe to:', height);
}

function syncScroll(scrollTop: number) {
  console.log('Syncing scroll to:', scrollTop);
}

function focusIframe() {
  console.log('Focusing iframe');
}

function saveToDatabase(data: any) {
  console.log('Saving to database:', data);
}

function updateUI(data: any) {
  console.log('Updating UI:', data);
}

function extractPartialData(error: string): any {
  // Mock implementation
  return { partial: true };
}

function updateFullProfile(data: any) {
  console.log('Updating full profile:', data);
}

function updatePartialProfile(data: any) {
  console.log('Updating partial profile:', data);
}

function trackClick(data: any) {
  console.log('Tracking click:', data);
} 