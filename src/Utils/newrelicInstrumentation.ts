import newrelic from 'newrelic';

/**
 * New Relic instrumentation utilities for Offbeat Backend
 * Provides custom monitoring, logging, and performance tracking
 */

// Helper to clean attributes for New Relic
const cleanAttributes = (attributes: Record<string, any>) => {
  return Object.fromEntries(
    Object.entries(attributes).filter(
      ([_, value]) => value !== undefined && value !== null
    )
  );
};

// Add custom attributes to transactions
export const addTransactionAttributes = (attributes: Record<string, any>) => {
  Object.entries(attributes).forEach(([key, value]) => {
    newrelic.addCustomAttribute(key, value);
  });
};

// Track user actions with custom events
export const trackUserAction = (
  action: string,
  userId?: string,
  additionalData?: Record<string, any>
) => {
  newrelic.recordCustomEvent('UserAction', {
    action,
    userId: userId || 'anonymous',
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
};

// Track business metrics
export const trackBusinessMetric = (
  metricName: string,
  value: number,
  attributes?: Record<string, any>
) => {
  newrelic.recordCustomEvent('BusinessMetric', {
    metricName,
    value,
    timestamp: new Date().toISOString(),
    ...attributes,
  });
};

// Track API performance
export const trackApiCall = (
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  userId?: string
) => {
  newrelic.recordCustomEvent('ApiCall', {
    endpoint,
    method,
    statusCode,
    responseTime,
    userId: userId || 'anonymous',
    timestamp: new Date().toISOString(),
  });
};

// Track errors with context
export const trackError = (error: Error, context?: Record<string, any>) => {
  const cleanContext = context
    ? Object.fromEntries(
        Object.entries(context).filter(([_, value]) => value !== undefined)
      )
    : undefined;

  newrelic.recordCustomEvent('ApplicationError', {
    errorName: error.name,
    errorMessage: error.message,
    stack: error.stack || 'No stack trace',
    timestamp: new Date().toISOString(),
    ...cleanContext,
  });
  newrelic.noticeError(error, cleanContext);
};

// Track database operations
export const trackDatabaseOperation = (
  operation: string,
  collection: string,
  duration: number,
  success: boolean
) => {
  newrelic.recordCustomEvent('DatabaseOperation', {
    operation,
    collection,
    duration,
    success,
    timestamp: new Date().toISOString(),
  });
};

// Track file upload operations
export const trackFileUpload = (
  fileType: string,
  fileSize: number,
  success: boolean,
  userId?: string
) => {
  newrelic.recordCustomEvent('FileUpload', {
    fileType,
    fileSize,
    success,
    userId: userId || 'anonymous',
    timestamp: new Date().toISOString(),
  });
};

// Middleware for automatic API tracking
export const apiTrackingMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Add user context if available
  if (req.user?.id) {
    addTransactionAttributes({
      userId: req.user.id,
      userEmail: req.user.email,
    });
  }

  // Track request
  trackUserAction('api_request', req.user?.id, {
    endpoint: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
  });

  res.send = function (data: any) {
    const duration = Date.now() - startTime;

    // Track API call completion
    trackApiCall(req.path, req.method, res.statusCode, duration, req.user?.id);

    // Track business metrics based on endpoint
    if (req.path.includes('/auth/') && res.statusCode === 200) {
      trackBusinessMetric('auth_success', 1, { endpoint: req.path });
    } else if (req.path.includes('/booking') && res.statusCode === 201) {
      trackBusinessMetric('booking_created', 1);
    } else if (req.path.includes('/stories') && res.statusCode === 201) {
      trackBusinessMetric('story_created', 1);
    } else if (req.path.includes('/host') && res.statusCode === 200) {
      trackBusinessMetric('host_registration', 1);
    }

    originalSend.call(this, data);
  };

  next();
};

// Firebase auth tracking
export const trackFirebaseAuth = (
  action:
    | 'login'
    | 'register'
    | 'sync'
    | 'verify_token'
    | 'auto_provision'
    | 'google_login'
    | 'google_register',
  userId: string,
  success: boolean,
  additionalData?: Record<string, any>
) => {
  newrelic.recordCustomEvent('FirebaseAuth', {
    action,
    userId,
    success,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
};

// Booking tracking
export const trackBookingOperation = (
  operation: string,
  bookingId?: string,
  userId?: string,
  success?: boolean
) => {
  newrelic.recordCustomEvent(
    'BookingOperation',
    cleanAttributes({
      operation,
      bookingId,
      userId: userId || 'anonymous',
      success,
      timestamp: new Date().toISOString(),
    })
  );
};

// Story tracking
export const trackStoryOperation = (
  operation: string,
  storyId?: string,
  userId?: string,
  success?: boolean
) => {
  newrelic.recordCustomEvent(
    'StoryOperation',
    cleanAttributes({
      operation,
      storyId,
      userId: userId || 'anonymous',
      success,
      timestamp: new Date().toISOString(),
    })
  );
};

// Host registration tracking
export const trackHostOperation = (
  operation: string,
  userId?: string,
  step?: number,
  success?: boolean
) => {
  newrelic.recordCustomEvent(
    'HostOperation',
    cleanAttributes({
      operation,
      userId: userId || 'anonymous',
      step,
      success,
      timestamp: new Date().toISOString(),
    })
  );
};
