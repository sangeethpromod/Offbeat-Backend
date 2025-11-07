'use strict';

require('dotenv').config({ path: '.env.dev' });

console.log('New Relic Config Debug:', {
  appName: process.env.NEW_RELIC_APP_NAME,
  hasLicenseKey: !!process.env.NEW_RELIC_LICENSE_KEY,
  licenseKeyPrefix: process.env.NEW_RELIC_LICENSE_KEY
    ? process.env.NEW_RELIC_LICENSE_KEY.substring(0, 8) + '...'
    : 'undefined',
});

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'Offbeat-Logs'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,

  /**
   * 1️⃣ This section controls the agent’s own internal logging
   */
  logging: {
    level: 'info', // agent internal logs
    enabled: true,
  },

  /**
   * 2️⃣ This section actually forwards your app’s logs (console, Winston, etc.)
   */
  application_logging: {
    forwarding: {
      enabled: true, // <- THIS is the important one
    },
    metrics: {
      enabled: true, // optional: collects log throughput metrics
    },
    local_decorating: {
      enabled: true, // optional: adds trace/span IDs to logs
    },
  },

  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*',
    ],
  },
};
