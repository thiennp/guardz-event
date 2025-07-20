import { guardWithTolerance } from 'guardz';
import type { TypeGuardFn } from 'guardz';
import { Status } from '../types/status-types';
import { EventResult, SafeEventConfig, ErrorContext } from './safe-event-never-throws';

// ===============================
// Observer-based Event Sources
// ===============================

/**
 * Safe Intersection Observer handler
 * Usage: const safeIntersectionHandler = safeIntersectionObserver({ guard: isIntersectionData });
 *        observer.observe(element);
 */
export function safeIntersectionObserver<T>(config: SafeEventConfig<T>) {
  return (entries: IntersectionObserverEntry[]): EventResult<T>[] => {
    return entries.map(entry => {
      try {
        const data = {
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          boundingClientRect: entry.boundingClientRect,
          rootBounds: entry.rootBounds,
          target: entry.target,
          time: entry.time
        };

        if (config.tolerance) {
          const result = guardWithTolerance(data, config.guard);
          const isValid = config.guard(result);
          
          if (isValid) {
            return { status: Status.SUCCESS, data: result };
          } else {
            const errorMessage = `Validation failed: Data does not match expected type`;
            if (config.onError) {
              config.onError(errorMessage, {
                type: 'validation',
                eventType: 'intersection',
                originalError: errorMessage
              });
            }
            return { status: Status.SUCCESS, data: result };
          }
        } else {
          if (config.guard(data)) {
            return { status: Status.SUCCESS, data };
          } else {
            return { status: Status.ERROR, code: 500, message: 'Validation failed: Data does not match expected type' };
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (config.onError) {
          config.onError(errorMessage, {
            type: 'unknown',
            eventType: 'intersection',
            originalError: error
          });
        }
        return { status: Status.ERROR, code: 500, message: errorMessage };
      }
    });
  };
}

/**
 * Safe Resize Observer handler
 * Usage: const safeResizeHandler = safeResizeObserver({ guard: isResizeData });
 *        observer.observe(element);
 */
export function safeResizeObserver<T>(config: SafeEventConfig<T>) {
  return (entries: ResizeObserverEntry[]): EventResult<T>[] => {
    return entries.map(entry => {
      try {
        const data = {
          contentRect: entry.contentRect,
          borderBoxSize: entry.borderBoxSize,
          contentBoxSize: entry.contentBoxSize,
          devicePixelContentBoxSize: entry.devicePixelContentBoxSize,
          target: entry.target
        };

        if (config.tolerance) {
          const result = guardWithTolerance(data, config.guard);
          const isValid = config.guard(result);
          
          if (isValid) {
            return { status: Status.SUCCESS, data: result };
          } else {
            const errorMessage = `Validation failed: Data does not match expected type`;
            if (config.onError) {
              config.onError(errorMessage, {
                type: 'validation',
                eventType: 'resize',
                originalError: errorMessage
              });
            }
            return { status: Status.SUCCESS, data: result };
          }
        } else {
          if (config.guard(data)) {
            return { status: Status.SUCCESS, data };
          } else {
            return { status: Status.ERROR, code: 500, message: 'Validation failed: Data does not match expected type' };
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (config.onError) {
          config.onError(errorMessage, {
            type: 'unknown',
            eventType: 'resize',
            originalError: error
          });
        }
        return { status: Status.ERROR, code: 500, message: errorMessage };
      }
    });
  };
}

/**
 * Safe Mutation Observer handler
 * Usage: const safeMutationHandler = safeMutationObserver({ guard: isMutationData });
 *        observer.observe(target, config);
 */
export function safeMutationObserver<T>(config: SafeEventConfig<T>) {
  return (mutations: MutationRecord[]): EventResult<T>[] => {
    return mutations.map(mutation => {
      try {
        const data = {
          type: mutation.type,
          target: mutation.target,
          addedNodes: mutation.addedNodes,
          removedNodes: mutation.removedNodes,
          previousSibling: mutation.previousSibling,
          nextSibling: mutation.nextSibling,
          attributeName: mutation.attributeName,
          attributeNamespace: mutation.attributeNamespace,
          oldValue: mutation.oldValue
        };

        if (config.tolerance) {
          const result = guardWithTolerance(data, config.guard);
          const isValid = config.guard(result);
          
          if (isValid) {
            return { status: Status.SUCCESS, data: result };
          } else {
            const errorMessage = `Validation failed: Data does not match expected type`;
            if (config.onError) {
              config.onError(errorMessage, {
                type: 'validation',
                eventType: 'mutation',
                originalError: errorMessage
              });
            }
            return { status: Status.SUCCESS, data: result };
          }
        } else {
          if (config.guard(data)) {
            return { status: Status.SUCCESS, data };
          } else {
            return { status: Status.ERROR, code: 500, message: 'Validation failed: Data does not match expected type' };
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (config.onError) {
          config.onError(errorMessage, {
            type: 'unknown',
            eventType: 'mutation',
            originalError: error
          });
        }
        return { status: Status.ERROR, code: 500, message: errorMessage };
      }
    });
  };
}

/**
 * Safe Performance Observer handler
 * Usage: const safePerformanceHandler = safePerformanceObserver({ guard: isPerformanceData });
 *        observer.observe({ entryTypes: ['navigation'] });
 */
export function safePerformanceObserver<T>(config: SafeEventConfig<T>) {
  return (list: PerformanceObserverEntryList): EventResult<T>[] => {
    return list.getEntries().map(entry => {
      try {
        const data = {
          entries: list.getEntries(),
          observer: list.observer
        };

        if (config.tolerance) {
          const result = guardWithTolerance(config.guard, data);
          if (result.valid) {
            return { status: Status.SUCCESS, data: result.data };
          } else {
            if (config.onError) {
              config.onError(result.error, {
                type: 'validation',
                eventType: 'performance',
                originalError: result.error
              });
            }
            return { status: Status.ERROR, code: 500, message: `Validation failed: ${result.error}` };
          }
        } else {
          if (config.guard(data)) {
            return { status: Status.SUCCESS, data };
          } else {
            return { status: Status.ERROR, code: 500, message: 'Validation failed: Data does not match expected type' };
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (config.onError) {
          config.onError(errorMessage, {
            type: 'unknown',
            eventType: 'performance',
            originalError: error
          });
        }
        return { status: Status.ERROR, code: 500, message: errorMessage };
      }
    });
  };
}

// ===============================
// Device API Event Sources
// ===============================

/**
 * Safe Geolocation handler
 * Usage: const safeGeoHandler = safeGeolocation({ guard: isGeoData });
 *        navigator.geolocation.getCurrentPosition(safeGeoHandler);
 */
export function safeGeolocation<T>(config: SafeEventConfig<T>) {
  return (position: GeolocationPosition): EventResult<T> => {
    try {
      const data = {
        coords: position.coords,
        timestamp: position.timestamp
      };

      if (config.tolerance) {
        const result = guardWithTolerance(config.guard, data);
        if (result.valid) {
          return { status: Status.SUCCESS, data: result.data };
        } else {
          if (config.onError) {
            config.onError(result.error, {
              type: 'validation',
              eventType: 'geolocation',
              originalError: result.error
            });
          }
          return { status: Status.ERROR, code: 500, message: `Validation failed: ${result.error}` };
        }
      } else {
        if (config.guard(data)) {
          return { status: Status.SUCCESS, data };
        } else {
          return { status: Status.ERROR, code: 500, message: 'Validation failed: Data does not match expected type' };
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (config.onError) {
        config.onError(errorMessage, {
          type: 'unknown',
          eventType: 'geolocation',
          originalError: error
        });
      }
      return { status: Status.ERROR, code: 500, message: errorMessage };
    }
  };
}

/**
 * Safe Device Orientation handler
 * Usage: const safeOrientationHandler = safeDeviceOrientation({ guard: isOrientationData });
 *        window.addEventListener('deviceorientation', safeOrientationHandler);
 */
export function safeDeviceOrientation<T>(config: SafeEventConfig<T>) {
  return (event: DeviceOrientationEvent): EventResult<T> => {
    try {
      const data = {
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        absolute: event.absolute
      };

      if (config.tolerance) {
        const result = guardWithTolerance(config.guard, data);
        if (result.valid) {
          return { status: Status.SUCCESS, data: result.data };
        } else {
          if (config.onError) {
            config.onError(result.error, {
              type: 'validation',
              eventType: 'deviceorientation',
              originalError: result.error
            });
          }
          return { status: Status.ERROR, code: 500, message: `Validation failed: ${result.error}` };
        }
      } else {
        if (config.guard(data)) {
          return { status: Status.SUCCESS, data };
        } else {
          return { status: Status.ERROR, code: 500, message: 'Validation failed: Data does not match expected type' };
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (config.onError) {
        config.onError(errorMessage, {
          type: 'unknown',
          eventType: 'deviceorientation',
          originalError: error
        });
      }
      return { status: Status.ERROR, code: 500, message: errorMessage };
    }
  };
}

/**
 * Safe Device Motion handler
 * Usage: const safeMotionHandler = safeDeviceMotion({ guard: isMotionData });
 *        window.addEventListener('devicemotion', safeMotionHandler);
 */
export function safeDeviceMotion<T>(config: SafeEventConfig<T>) {
  return (event: DeviceMotionEvent): EventResult<T> => {
    try {
      const data = {
        acceleration: event.acceleration,
        accelerationIncludingGravity: event.accelerationIncludingGravity,
        rotationRate: event.rotationRate,
        interval: event.interval
      };

      if (config.tolerance) {
        const result = guardWithTolerance(config.guard, data);
        if (result.valid) {
          return { status: Status.SUCCESS, data: result.data };
        } else {
          if (config.onError) {
            config.onError(result.error, {
              type: 'validation',
              eventType: 'devicemotion',
              originalError: result.error
            });
          }
          return { status: Status.ERROR, code: 500, message: `Validation failed: ${result.error}` };
        }
      } else {
        if (config.guard(data)) {
          return { status: Status.SUCCESS, data };
        } else {
          return { status: Status.ERROR, code: 500, message: 'Validation failed: Data does not match expected type' };
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (config.onError) {
        config.onError(errorMessage, {
          type: 'unknown',
          eventType: 'devicemotion',
          originalError: error
        });
      }
      return { status: Status.ERROR, code: 500, message: errorMessage };
    }
  };
}

// ===============================
// Service Worker Event Sources
// ===============================

/**
 * Safe Service Worker Message handler
 * Usage: const safeSWHandler = safeServiceWorkerMessage({ guard: isSWMessageData });
 *        self.addEventListener('message', safeSWHandler);
 */
export function safeServiceWorkerMessage<T>(config: SafeEventConfig<T>) {
  return (event: ExtendableMessageEvent): EventResult<T> => {
    try {
      const data = {
        data: event.data,
        origin: event.origin,
        source: event.source,
        ports: event.ports
      };

      if (config.tolerance) {
        const result = guardWithTolerance(config.guard, data);
        if (result.valid) {
          return { status: Status.SUCCESS, data: result.data };
        } else {
          if (config.onError) {
            config.onError(result.error, {
              type: 'validation',
              eventType: 'serviceworker',
              originalError: result.error
            });
          }
          return { status: Status.ERROR, code: 500, message: `Validation failed: ${result.error}` };
        }
      } else {
        if (config.guard(data)) {
          return { status: Status.SUCCESS, data };
        } else {
          return { status: Status.ERROR, code: 500, message: 'Validation failed: Data does not match expected type' };
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (config.onError) {
        config.onError(errorMessage, {
          type: 'unknown',
          eventType: 'serviceworker',
          originalError: error
        });
      }
      return { status: Status.ERROR, code: 500, message: errorMessage };
    }
  };
}

// ===============================
// Broadcast Channel Event Sources
// ===============================

/**
 * Safe Broadcast Channel handler
 * Usage: const safeBCHandler = safeBroadcastChannel({ guard: isBCData });
 *        channel.addEventListener('message', safeBCHandler);
 */
export function safeBroadcastChannel<T>(config: SafeEventConfig<T>) {
  return (event: MessageEvent): EventResult<T> => {
    try {
      const data = {
        data: event.data,
        origin: event.origin,
        source: event.source
      };

      if (config.tolerance) {
        const result = guardWithTolerance(config.guard, data);
        if (result.valid) {
          return { status: Status.SUCCESS, data: result.data };
        } else {
          if (config.onError) {
            config.onError(result.error, {
              type: 'validation',
              eventType: 'broadcast',
              originalError: result.error
            });
          }
          return { status: Status.ERROR, code: 500, message: `Validation failed: ${result.error}` };
        }
      } else {
        if (config.guard(data)) {
          return { status: Status.SUCCESS, data };
        } else {
          return { status: Status.ERROR, code: 500, message: 'Validation failed: Data does not match expected type' };
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (config.onError) {
        config.onError(errorMessage, {
          type: 'unknown',
          eventType: 'broadcast',
          originalError: error
        });
      }
      return { status: Status.ERROR, code: 500, message: errorMessage };
    }
  };
}

// ===============================
// Payment API Event Sources
// ===============================

/**
 * Safe Payment Request handler
 * Usage: const safePaymentHandler = safePaymentRequest({ guard: isPaymentData });
 *        paymentRequest.addEventListener('paymentmethodchange', safePaymentHandler);
 */
export function safePaymentRequest<T>(config: SafeEventConfig<T>) {
  return (event: PaymentMethodChangeEvent): EventResult<T> => {
    try {
      const data = {
        methodName: event.methodName,
        methodDetails: event.methodDetails
      };

      if (config.tolerance) {
        const result = guardWithTolerance(config.guard, data);
        if (result.valid) {
          return { status: Status.SUCCESS, data: result.data };
        } else {
          if (config.onError) {
            config.onError(result.error, {
              type: 'validation',
              eventType: 'payment',
              originalError: result.error
            });
          }
          return { status: Status.ERROR, code: 500, message: `Validation failed: ${result.error}` };
        }
      } else {
        if (config.guard(data)) {
          return { status: Status.SUCCESS, data };
        } else {
          return { status: Status.ERROR, code: 500, message: 'Validation failed: Data does not match expected type' };
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (config.onError) {
        config.onError(errorMessage, {
          type: 'unknown',
          eventType: 'payment',
          originalError: error
        });
      }
      return { status: Status.ERROR, code: 500, message: errorMessage };
    }
  };
}

// ===============================
// Battery API Event Sources
// ===============================

/**
 * Safe Battery Status handler
 * Usage: const safeBatteryHandler = safeBatteryStatus({ guard: isBatteryData });
 *        battery.addEventListener('levelchange', safeBatteryHandler);
 */
export function safeBatteryStatus<T>(config: SafeEventConfig<T>) {
  return (event: Event): EventResult<T> => {
    try {
      const battery = (navigator as any).getBattery?.();
      if (!battery) {
        return { status: Status.ERROR, code: 500, message: 'Battery API not supported' };
      }

      const data = {
        level: battery.level,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };

      if (config.tolerance) {
        const result = guardWithTolerance(config.guard, data);
        if (result.valid) {
          return { status: Status.SUCCESS, data: result.data };
        } else {
          if (config.onError) {
            config.onError(result.error, {
              type: 'validation',
              eventType: 'battery',
              originalError: result.error
            });
          }
          return { status: Status.ERROR, code: 500, message: `Validation failed: ${result.error}` };
        }
      } else {
        if (config.guard(data)) {
          return { status: Status.SUCCESS, data };
        } else {
          return { status: Status.ERROR, code: 500, message: 'Validation failed: Data does not match expected type' };
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (config.onError) {
        config.onError(errorMessage, {
          type: 'unknown',
          eventType: 'battery',
          originalError: error
        });
      }
      return { status: Status.ERROR, code: 500, message: errorMessage };
    }
  };
}

// ===============================
// Network Information API Event Sources
// ===============================

/**
 * Safe Network Information handler
 * Usage: const safeNetworkHandler = safeNetworkInformation({ guard: isNetworkData });
 *        connection.addEventListener('change', safeNetworkHandler);
 */
export function safeNetworkInformation<T>(config: SafeEventConfig<T>) {
  return (event: Event): EventResult<T> => {
    try {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (!connection) {
        return { status: Status.ERROR, code: 500, message: 'Network Information API not supported' };
      }

      const data = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };

      if (config.tolerance) {
        const result = guardWithTolerance(config.guard, data);
        if (result.valid) {
          return { status: Status.SUCCESS, data: result.data };
        } else {
          if (config.onError) {
            config.onError(result.error, {
              type: 'validation',
              eventType: 'network',
              originalError: result.error
            });
          }
          return { status: Status.ERROR, code: 500, message: `Validation failed: ${result.error}` };
        }
      } else {
        if (config.guard(data)) {
          return { status: Status.SUCCESS, data };
        } else {
          return { status: Status.ERROR, code: 500, message: 'Validation failed: Data does not match expected type' };
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (config.onError) {
        config.onError(errorMessage, {
          type: 'unknown',
          eventType: 'network',
          originalError: error
        });
      }
      return { status: Status.ERROR, code: 500, message: errorMessage };
    }
  };
} 