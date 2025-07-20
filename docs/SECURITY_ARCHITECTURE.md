# Security Architecture Documentation

## Overview

Guardz Event implements a comprehensive security architecture designed to protect applications from malicious event data and cross-origin attacks. The security model is built on multiple layers of validation and follows the principle of defense in depth.

## Security Principles

### 1. Zero Trust Model
- All incoming event data is considered untrusted by default
- Every piece of data must pass validation before processing
- No assumptions about data integrity or source trustworthiness

### 2. Defense in Depth
- Multiple layers of security validation
- Fail-safe error handling
- Comprehensive logging and monitoring

### 3. Type Safety as Security
- Runtime type validation prevents type-based attacks
- Strong typing prevents injection attacks
- Type guards ensure data integrity

### 4. Security by Design
- Security features are built into the core architecture
- No opt-in security features
- Default secure configurations

## Security Layers

### Layer 1: Event Structure Validation

**Purpose**: Validate that events have the expected structure and properties.

**Implementation**:
```typescript
// Validate event object exists and has required properties
if (!event || typeof event !== 'object') {
  return {
    status: Status.ERROR,
    code: 500,
    message: 'Invalid event: Event is null or undefined'
  };
}

// Validate event type
if (!event.type || typeof event.type !== 'string') {
  return {
    status: Status.ERROR,
    code: 500,
    message: 'Invalid event: Missing or invalid event type'
  };
}
```

**Security Benefits**:
- Prevents null/undefined attacks
- Ensures event structure integrity
- Reduces attack surface

### Layer 2: Origin Validation

**Purpose**: Validate the origin of cross-origin messages to prevent malicious data injection.

**Implementation**:
```typescript
// PostMessage origin validation
if (config.allowedOrigins && event instanceof MessageEvent) {
  const origin = event.origin;
  
  if (!config.allowedOrigins.includes(origin)) {
    const error: SecurityError = {
      code: 'SECURITY_ERROR',
      message: `PostMessage origin not allowed: ${origin}`,
      source: origin
    };
    
    return {
      status: Status.ERROR,
      code: 403,
      message: error.message
    };
  }
}
```

**Security Benefits**:
- Prevents cross-site scripting (XSS) attacks
- Protects against malicious iframe communication
- Ensures message authenticity

**Configuration**:
```typescript
const safeHandler = safePostMessageListener(
  isUserMessage,
  {
    allowedOrigins: [
      'https://trusted-domain.com',
      'https://api.example.com'
    ],
    onSecurityViolation: (origin, message) => {
      console.error(`Security violation from ${origin}: ${message}`);
    }
  }
);
```

### Layer 3: Source Validation

**Purpose**: Validate the source of events to ensure they come from trusted sources.

**Implementation**:
```typescript
// Source validation for PostMessage events
if (config.allowedSources && event instanceof MessageEvent) {
  const source = event.source;
  
  if (source && typeof source === 'object') {
    // For real Window objects, check location
    const sourceUrl = (source as any).location?.href;
    if (sourceUrl && !config.allowedSources.some(allowed => sourceUrl.includes(allowed))) {
      const error: SecurityError = {
        code: 'SECURITY_ERROR',
        message: `Source not allowed: ${sourceUrl}`,
        source: sourceUrl
      };
      
      return {
        status: Status.ERROR,
        code: 403,
        message: error.message
      };
    }
  }
}
```

**Security Benefits**:
- Prevents message spoofing
- Ensures source authenticity
- Protects against window reference attacks

**Configuration**:
```typescript
const safeHandler = safePostMessageListener(
  isUserMessage,
  {
    allowedSources: ['trusted-iframe', 'main-window'],
    onSecurityViolation: (source, message) => {
      console.error(`Security violation from source ${source}: ${message}`);
    }
  }
);
```

### Layer 4: Type Validation

**Purpose**: Validate event data types using guardz runtime type checking.

**Implementation**:
```typescript
// Type validation with guardz
try {
  if (config.guard(data)) {
    return {
      status: Status.SUCCESS,
      data: data as T
    };
  } else {
    return {
      status: Status.ERROR,
      code: 500,
      message: `Validation failed: ${config.identifier || 'event data'}`
    };
  }
} catch (error) {
  // Handle type guard errors
  const errorMessage = error instanceof Error ? error.message : 'Type guard error';
  return {
    status: Status.ERROR,
    code: 500,
    message: errorMessage
  };
}
```

**Security Benefits**:
- Prevents type-based attacks
- Ensures data integrity
- Protects against injection attacks

**Example Type Guards**:
```typescript
import { isType, isString, isNumber, isBoolean } from 'guardz';

interface UserMessage {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

const isUserMessage = isType<UserMessage>({
  id: isNumber,
  name: isString,
  email: isString,
  isActive: isBoolean
});
```

### Layer 5: Tolerance Mode Security

**Purpose**: Provide graceful degradation while maintaining security in tolerance mode.

**Implementation**:
```typescript
// Tolerance mode with security preservation
if (config.tolerance) {
  try {
    if (config.guard(data)) {
      // Valid data - return success
      return {
        status: Status.SUCCESS,
        data: data as T
      };
    } else {
      // Invalid data - still return error for security
      const errorMessage = `Validation failed: ${config.identifier || 'event data'}`;
      
      // Call error callback for logging
      if (config.onError) {
        try {
          config.onError(errorMessage, {
            type: 'validation',
            eventType: event.type,
            identifier: config.identifier || 'event data',
            originalError: errorMessage
          });
        } catch (_callbackError) {
          // Ignore callback errors in tolerance mode
        }
      }
      
      // Return error to maintain security
      return {
        status: Status.ERROR,
        code: 500,
        message: errorMessage
      };
    }
  } catch (error) {
    // Handle type guard errors in tolerance mode
    const errorMessage = error instanceof Error ? error.message : 'Type guard error';
    
    if (config.onError) {
      try {
        config.onError(errorMessage, {
          type: 'validation',
          eventType: event.type,
          identifier: config.identifier || 'event data',
          originalError: error
        });
      } catch (_callbackError) {
        // Ignore callback errors in tolerance mode
      }
    }
    
    return {
      status: Status.ERROR,
      code: 500,
      message: errorMessage
    };
  }
}
```

**Security Benefits**:
- Maintains security even in tolerance mode
- Provides logging for security monitoring
- Prevents silent failures

## Security Error Types

### 1. SecurityError
```typescript
interface SecurityError {
  code: 'SECURITY_ERROR';
  message: string;
  source: string;
}
```

**Usage**: For origin and source validation failures.

### 2. ValidationError
```typescript
interface ValidationError {
  code: 'VALIDATION_ERROR';
  message: string;
  identifier: string;
}
```

**Usage**: For type validation failures.

### 3. ErrorContext
```typescript
interface ErrorContext {
  type: 'validation' | 'security' | 'timeout' | 'unknown';
  eventType: string;
  origin?: string;
  source?: string;
  originalError?: unknown;
  identifier?: string;
}
```

**Usage**: For comprehensive error context and logging.

## Security Configuration

### 1. Origin Security
```typescript
const secureConfig = {
  allowedOrigins: [
    'https://trusted-domain.com',
    'https://api.example.com',
    'https://cdn.trusted.com'
  ]
};
```

**Best Practices**:
- Use HTTPS only
- Be specific with domains
- Avoid wildcards
- Regular review and updates

### 2. Source Security
```typescript
const secureConfig = {
  allowedSources: [
    'trusted-iframe',
    'main-window',
    'service-worker'
  ]
};
```

**Best Practices**:
- Define specific source identifiers
- Validate source authenticity
- Monitor source changes

### 3. Type Security
```typescript
const secureConfig = {
  guard: isStrictUserMessage, // Strict type guard
  tolerance: false, // Disable tolerance for sensitive data
  validateEvent: true // Enable event structure validation
};
```

**Best Practices**:
- Use strict type guards
- Disable tolerance for sensitive data
- Enable event validation

## Security Monitoring

### 1. Error Tracking
```typescript
const secureHandler = safePostMessageListener(
  isUserMessage,
  {
    allowedOrigins: ['https://trusted.com'],
    onSecurityViolation: (origin, message) => {
      // Log security violations
      console.error(`Security violation: ${message} from ${origin}`);
      
      // Send to monitoring service
      securityMonitor.trackViolation({
        type: 'origin_violation',
        origin,
        message,
        timestamp: Date.now()
      });
    },
    onTypeMismatch: (error) => {
      // Log validation failures
      console.warn(`Validation failure: ${error}`);
      
      // Send to monitoring service
      securityMonitor.trackViolation({
        type: 'validation_failure',
        error,
        timestamp: Date.now()
      });
    }
  }
);
```

### 2. Security Metrics
```typescript
interface SecurityMetrics {
  originViolations: number;
  sourceViolations: number;
  validationFailures: number;
  totalEvents: number;
  securityScore: number;
}
```

### 3. Alerting
```typescript
// Security alert thresholds
const SECURITY_THRESHOLDS = {
  originViolationsPerMinute: 10,
  validationFailuresPerMinute: 50,
  securityScoreThreshold: 0.8
};
```

## Security Best Practices

### 1. Configuration Security
```typescript
// ✅ Good: Specific origins
const goodConfig = {
  allowedOrigins: ['https://api.example.com']
};

// ❌ Bad: Wildcard origins
const badConfig = {
  allowedOrigins: ['*']
};
```

### 2. Type Guard Security
```typescript
// ✅ Good: Strict validation
const isSecureUserMessage = isType<UserMessage>({
  id: isNumber,
  name: isString,
  email: isEmail, // Custom email validator
  isActive: isBoolean
});

// ❌ Bad: Loose validation
const isLooseUserMessage = (data: any) => true;
```

### 3. Error Handling Security
```typescript
// ✅ Good: Secure error handling
const secureHandler = safePostMessageListener(
  isUserMessage,
  {
    onError: (error, context) => {
      // Log error without exposing sensitive data
      logger.error('Event processing error', {
        type: context.type,
        eventType: context.eventType,
        timestamp: Date.now()
      });
    }
  }
);

// ❌ Bad: Exposing sensitive data
const insecureHandler = safePostMessageListener(
  isUserMessage,
  {
    onError: (error, context) => {
      console.error('Full error:', error, context); // Exposes sensitive data
    }
  }
);
```

## Security Testing

### 1. Penetration Testing
```typescript
// Test origin validation
describe('Security: Origin Validation', () => {
  it('should reject messages from untrusted origins', () => {
    const maliciousEvent = new MessageEvent('message', {
      origin: 'https://malicious-site.com',
      data: { id: 1, name: 'John' }
    });
    
    const result = handler(maliciousEvent);
    expect(result.status).toBe(Status.ERROR);
    expect(result.code).toBe(403);
  });
});
```

### 2. Fuzzing Tests
```typescript
// Test with malformed data
describe('Security: Data Fuzzing', () => {
  it('should handle malformed event data', () => {
    const malformedEvents = [
      null,
      undefined,
      'not-an-object',
      { type: null },
      { type: 123 },
      { type: '', data: null }
    ];
    
    malformedEvents.forEach(event => {
      const result = handler(event);
      expect(result.status).toBe(Status.ERROR);
    });
  });
});
```

### 3. Type Injection Tests
```typescript
// Test type-based attacks
describe('Security: Type Injection', () => {
  it('should prevent prototype pollution', () => {
    const maliciousData = {
      id: 1,
      name: 'John',
      __proto__: { isAdmin: true }
    };
    
    const result = handler(new MessageEvent('message', { data: maliciousData }));
    expect(result.status).toBe(Status.ERROR);
  });
});
```

## Security Compliance

### 1. OWASP Top 10
- **A03:2021 - Injection**: Prevented by type validation
- **A05:2021 - Security Misconfiguration**: Prevented by secure defaults
- **A07:2021 - Identification and Authentication Failures**: Prevented by origin validation

### 2. CSP (Content Security Policy)
```typescript
// Compatible with strict CSP
const cspCompatibleHandler = safePostMessageListener(
  isUserMessage,
  {
    allowedOrigins: ['https://trusted.com'],
    // No eval() or dynamic code execution
    // No inline scripts
    // No unsafe eval
  }
);
```

### 3. GDPR Compliance
```typescript
// Privacy-aware error handling
const gdprCompliantHandler = safePostMessageListener(
  isUserMessage,
  {
    onError: (error, context) => {
      // Don't log personal data
      logger.error('Event processing error', {
        type: context.type,
        eventType: context.eventType,
        // No personal data logged
      });
    }
  }
);
```

## Security Incident Response

### 1. Detection
```typescript
// Real-time security monitoring
const securityMonitor = {
  trackViolation: (violation: SecurityViolation) => {
    // Log violation
    logger.warn('Security violation detected', violation);
    
    // Check thresholds
    if (this.isThresholdExceeded(violation.type)) {
      this.triggerAlert(violation);
    }
  },
  
  triggerAlert: (violation: SecurityViolation) => {
    // Send alert to security team
    alertService.send({
      type: 'security_violation',
      severity: 'high',
      details: violation
    });
  }
};
```

### 2. Response
```typescript
// Incident response procedures
const incidentResponse = {
  handleSecurityViolation: (violation: SecurityViolation) => {
    // 1. Isolate affected components
    this.isolateComponent(violation.component);
    
    // 2. Block malicious origins
    this.blockOrigin(violation.origin);
    
    // 3. Increase monitoring
    this.increaseMonitoring(violation.type);
    
    // 4. Notify stakeholders
    this.notifyStakeholders(violation);
  }
};
```

### 3. Recovery
```typescript
// Recovery procedures
const recoveryProcedures = {
  restoreSecurity: () => {
    // 1. Review security logs
    this.reviewSecurityLogs();
    
    // 2. Update security rules
    this.updateSecurityRules();
    
    // 3. Test security measures
    this.testSecurityMeasures();
    
    // 4. Resume normal operations
    this.resumeOperations();
  }
};
```

## Conclusion

The security architecture of Guardz Event provides comprehensive protection against various types of attacks while maintaining performance and usability. The multi-layered approach ensures that even if one security measure fails, others will continue to provide protection. The security model is designed to be both robust and flexible, allowing developers to configure security measures appropriate for their specific use cases while maintaining strong default security settings. 