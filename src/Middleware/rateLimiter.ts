import { Request, Response, NextFunction } from 'express';

/**
 * Request timestamp entry for sliding window
 */
interface RequestEntry {
  timestamp: number;
}

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  perUserPerMinute: number;
  perUserPerSecond: number;
  perIpPerMinute: number;
  perIpPerSecond: number;
  globalPerMinute: number;
  globalPerSecond: number;
}

/**
 * Rate limiter state storage
 */
class RateLimiterStore {
  private userRequests: Map<string, RequestEntry[]> = new Map();
  private ipRequests: Map<string, RequestEntry[]> = new Map();
  private globalRequests: RequestEntry[] = [];
  private lastCleanup: number = Date.now();
  private cleanupInterval: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Add a request timestamp for a user
   */
  addUserRequest(userId: string): void {
    const now = Date.now();
    if (!this.userRequests.has(userId)) {
      this.userRequests.set(userId, []);
    }
    this.userRequests.get(userId)!.push({ timestamp: now });
  }

  /**
   * Add a request timestamp for an IP
   */
  addIpRequest(ip: string): void {
    const now = Date.now();
    if (!this.ipRequests.has(ip)) {
      this.ipRequests.set(ip, []);
    }
    this.ipRequests.get(ip)!.push({ timestamp: now });
  }

  /**
   * Add a request to global counter
   */
  addGlobalRequest(): void {
    const now = Date.now();
    this.globalRequests.push({ timestamp: now });
  }

  /**
   * Get request count within a time window using sliding window
   */
  private getRequestCount(requests: RequestEntry[], windowMs: number): number {
    const now = Date.now();
    const cutoff = now - windowMs;
    return requests.filter(req => req.timestamp > cutoff).length;
  }

  /**
   * Clean old requests from a specific window
   */
  private cleanRequests(
    requests: RequestEntry[],
    windowMs: number
  ): RequestEntry[] {
    const now = Date.now();
    const cutoff = now - windowMs;
    return requests.filter(req => req.timestamp > cutoff);
  }

  /**
   * Check if user is within rate limits
   */
  checkUserLimit(userId: string, config: RateLimitConfig): boolean {
    const requests = this.userRequests.get(userId) || [];

    const perMinute = this.getRequestCount(requests, 60 * 1000);
    const perSecond = this.getRequestCount(requests, 1000);

    return (
      perMinute < config.perUserPerMinute && perSecond < config.perUserPerSecond
    );
  }

  /**
   * Check if IP is within rate limits
   */
  checkIpLimit(ip: string, config: RateLimitConfig): boolean {
    const requests = this.ipRequests.get(ip) || [];

    const perMinute = this.getRequestCount(requests, 60 * 1000);
    const perSecond = this.getRequestCount(requests, 1000);

    return (
      perMinute < config.perIpPerMinute && perSecond < config.perIpPerSecond
    );
  }

  /**
   * Check if global limit is within bounds
   */
  checkGlobalLimit(config: RateLimitConfig): boolean {
    const perMinute = this.getRequestCount(this.globalRequests, 60 * 1000);
    const perSecond = this.getRequestCount(this.globalRequests, 1000);

    return (
      perMinute < config.globalPerMinute && perSecond < config.globalPerSecond
    );
  }

  /**
   * Periodic cleanup to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();

    // Only run cleanup if enough time has passed
    if (now - this.lastCleanup < this.cleanupInterval) {
      return;
    }

    const oneMinute = 60 * 1000;

    // Clean user requests
    for (const [userId, requests] of this.userRequests.entries()) {
      const cleaned = this.cleanRequests(requests, oneMinute);
      if (cleaned.length === 0) {
        this.userRequests.delete(userId);
      } else {
        this.userRequests.set(userId, cleaned);
      }
    }

    // Clean IP requests
    for (const [ip, requests] of this.ipRequests.entries()) {
      const cleaned = this.cleanRequests(requests, oneMinute);
      if (cleaned.length === 0) {
        this.ipRequests.delete(ip);
      } else {
        this.ipRequests.set(ip, cleaned);
      }
    }

    // Clean global requests
    this.globalRequests = this.cleanRequests(this.globalRequests, oneMinute);

    this.lastCleanup = now;
  }

  /**
   * Get current stats for monitoring
   */
  getStats(): {
    totalUsers: number;
    totalIPs: number;
    globalRequestCount: number;
  } {
    return {
      totalUsers: this.userRequests.size,
      totalIPs: this.ipRequests.size,
      globalRequestCount: this.globalRequests.length,
    };
  }
}

// Singleton instance
const store = new RateLimiterStore();

/**
 * Default rate limit configuration
 */
const defaultConfig: RateLimitConfig = {
  perUserPerMinute: 20,
  perUserPerSecond: 3,
  perIpPerMinute: 60,
  perIpPerSecond: 5,
  globalPerMinute: 5000,
  globalPerSecond: 100,
};

/**
 * Rate limiter middleware factory
 * @param config Optional custom configuration
 */
export const createRateLimiter = (config: Partial<RateLimitConfig> = {}) => {
  const finalConfig: RateLimitConfig = { ...defaultConfig, ...config };

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Trigger periodic cleanup
      store.cleanup();

      // Extract user ID from JWT (if authenticated)
      const userId = (req as any).jwtUser?.userId;

      // Extract IP address
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      // Check global limit first (most critical)
      if (!store.checkGlobalLimit(finalConfig)) {
        res.status(429).json({
          success: false,
          message:
            'Rate limit exceeded. System is experiencing high traffic. Please try again later.',
        });
        return;
      }

      // Check IP limit
      if (!store.checkIpLimit(ip, finalConfig)) {
        res.status(429).json({
          success: false,
          message:
            'Rate limit exceeded. Too many requests from your IP address.',
        });
        return;
      }

      // Check user limit (if authenticated)
      if (userId && !store.checkUserLimit(userId, finalConfig)) {
        res.status(429).json({
          success: false,
          message: 'Rate limit exceeded. Please slow down your requests.',
        });
        return;
      }

      // All checks passed - record the request
      store.addGlobalRequest();
      store.addIpRequest(ip);
      if (userId) {
        store.addUserRequest(userId);
      }

      // Proceed to next middleware
      next();
    } catch (error) {
      // If rate limiter fails, log error but don't block request
      console.error('Rate limiter error:', error);
      next();
    }
  };
};

/**
 * Default rate limiter with standard configuration
 */
export const rateLimiter = createRateLimiter();

/**
 * Strict rate limiter for sensitive endpoints (search, etc.)
 */
export const strictRateLimiter = createRateLimiter({
  perUserPerMinute: 10,
  perUserPerSecond: 2,
  perIpPerMinute: 30,
  perIpPerSecond: 3,
});

/**
 * Get rate limiter stats (useful for monitoring/debugging)
 */
export const getRateLimiterStats = () => {
  return store.getStats();
};
