'use strict';

/**
 * New Relic agent configuration.
 *
 * See lib/config/default.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
  /**
   * Array of application names.
   */
  app_name: ['Offbeat Backend-Development'],

  /**
   * Your New Relic license key.
   */
  license_key: process.env.NEW_RELIC_LICENSE_KEY,

  /**
   * Disable New Relic if no license key is provided or if it's a placeholder
   * Set to true for development testing with valid license key
   */
  agent_enabled:
    !!process.env.NEW_RELIC_LICENSE_KEY &&
    process.env.NEW_RELIC_LICENSE_KEY !==
      '75cee650bbfcc20188a14f6035bce234FFFFNRAL' &&
    process.env.NEW_RELIC_LICENSE_KEY.length > 20, // Basic validation

  /**
   * This setting controls distributed tracing.
   * Set to `true` to enable distributed tracing.
   * Set to `false` to disable distributed tracing.
   *
   * @see https://docs.newrelic.com/docs/distributed-tracing
   */
  distributed_tracing: {
    enabled: true,
  },

  /**
   * This setting controls the use of logging for audit purposes.
   * Set to `true` to enable audit logging.
   * Set to `false` to disable audit logging.
   *
   * @default false
   * @see https://docs.newrelic.com/docs/logs/java/enable-logs-context-java
   */
  logging: {
    level: 'debug', // More verbose logging for development
  },

  /**
   * When true, all request headers except for those listed in attributes.exclude
   * will be captured for all traces, unless otherwise specified in a destination's
   * attributes include/exclude lists.
   */
  allow_all_headers: true,

  /**
   * Attributes to include in all destinations.
   */
  attributes: {
    include: ['request.parameters.*'],
  },

  /**
   * Development-specific settings
   */
  error_collector: {
    enabled: true,
    ignore_status_codes: [404], // Don't report 404s as errors
  },

  transaction_tracer: {
    enabled: true,
    record_sql: 'raw', // Show full SQL queries in development
  },
};
