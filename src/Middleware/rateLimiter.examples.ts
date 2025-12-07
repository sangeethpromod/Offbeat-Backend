/**
 * RATE LIMITER USAGE EXAMPLES
 *
 * This file demonstrates how to use the rate limiter middleware
 * in various scenarios throughout the application.
 */

import { Router } from 'express';
import {
  rateLimiter,
  strictRateLimiter,
  createRateLimiter,
  getRateLimiterStats,
} from '../Middleware/rateLimiter';

const exampleRoutes = Router();

// ============================================================
// EXAMPLE 1: Using default rate limiter
// ============================================================
// Default limits:
// - 20 requests/min per user
// - 3 requests/sec burst per user
// - 60 requests/min per IP
// - 5 requests/sec burst per IP

exampleRoutes.post('/api/bookings/create', rateLimiter, (req, res) => {
  res.json({ success: true, message: 'Booking created' });
});

// ============================================================
// EXAMPLE 2: Using strict rate limiter for sensitive endpoints
// ============================================================
// Strict limits:
// - 10 requests/min per user
// - 2 requests/sec burst per user
// - 30 requests/min per IP
// - 3 requests/sec burst per IP

exampleRoutes.post('/api/bookings/search', strictRateLimiter, (req, res) => {
  res.json({ success: true, results: [] });
});

// ============================================================
// EXAMPLE 3: Creating custom rate limiter for specific needs
// ============================================================
// Custom configuration for admin endpoints
const adminRateLimiter = createRateLimiter({
  perUserPerMinute: 100,
  perUserPerSecond: 10,
  perIpPerMinute: 200,
  perIpPerSecond: 20,
});

exampleRoutes.post('/api/admin/approve', adminRateLimiter, (req, res) => {
  res.json({ success: true, message: 'Approved' });
});

// ============================================================
// EXAMPLE 4: Very restrictive rate limiter for expensive operations
// ============================================================
const expensiveOperationLimiter = createRateLimiter({
  perUserPerMinute: 5,
  perUserPerSecond: 1,
  perIpPerMinute: 10,
  perIpPerSecond: 2,
  globalPerMinute: 1000,
  globalPerSecond: 20,
});

exampleRoutes.post(
  '/api/reports/generate',
  expensiveOperationLimiter,
  (req, res) => {
    res.json({ success: true, message: 'Report generation started' });
  }
);

// ============================================================
// EXAMPLE 5: Monitoring endpoint (no rate limiting)
// ============================================================
exampleRoutes.get('/api/monitoring/rate-limiter-stats', (req, res) => {
  const stats = getRateLimiterStats();
  res.json({
    success: true,
    data: stats,
  });
});

// ============================================================
// EXAMPLE 6: Applying to multiple routes at once
// ============================================================
const protectedRoutes = Router();
protectedRoutes.use(rateLimiter); // Apply to all routes in this router

protectedRoutes.get('/api/profile', (req, res) => {
  res.json({ success: true, profile: {} });
});

protectedRoutes.post('/api/settings', (req, res) => {
  res.json({ success: true, message: 'Settings updated' });
});

// ============================================================
// HOW IT WORKS
// ============================================================
/**
 * SLIDING WINDOW ALGORITHM:
 * - Tracks timestamps of each request in memory
 * - Counts requests within last 60 seconds for per-minute limit
 * - Counts requests within last 1 second for burst limit
 * - Auto-cleans old entries every 5 minutes to prevent memory leaks
 *
 * MULTI-TIER PROTECTION:
 * 1. Global limit - Protects entire system from overload
 * 2. IP limit - Prevents abuse from single IP
 * 3. User limit - Fair usage per authenticated user
 *
 * MEMORY MANAGEMENT:
 * - Uses Map data structures for O(1) lookups
 * - Automatic cleanup every 5 minutes
 * - Only stores timestamps (8 bytes each)
 * - Removes entries with no recent requests
 *
 * ERROR RESPONSES:
 * HTTP 429 with JSON:
 * {
 *   "success": false,
 *   "message": "Rate limit exceeded. Please slow down your requests."
 * }
 *
 * PRODUCTION CONSIDERATIONS:
 * - No external dependencies (Redis, etc.)
 * - Works across all Node.js instances (in-memory per instance)
 * - For multi-server deployments, consider:
 *   - Each server has its own rate limit
 *   - Total limit = serverCount × perServerLimit
 *   - Or implement Redis-based limiter for shared state
 */

// ============================================================
// CONFIGURATION OPTIONS
// ============================================================
/**
 * interface RateLimitConfig {
 *   perUserPerMinute: number;   // Max requests per user per minute
 *   perUserPerSecond: number;   // Max burst requests per user per second
 *   perIpPerMinute: number;     // Max requests per IP per minute
 *   perIpPerSecond: number;     // Max burst requests per IP per second
 *   globalPerMinute: number;    // Max total requests per minute (all users)
 *   globalPerSecond: number;    // Max total burst requests per second (all users)
 * }
 *
 * Default values:
 * {
 *   perUserPerMinute: 20,
 *   perUserPerSecond: 3,
 *   perIpPerMinute: 60,
 *   perIpPerSecond: 5,
 *   globalPerMinute: 5000,
 *   globalPerSecond: 100,
 * }
 */

export default exampleRoutes;
